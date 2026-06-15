import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Groq from "groq-sdk";
import {
  connectRabbitMQ,
  getRabbitChannel,
  AI_EVALUATION_QUEUE,
} from "../config/rabbitmq.js";
import Interview from "../models/Interview.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/intervyo";

let groqInstance = null;

const getGroqClient = () => {
  if (!groqInstance) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY missing");
    }

    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqInstance;
};

const withTimeout = (promise, ms = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Groq evaluation timeout")), ms)
    ),
  ]);
};

const truncateText = (text, maxLength = 1200) => {
  const value = String(text || "");
  return value.length > maxLength ? value.slice(0, maxLength) + "..." : value;
};

const parseJsonStrict = (raw) => {
  let text = String(raw || "").trim();

  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const match = text.match(/\{[\s\S]*\}$/);
  if (match) {
    text = match[0];
  }

  if (!text) {
    throw new Error("Empty AI evaluation response");
  }

  return JSON.parse(text);
};

const normalizeScore = (score) => {
  const value = Number(score);

  if (Number.isNaN(value)) return 0;

  return Math.max(0, Math.min(100, value));
};

const evaluateInterview = async (interviewId) => {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw new Error("Invalid interviewId in evaluation job");
  }

  const interview = await Interview.findById(interviewId);

  if (!interview) {
    throw new Error(`Interview not found: ${interviewId}`);
  }

  if (interview.isFinished || interview.status === "completed") {
    console.log("Interview already completed:", interviewId);
    return;
  }

  const qaText = interview.questions
    .map((q, idx) => {
      const question = truncateText(q.question, 800);
      const answer = truncateText(q.answer || "No answer", 1200);

      return `Q${idx + 1}: ${question}\nA${idx + 1}: ${answer}`;
    })
    .join("\n\n");

  const prompt = `You are a senior technical interviewer.

Evaluate this 5-question mock interview.

Interview Topic: ${truncateText(interview.topic, 100)}
Difficulty: ${interview.difficulty}

Questions and Answers:
${qaText}

Return ONLY valid JSON in this exact schema:
{
  "score": 75,
  "summary": "Short overall evaluation summary.",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

  const groq = getGroqClient();

  const completion = await withTimeout(
    groq.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
    }),
    30000
  );

  const raw = completion?.choices?.[0]?.message?.content || "";
  const report = parseJsonStrict(raw);

  interview.score = normalizeScore(report.score);
  interview.overallFeedback =
    report.summary || "Evaluation completed successfully.";

  interview.strengths = Array.isArray(report.strengths)
    ? report.strengths.slice(0, 5)
    : [];

  interview.weaknesses = Array.isArray(report.weaknesses)
    ? report.weaknesses.slice(0, 5)
    : [];

  interview.suggestions = Array.isArray(report.suggestions)
    ? report.suggestions.slice(0, 5)
    : [];

  interview.isFinished = true;
  interview.status = "completed";

  await interview.save();

  console.log("✅ Evaluation completed:", interviewId);
};

const startWorker = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Worker MongoDB connected");

    await connectRabbitMQ();

    const channel = getRabbitChannel();

    if (!channel) {
      throw new Error("RabbitMQ channel unavailable");
    }

    console.log("👷 Evaluation worker waiting for jobs...");

    channel.consume(
      AI_EVALUATION_QUEUE,
      async (msg) => {
        if (!msg) return;

        let payload = null;

        try {
          payload = JSON.parse(msg.content.toString());

          if (!payload?.interviewId) {
            throw new Error("Missing interviewId in RabbitMQ payload");
          }

          console.log("📩 Job received:", payload);

          await evaluateInterview(payload.interviewId);

          channel.ack(msg);
        } catch (err) {
          console.error("❌ Job failed:", err.message);

          try {
            if (
              payload?.interviewId &&
              mongoose.isValidObjectId(payload.interviewId)
            ) {
              await Interview.findByIdAndUpdate(payload.interviewId, {
                status: "failed",
                isFinished: false,
                overallFeedback:
                  "Evaluation failed due to a background processing error. Please retry later.",
              });
            }
          } catch (dbErr) {
            console.error("❌ Failed to mark interview failed:", dbErr.message);
          }

          // no requeue => RabbitMQ sends message to DLQ if queue DLQ config is correct
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  } catch (err) {
    console.error("❌ Worker startup failed:", err.message);
    process.exit(1);
  }
};

startWorker();