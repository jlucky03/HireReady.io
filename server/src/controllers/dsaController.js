import Groq from 'groq-sdk';
import Interview from '../models/Interview.js';

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

export const generateDsaChallenge = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

    if (!topic || !difficulty) {
      return res.status(400).json({ message: 'Missing parameters. Topic and difficulty are required.' });
    }

    // 1. Build a strict judge prompt that formats unhidden verification test cases
    const prompt = `You are an expert competitive programming judge generating data structure challenges for an SDE interview.
    Target Topic Node: "${topic}"
    Target Complexity Level: "${difficulty}"

    Task:
    Generate a precise algorithmic problem statement. You MUST supply clear, explicit, unhidden Example Test Cases showing exact Inputs and expected Outputs so the candidate can read them inside their editor workspace.

    CRITICAL RULES:
    1. Respond ONLY with a valid, completely flat JSON object matching the target schema below. Do not wrap in markdown backticks or text formatting wrappers.
    
    Target Schema:
    {
      "problemTitle": "Clean Concise Problem Name",
      "problemStatement": "Full detailed problem description text goes here...",
      "testCases": "Example 1:\\nInput: nums = [2,7,11,15], target = 9\\nOutput: [0,1]\\n\\nExample 2:\\nInput: nums = [3,2,4], target = 6\\nOutput: [1,2]"
    }`;

    // 2. Execute fast inference completion using Llama 3.3
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" }
    });

    const aiChallenge = JSON.parse(chatCompletion.choices[0].message.content);

    // 3. Create a real, tracking Mongoose Interview document so the proctoring engine can evaluate it at submission
    const newDsaSession = await Interview.create({
      user: req.user._id,
      topic: `${topic} - Pure DSA Quiz`,
      difficulty: difficulty,
      turns: [{
        question: `🎯 **PROBLEM: ${aiChallenge.problemTitle}**\n\n${aiChallenge.problemStatement}\n\n📊 **UNHIDDEN VERIFICATION TEST CASES:**\n\n${aiChallenge.testCases}`
      }]
    });

    res.status(200).json({
      status: 'success',
      interview: newDsaSession
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};