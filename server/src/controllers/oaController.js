import Groq from 'groq-sdk';
import vm from 'vm';
import OaExam from '../models/OaExam.js';

let groqInstance = null;
const getGroqClient = () => {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY configuration is missing from environment variables.");
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
};

// 🌟 GENERATE REALISTIC LEETCODE CONTEST SETS WITH COMPREHENSIVE STARTER CODE
export const startOaExam = async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user?._id;

    const targetTopic = topic || 'Arrays';
    const secondaryPool = ['Hash Maps', 'Sliding Window', 'Dynamic Programming', 'Trees', 'Graphs', 'Two Pointers'];
    const mixedTopics = secondaryPool.filter(t => t.toLowerCase() !== targetTopic.toLowerCase()).sort(() => 0.5 - Math.random());

    const prompt = `You are a Principal Engineer structuring a premium LeetCode Contest.
    Generate exactly THREE sequential algorithmic challenges climbing through Easy, Medium, and Hard tiers.
    
    Topic Alignment:
    - Problem 1: Focus Focus Focus on "${targetTopic}" (Easy)
    - Problem 2: Focus on "${mixedTopics[0]}" (Medium)
    - Problem 3: Focus on "${mixedTopics[1]}" (Hard)

    CRITICAL RULES FOR SIGNATURES AND TEMPLATES:
    1. Do not append dummy parameters like target or k unless strictly required by the specific prompt text.
    2. The input array inside test cases must be a valid JSON array matching the exact arguments order of your function template.
    3. You MUST provide robust, clean boilerplate inside "starterCode" matching LeetCode patterns exactly (e.g., C++ template must wrap inside class Solution, Python must contain def functionName(self, ...)).

    Respond ONLY with a valid JSON object matching the schema below. No markdown backticks or text commentary.

    Target Output JSON Schema:
    {
      "problems": [
        {
          "topic": "Topic Name",
          "difficulty": "easy",
          "title": "Problem Title",
          "description": "LeetCode style narrative problem statement.",
          "constraints": ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
          "optimalTimeComplexity": "O(N)",
          "optimalSpaceComplexity": "O(1)",
          "functionName": "findTargetIndex",
          "starterCode": {
            "javascript": "/**\\n * @param {number[]} nums\\n * @return {number}\\n */\\nfunction findTargetIndex(nums) {\\n    \\n}",
            "python": "class Solution:\\n    def findTargetIndex(self, nums: List[int]) -> int:\\n        ",
            "cpp": "class Solution {\\npublic:\\n    int findTargetIndex(vector<int>& nums) {\\n        \\n    }\\n};",
            "java": "class Solution {\\n    public int findTargetIndex(int[] nums) {\\n        \\n    }\\n}"
          },
          "testCases": [
            { "input": "[[1,2,3,4]]", "output": "0" },
            { "input": "[[5,6,7,5]]", "output": "3" },
            { "input": "[[9,9,9]]", "output": "0" }
          ]
        }
      ]
    }`;

    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' }
    });

    const examData = JSON.parse(chatCompletion.choices[0].message.content.trim());

    const newExam = await OaExam.create({
      user: userId,
      problems: examData.problems.map(p => ({ ...p, userSolution: "" })),
      timeLeft: 5400,
      isSubmitted: false
    });

    res.status(200).json({ status: 'success', exam: newExam });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🌟 PRODUCTION-GRADE LEETCODE CONTEST TEST RUNNER JUDGE
