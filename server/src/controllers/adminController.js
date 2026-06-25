import mongoose from "mongoose";
import User from "../models/User.js";
import Interview from "../models/Interview.js";
import Payment from "../models/Payment.js";
import { getRedisClient } from "../config/redis.js";
import { getRabbitChannel, publishEvaluationJob } from "../config/rabbitmq.js";
import AuditLog from "../models/AuditLog.js";
import { logAction } from "../utils/auditLogger.js";
const mongoStates = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export const getAdminOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalInterviews,
      completedInterviews,
      failedInterviews,
      evaluatingInterviews,
      paidPayments,
    ] = await Promise.all([
      User.countDocuments(),
      Interview.countDocuments(),
      Interview.countDocuments({ status: "completed" }),
      Interview.countDocuments({ status: "failed" }),
      Interview.countDocuments({ status: "evaluating" }),
      Payment.find({ status: "paid" }).select("amount credits status createdAt"),
    ]);

    const totalRevenue = paidPayments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    const totalCreditsSold = paidPayments.reduce(
      (sum, payment) => sum + (Number(payment.credits) || 0),
      0
    );

    return res.json({
      totalUsers,
      totalInterviews,
      completedInterviews,
      failedInterviews,
      evaluatingInterviews,
      totalPayments: paidPayments.length,
      totalRevenue,
      totalCreditsSold,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to fetch admin overview.",
    });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
   const search = req.query.search || "";

    const query = {
      role: "user",
      ...(search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    const users = await User.find(query)
      .select("name email credits role createdAt")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(users);
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to fetch users.",
    });
  }
};

export const updateUserCredits = async (req, res) => {
  try {
    const { credits } = req.body;

    if (typeof credits !== "number" || credits < 0) {
      return res.status(400).json({
        message: "Credits must be a valid non-negative number.",
      });
    }

 const targetUser = await User.findById(req.params.id);

if (!targetUser) {
  return res.status(404).json({
    message: "User not found.",
  });
}

if (targetUser.role === "admin") {
  return res.status(403).json({
    message: "Admin account credits cannot be updated.",
  });
}

targetUser.credits = credits;
await targetUser.save();

await logAction({
  req,
  action: "ADMIN_UPDATE_USER_CREDITS",
  entityType: "User",
  entityId: targetUser._id,
  targetUser: targetUser._id,
  metadata: {
    updatedCredits: credits,
    targetEmail: targetUser.email,
  },
});

const user = {
  _id: targetUser._id,
  name: targetUser.name,
  email: targetUser.email,
  credits: targetUser.credits,
  role: targetUser.role,
};

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      message: "Credits updated successfully.",
      user,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to update credits.",
    });
  }
};

export const getFailedInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ status: "failed" })
      .populate("user", "name email")
      .select("topic difficulty status score overallFeedback createdAt user")
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json(interviews);
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to fetch failed interviews.",
    });
  }
};

export const getAdminHealth = async (req, res) => {
  try {
    const mongo = mongoStates[mongoose.connection.readyState] || "unknown";

    let redis = "disconnected";
    try {
      const redisClient = getRedisClient();
      redis = redisClient?.isReady ? "connected" : "disconnected";
    } catch {
      redis = "disconnected";
    }

    let rabbitmq = "disconnected";
    try {
      rabbitmq = getRabbitChannel() ? "connected" : "disconnected";
    } catch {
      rabbitmq = "disconnected";
    }

    const allConnected =
      mongo === "connected" &&
      redis === "connected" &&
      rabbitmq === "connected";

    return res.status(allConnected ? 200 : 503).json({
      status: allConnected ? "ok" : "degraded",
      server: "running",
      mongo,
      redis,
      rabbitmq,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to fetch health status.",
    });
  }
};

export const retryFailedInterviewEvaluation = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found.",
      });
    }

    if (interview.status !== "failed") {
      return res.status(400).json({
        message: "Only failed evaluations can be retried.",
      });
    }

    if (!Array.isArray(interview.questions) || interview.questions.length < 5) {
      return res.status(400).json({
        message: "Interview does not have enough answers for evaluation.",
      });
    }

    interview.status = "evaluating";
    interview.isFinished = false;
    interview.currentStep = 6;
    interview.overallFeedback =
      "Admin retry queued. Evaluation is being regenerated.";

    await interview.save();

    await publishEvaluationJob({
      interviewId: interview._id.toString(),
      userId: interview.user?.toString(),
      retry: true,
      triggeredBy: "admin",
    });

    await logAction({
  req,
  action: "ADMIN_RETRY_FAILED_INTERVIEW",
  entityType: "Interview",
  entityId: interview._id,
  targetUser: interview.user,
  metadata: {
    topic: interview.topic,
    difficulty: interview.difficulty,
  },
});

    return res.status(202).json({
      message: "Evaluation retry queued successfully.",
      interviewId: interview._id,
      status: "evaluating",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to retry evaluation.",
    });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("actor", "name email role")
      .populate("targetUser", "name email role")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      status: "success",
      logs,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to fetch audit logs.",
    });
  }
};