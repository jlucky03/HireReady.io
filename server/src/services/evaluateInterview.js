import Groq from "groq-sdk";
import mongoose from "mongoose";
import Interview from "../models/Interview.js";

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

const withTimeout = (promise, ms = 30000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Groq evaluation timeout")), ms)
    ),
  ]);

const truncateText = (text, maxLength = 1200) => {
  const value = String(text || "");
  return value.length > maxLength ? value.slice(0, maxLength) + "..." : value;
};

const parseJsonStrict = (raw) => {
  let text = String(raw || "").trim();
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const match = text.match(/\{[\s\S]*\}$/);
  if (match) text = match[0];

  if (!text) throw new Error("Empty AI evaluation response");
  return JSON.parse(text);
};

const normalizeScore = (score) => {
  const value = Number(score);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const getAnswerStats = (questions = []) => {
  const answers = questions.map((q) => String(q.answer || "").trim());

  const nonEmptyAnswers = answers.filter((ans) => ans.length > 0);

  const meaningfulAnswers = answers.filter((ans) => {
    const words = ans
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const uniqueWords = new Set(words);

    return ans.length >= 25 && words.length >= 5 && uniqueWords.size >= 4;
  });

  return {
    total: answers.length,
    nonEmpty: nonEmptyAnswers.length,
    meaningful: meaningfulAnswers.length,
  };
};

export const evaluateInterview = async (interviewId) => {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw new Error("Invalid interviewId in evaluation job");
  }

  const interview = await Interview.findById(interviewId);

  if (!interview) {
    throw new Error(`Interview not found: ${interviewId}`);
  }

  if (interview.isFinished || interview.status === "completed") {
    return interview;
  }

  const qaText = interview.questions
    .map((q, idx) => {
      const question = truncateText(q.question, 800);
      const answer = truncateText(q.answer || "No answer", 1200);
      return `Q${idx + 1}: ${question}\nA${idx + 1}: ${answer}`;
    })
    .join("\n\n");

  const answerStats = getAnswerStats(interview.questions);

  const prompt = `You are a strict senior technical interviewer.

Evaluate this 5-question mock interview very honestly.

Interview Topic: ${truncateText(interview.topic, 100)}
Difficulty: ${interview.difficulty}

Candidate answer quality stats:
- Total questions: ${answerStats.total}
- Non-empty answers: ${answerStats.nonEmpty}
- Meaningful answers: ${answerStats.meaningful}

Questions and Answers:
${qaText}

Strict scoring rubric:
0-10: Blank answers, random words, copied text, nonsense, or no technical understanding.
11-25: Mostly irrelevant, incoherent, very short, or does not answer the questions.
26-40: Weak answers with only a few related keywords but no clear explanation.
41-60: Basic partial understanding with missing depth and examples.
61-80: Good understanding with mostly correct explanations and some examples.
81-100: Strong interview-ready answers with depth, tradeoffs, examples, and clarity.

Return ONLY valid JSON in this exact schema:
{
  "score": 18,
  "summary": "Short overall evaluation summary.",
  "strengths": [],
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

  let finalScore = normalizeScore(report.score);

  if (answerStats.meaningful === 0) {
    finalScore = Math.min(finalScore, 15);
  } else if (answerStats.meaningful <= 1) {
    finalScore = Math.min(finalScore, 25);
  } else if (answerStats.meaningful <= 2) {
    finalScore = Math.min(finalScore, 40);
  }

  interview.score = finalScore;
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

  return interview;
};