import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { logAction } from "../utils/auditLogger.js";

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
const CREDIT_PLANS = {
  starter: { credits: 10, amount: 9900 },
  growth: { credits: 25, amount: 19900 },
  pro: { credits: 50, amount: 34900 },
};

export const createCreditOrder = async (req, res) => {
  try {
    
    const { plan } = req.body;
    const selectedPlan = CREDIT_PLANS[plan];

    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid credit plan" });
    }
const razorpay = getRazorpay();
const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: "INR",
      receipt: `cr_${Date.now()}`,
    });

   const paymentRecord = await Payment.create({
  user: req.user._id,
  razorpayOrderId: order.id,
  amount: selectedPlan.amount,
  credits: selectedPlan.credits,
  status: "created",
});

await logAction({
  req,
  action: "PAYMENT_ORDER_CREATED",
  entityType: "Payment",
  entityId: paymentRecord._id,
  metadata: {
    plan,
    amount: selectedPlan.amount,
    credits: selectedPlan.credits,
    razorpayOrderId: order.id,
  },
});

    res.status(200).json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      credits: selectedPlan.credits,
    });
  } catch (err) {
  console.error("Create order error:", err);
  res.status(500).json({ message: err.message });
}
};

export const verifyCreditPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "Missing Razorpay payment verification fields.",
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed.",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found.",
      });
    }
if (payment.status === "paid") {
  const freshUser = await User.findById(req.user._id).select("credits");

  return res.status(200).json({
    status: "success",
    message: "Payment already verified. Credits were already added.",
    credits: freshUser?.credits ?? req.user.credits,
  });
}

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

const lockedPayment = await Payment.findOneAndUpdate(
  {
    _id: payment._id,
    $or: [
      { status: "created" },
      {
        status: "processing",
        processingAt: { $lt: fiveMinutesAgo },
      },
    ],
  },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "processing",
          processingAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!lockedPayment) {
      const freshUser = await User.findById(req.user._id).select("credits");

      return res.status(200).json({
        status: "success",
        message: "Payment is already being processed.",
        credits: freshUser?.credits ?? req.user.credits,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          credits: lockedPayment.credits,
        },
      },
      {
        new: true,
      }
    ).select("credits");

 lockedPayment.status = "paid";
lockedPayment.paidAt = new Date();
await lockedPayment.save();

await logAction({
  req,
  action: "PAYMENT_VERIFIED_CREDITS_ADDED",
  entityType: "Payment",
  entityId: lockedPayment._id,
  metadata: {
    amount: lockedPayment.amount,
    credits: lockedPayment.credits,
    razorpayPaymentId: razorpay_payment_id,
  },
});

return res.status(200).json({
      status: "success",
      message: "Credits added successfully.",
      credits: updatedUser.credits,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Payment verification failed.",
    });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
  const payments = await Payment.find({
  user: req.user._id,
  status: "paid",
})
  .sort({ createdAt: -1 })
  .select("amount credits status razorpayPaymentId createdAt");

    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};