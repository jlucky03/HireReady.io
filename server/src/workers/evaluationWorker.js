import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Groq from "groq-sdk";
import { connectRabbitMQ, getRabbitChannel, AI_EVALUATION_QUEUE } from "../config/rabbitmq.js";
import Interview from "../models/Interview.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/intervyo";

let groqInstance = null;

const getGroqClient = () => {
  if (!groqInstance) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY missing");
    }
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqInstance;
};

const parseJsonSafe = (raw) => {
  try {
    let text = String(raw || "").trim();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    const match = text.match(/\{[\s\S]*\}$/);
    if (match) text = match[0];

    return JSON.parse(text);
  } catch {
    return {
      score: 70,
      summary: "Evaluation completed with fallback parsing.",
      strengths: ["Completed all interview questions."],
      weaknesses: ["Some answers need deeper technical detail."],
      suggestions: ["Add more examples, tradeoffs, and real project references in answers."],
    };
  }
};

const evaluateInterview = async (interviewId) => {
  const interview = await Interview.findById(interviewId);

  if (!interview) {
    console.log("Interview not found:", interviewId);
    return;
  }

  if (interview.isFinished) {
    console.log("Interview already completed:", interviewId);
    return;
  }

  const qaText = interview.questions
    .map(
      (q, idx) =>
        `Q${idx + 1}: ${q.question}\nA${idx + 1}: ${q.answer || "No answer"}`
    )
    .join("\n\n");

  const prompt = `You are a senior technical interviewer.

Evaluate this 5-question mock interview.

Interview Topic: ${interview.topic}
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

  const completion = await groq.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "llama-3.1-8b-instant",
    response_format: { type: "json_object" },
  });

  const raw = completion?.choices?.[0]?.message?.content || "";
  const report = parseJsonSafe(raw);

  interview.score = report.score || 70;
  interview.overallFeedback =
  report.summary || "Evaluation completed.";
  interview.strengths = Array.isArray(report.strengths) ? report.strengths : [];
  interview.weaknesses = Array.isArray(report.weaknesses) ? report.weaknesses : [];
  interview.suggestions = Array.isArray(report.suggestions) ? report.suggestions : [];
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

        try {
          const payload = JSON.parse(msg.content.toString());
          console.log("📩 Job received:", payload);

          await evaluateInterview(payload.interviewId);

          channel.ack(msg);
        } catch (err) {
          console.error("❌ Job failed:", err.message);
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