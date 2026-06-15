import Groq from 'groq-sdk';
import Interview from '../models/Interview.js';
import { publishEvaluationJob } from "../config/rabbitmq.js";

let groqInstance = null;
const getGroqClient = () => {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("CRITICAL CONFIGURATION ERROR: GROQ_API_KEY is missing from process.env.");
    }
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
};

// START EXCLUSIVE VOICE INTERVIEW
export const startInterview = async (req, res) => {
 
  try {
    const { topic, difficulty } = req.body;
    const userId = req.user?._id;

    // Credit check
if (req.user.credits < 3) {
  return res.status(402).json({
    message: "Not enough credits. Starting an interview requires 3 credits."
  });
}

    if (!topic || !difficulty) {
      return res.status(400).json({ message: 'Missing parameters. Please provide topic and difficulty.' });
    }

    let prompt = '';
    
    const voiceOnlyRules = "CRITICAL INTERVIEW ROOM RULES: 1. Do NOT ask the candidate to write, implement, type, or generate code snippets. 2. Do NOT provide boilerplate code or ask questions with code syntax details. 3. The question must be 100% verbal-friendly. Ask about architectural tradeoffs, framework concepts, debugging approaches, state management strategies, or database design. 4. Keep the question completely concise, clear, and exactly ONE sentence long so the text-to-speech assistant can read it fluidly. No conversational intro text.";

    if (topic.startsWith('RESUME_DATA_STREAM:')) {
      const resumeText = topic.replace('RESUME_DATA_STREAM:', '').trim();
      prompt = `You are an elite corporate technical interviewer running a live voice screening session.
      Based on the candidate's extracted resume data below, generate the FIRST targeted conceptual, architectural, or stack-specific interview question.
      ${voiceOnlyRules}
      
      Candidate Resume Data:
      ---
      ${resumeText}
      ---
      Seniority Level Context: ${difficulty}`;
    } else {
      prompt = `You are an elite corporate technical interviewer running a live voice screening session.
      Generate the FIRST technical framework, design, or conceptual question challenging the candidate's depth in: "${topic}".
      ${voiceOnlyRules}
      Seniority Level Context: ${difficulty}`;
    }

    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.1-8b-instant',
    });

    const initialQuestion = chatCompletion.choices[0].message.content.trim();

    const newInterview = await Interview.create({
  user: userId,
  topic: topic.startsWith('RESUME_DATA_STREAM:') ? 'Personal Resume Screen' : topic,
  difficulty: difficulty.toLowerCase(),
  questions: [{ question: initialQuestion, answer: "" }],
  currentStep: 1,
  isFinished: false,
  status: "active",
});

    req.user.credits -= 3;
await req.user.save();

  res.status(200).json({
  status: 'success',
  interviewId: newInterview._id,
  question: initialQuestion,
  remainingCredits: req.user.credits
});

  } catch (err) {
    res.status(500).json({ message: err.message || 'Unexpected voice session startup error.' });
  }
};

// EVALUATE VERBAL RESPONSE & STREAM NEXT QUESTION OR METRICS DISCOVERY SHEET
export const submitAnswer = async (req, res) => {
  try {
    const { answer, interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: 'Missing active interview reference ID parameter.' });
    }

   const sessionDoc = await Interview.findOne({
  _id: interviewId,
  user: req.user?._id,
});

if (!sessionDoc) {
  return res.status(404).json({
    message: "Active interview record matrix not found.",
  });
}

// Prevent duplicate 5th-answer submission loop
if (sessionDoc.status === "evaluating") {
  return res.status(202).json({
    status: "evaluating",
    message: "Final evaluation is already being generated.",
    interviewId: sessionDoc._id,
  });
}

if (sessionDoc.status === "completed") {
  return res.status(200).json({
    status: "completed",
    message: "Interview is already completed.",
    interviewId: sessionDoc._id,
  });
}

if (sessionDoc.status === "failed") {
  return res.status(409).json({
    status: "failed",
    message: "This interview evaluation failed. Please start a new interview.",
    interviewId: sessionDoc._id,
  });
}

const activeIndex = sessionDoc.questions.length - 1;

if (activeIndex < 0) {
  return res.status(400).json({
    message: "No active question found for this interview.",
  });
}

sessionDoc.questions[activeIndex].answer = answer || "";

 if (sessionDoc.questions.length >= 5) {
  sessionDoc.isFinished = false;
  sessionDoc.status = "evaluating";
  sessionDoc.currentStep = 6;

  await sessionDoc.save();

  await publishEvaluationJob({
    interviewId: sessionDoc._id.toString(),
    userId: req.user._id.toString(),
  });

  return res.status(202).json({
    status: "evaluating",
    message: "Final evaluation is being generated.",
    interviewId: sessionDoc._id,
  });
}
    // GENERATE NEXT SEQUENTIAL CONCEPTS QUESTION (Rounds 1 - 4)
    const prompt = `You are a strict technical recruiter conducting a live voice interview. Review the question asked and the candidate's verbal reply:
    Current Question: "${sessionDoc.questions[activeIndex].question}"
    Candidate Verbal Response: "${answer}"
    
    Based on their reply, challenge their conceptual gaps or ask the NEXT logical follow-up technical interview question. 
    
    STRICT VOICE INTERVIEW ROOM RULES:
    1. Do NOT ask the candidate to write, implement, type, or generate code snippets.
    2. The question must be 100% verbal-friendly. Challenge their understanding of system design, lifecycle states, middleware logic, hooks, or performance tradeoffs.
    3. Keep it strictly to ONE concise sentence. Do not add filler text or polite remarks.`;

    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.1-8b-instant',
    });

    const nextQuestion = chatCompletion.choices[0].message.content.trim();
    
    sessionDoc.questions.push({ question: nextQuestion, answer: "" });
    sessionDoc.currentStep += 1;
    await sessionDoc.save();

    res.status(200).json({
      status: 'success',
      nextQuestion,
      currentStep: sessionDoc.currentStep
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// FETCH SESSION REGISTRY HISTORY FEED
export const getInterviewHistory = async (req, res) => {
  try {
    const logs = await Interview.find({ user: req.user?._id }).sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user?._id,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.status(200).json(interview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};