export const finalizeOaExam = async (req, res) => {
  try {
    const { examId, problemId, code, language } = req.body;

    const examDoc = await OaExam.findOne({ _id: examId, user: req.user?._id });
    if (!examDoc) return res.status(404).json({ message: 'Contest registry map not discovered.' });

    const targetedProblem = examDoc.problems.id(problemId);
    if (!targetedProblem) return res.status(404).json({ message: 'Problem target entry node missing.' });

    targetedProblem.userSolution = code;

    const results = [];
    let totalPassed = 0;

    // 🌟 JAVASCRIPT CONTEXT HARNESS SIMULATION
    if (language === 'javascript') {
      const funcName = targetedProblem.functionName || "solution";
      
      targetedProblem.testCases.forEach((tc) => {
        let actualOutput = null;
        let status = "Wrong Answer";
        
        try {
          // Parse out wrapping structures if user provided a standard LeetCode class format
          let runtimeCode = code;
          if (code.includes("class Solution") || !code.includes(`function ${funcName}`)) {
            runtimeCode = `${code}\nconst targetRunner = ${funcName};`;
          }

          const scriptCode = `
            ${runtimeCode}
            const inputArgs = ${tc.input};
            let executionOutput;
            if (typeof targetRunner !== 'undefined') {
              executionOutput = targetRunner(...inputArgs);
            } else {
              executionOutput = ${funcName}(...inputArgs);
            }
            JSON.stringify(executionOutput);
          `;
          
          const sandbox = { JSON, console };
          const context = vm.createContext(sandbox);
          const script = new vm.Script(scriptCode);
          const result = script.runInContext(context, { timeout: 1500 });
          actualOutput = result;

          if (String(actualOutput).replace(/\s+/g, '') === String(tc.output).replace(/\s+/g, '')) {
            status = "Passed";
            totalPassed++;
          }
        } catch (err) {
          actualOutput = `Runtime Error: ${err.message}`;
          status = "Runtime Error";
        }

        results.push({ input: tc.input, expected: tc.output, actual: actualOutput, status });
      });
    } 
    // 🌟 MULTI-LANGUAGE HIGH-FIDELITY CONTEST JUDGE
    else {
      const polyglotPrompt = `You are an automated LeetCode Contest evaluation engine.
      Evaluate this solution written in "${language}" against the structural test parameters.
      
      Problem Track: ${targetedProblem.title}
      Target Function Identifier: ${targetedProblem.functionName}
      Expected Output Spec Arrays: ${JSON.stringify(targetedProblem.testCases)}
      
      User Submission Code Input:
      ---
      ${code}
      ---

      Analyze line-by-line correctness, execution tracking, data-type compatibility, and logical compliance.
      Respond ONLY with a valid JSON object matching the exact schema configuration below. Do not include markdown blocks or conversational commentary.

      Output JSON Structural Configuration:
      {
        "totalPassed": 3,
        "verdict": "Accepted", 
        "results": [
          { "input": "Case 1 input arguments", "expected": "Expected value string", "actual": "What code returned", "status": "Passed" },
          { "input": "Case 2 input arguments", "expected": "Expected value string", "actual": "What code returned", "status": "Passed" },
          { "input": "Case 3 input arguments", "expected": "Expected value string", "actual": "What code returned", "status": "Passed" }
        ]
      }`;

      const groq = getGroqClient();
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: polyglotPrompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' }
      });

      const report = JSON.parse(chatCompletion.choices[0].message.content.trim());
      totalPassed = report.totalPassed || 0;
      if (report.results) report.results.forEach(res => results.push(res));
    }

    const finalScore = Math.round((totalPassed / targetedProblem.testCases.length) * 100);

    // Structural optimization critique synthesis
    const critiquePrompt = `You are a Lead Software Engineer reviewing code submission feedback metrics for a competitive programming platform.
    Problem Node: ${targetedProblem.title}
    Language Profile: ${language}
    Code Under Review:
    ${code}
    
    Verdicts Log Array: ${JSON.stringify(results)}

    Provide a professional, 2-line optimization summary detailing code styling tips, potential memory leakage vectors, or complexity enhancements. Do not include conversational markdown text.`;

    const groq = getGroqClient();
    const critiqueCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: critiquePrompt }],
      model: 'llama-3.1-8b-instant'
    });

    targetedProblem.score = finalScore;
    targetedProblem.isSolved = finalScore === 100;
    targetedProblem.feedback = JSON.stringify({
      feedbackText: critiqueCompletion.choices[0].message.content.trim(),
      caseDetails: results
    });

    await examDoc.save();
    res.status(200).json({ status: 'success', problem: targetedProblem });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveOaProgress = async (req, res) => {
  res.status(200).json({ status: 'success' });
};