import Groq from 'groq-sdk';
import Interview from '../models/Interview.js';

// Lazy-load the Groq client instance inside a function closure
let groqInstance = null;
const getGroqClient = () => {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("CRITICAL CONFIGURATION ERROR: GROQ_API_KEY is missing from process.env. Please verify your .env file placement.");
    }
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
};

// System Prompt Factory: Dynamically targets system directives based on session lifecycle state
const generateSystemPrompt = (topic, difficulty, isFinalEvaluation, historyText) => {
  if (isFinalEvaluation) {
    return `You are an expert engineering interviewer evaluating a candidate on the topic: "${topic}" at a "${difficulty}" level.
    Analyze the full conversational history and code implementations provided below and compile a definitive aggregate review score out of 100.
    
    Conversational History:
    ${historyText}

    CRITICAL RULES:
    1. Respond ONLY with a valid, completely flat JSON object matching the target schema below. No markdown backticks.
    2. Supply a definitive final summary assessing architectural gaps, theoretical accuracy, and coding cleanliness.
    
    Target Schema:
    {
      "score": 85,
      "finalSummary": "Your comprehensive summary review goes here as a pure primitive string."
    }`;
  }

  return `You are a technical interviewer conducting an adaptive engineering loop.
  Target Topic/Weak Area: "${topic}"
  Target Difficulty: "${difficulty}"

  Historical Progression Context:
  ${historyText || 'No questions have been prompted yet.'}

  CRITICAL RULES:
  1. Formulate the next logical technical interview question. It can be a theoretical explanation query or a specific algorithmic programming challenge.
  2. Evaluate the user's latest response string inside the history log. It could be functional code or structural prose text.
  3. Score that specific response out of 100 ("lastAnswerScore") and supply granular diagnostic feedback ("lastAnswerFeedback").
  4. If the latest question required writing code, calculate its Big-O efficiency and provide an optimized implementation block ("improvedAnswer").
  5. Respond ONLY with a valid, completely flat JSON object matching the schema below.
  
  Target Schema:
  {
    "nextQuestion": "The next question string goes here.",
    "lastAnswerScore": 78,
    "lastAnswerFeedback": "Diagnostic code or conceptual review feedback text goes here.",
    "improvedAnswer": "Alternative ideal implementation snippet or code block goes here."
  }`;
};

// --- API Route Endpoints Handlers ---

// 1. Initialize a new interview session and get the initial question
export const startInterview = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

    if (!topic || !difficulty) {
      return res.status(400).json({ message: 'Missing parameters. Topic and difficulty are required.' });
    }

    const systemPrompt = generateSystemPrompt(topic, difficulty, false, "");
    
    const groq = getGroqClient();
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'llama-3.1-8b-instant', // ✅ ACTIVE PRODUCTION REPLACEMENT
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

    const newInterview = await Interview.create({
      user: req.user._id,
      topic,
      difficulty,
      turns: [{ question: aiResponse.nextQuestion }]
    });

    res.status(201).json({ status: 'success', interview: newInterview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Process answers incrementally or generate final evaluation card at Turn 5
export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, answer } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview || interview.isFinished) {
      return res.status(400).json({ message: 'This interview round is either non-existent or already finalized.' });
    }

    const turnIndex = interview.turns.length - 1;
    interview.turns[turnIndex].answer = answer || '';

    let historyLedger = interview.turns.map((turn, index) => 
      `Question #${index + 1}: ${turn.question}\nUser Answer #${index + 1}: ${turn.answer}\n`
    ).join('\n');

    const isRuleOfFiveTriggered = interview.turns.length >= 5;

    const systemPrompt = generateSystemPrompt(
      interview.topic,
      interview.difficulty,
      isRuleOfFiveTriggered,
      historyLedger
    );

    const groq = getGroqClient();

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

    if (isRuleOfFiveTriggered) {
      interview.isFinished = true;
      interview.score = aiResponse.score || 0;
      interview.finalSummary = aiResponse.finalSummary || '';
      await interview.save();

      return res.status(200).json({ status: 'completed', interview });
    } else {
      interview.turns[turnIndex].score = aiResponse.lastAnswerScore || 0;
      interview.turns[turnIndex].feedback = aiResponse.lastAnswerFeedback || '';
      interview.turns[turnIndex].improvedAnswer = aiResponse.improvedAnswer || '';
      
      interview.turns.push({ question: aiResponse.nextQuestion });
      await interview.save();

      return res.status(200).json({ status: 'ongoing', interview });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Fetch all historical test loops matching the authenticated user profile
export const getInterviewHistory = async (req, res) => {
  try {
    const history = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // Newest tests first
      .select('topic difficulty score isFinished createdAt');

    res.status(200).json({ status: 'success', history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Retrieve a specific interview by ID to resume it
export const getInterviewDetails = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview session not found.' });
    }

    res.status(200).json({ status: 'success', interview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Hard terminate evaluation loop and log penalty notes immediately on cheat trigger
export const terminateInterviewDueToCheat = async (req, res) => {
  const { interviewId, penaltyReason } = req.body;

  try {
    const interview = await Interview.findOne({ _id: interviewId, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ message: 'Target interview record not found.' });
    }

    // Force complete the session details instantly
    interview.isFinished = true;
    interview.score = 0; // Immediate failure status penalty allocation
    interview.finalSummary = penaltyReason || "Evaluation terminated by automated proctoring firewall rules. Candidate repeatedly exited active viewport coordinates.";

    await interview.save();
    res.status(200).json({ status: 'success', interview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};