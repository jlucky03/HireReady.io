import ResumeAnalysis from '../models/ResumeAnalysis.js';

export const analyzeResumePayload = async (req, res) => {
  const { type, resumeText, targetCompany, targetRole } = req.body;

  if (!resumeText) {
    return res.status(400).json({ message: 'Missing core resume content parameters.' });
  }

  try {
    let systemPrompt = '';

    if (type === 'ats') {
      systemPrompt = `You are an advanced expert corporate Applicant Tracking System (ATS) parsing bot.
      Analyze the candidate resume text block provided below. Calculate a definitive structural score out of 100 based on standard tracking criteria.
      Isolate clear, highly actionable structural or grammatical flaws (e.g., missing metrics, generic phrasing).
      
      CRITICAL RULE: You must respond ONLY with a valid JSON object matching the target schema below. No markdown backticks.
      
      Target Schema:
      {
        "score": 75,
        "feedback": [
          "Action item bullet point 1 explaining structure formatting fixes.",
          "Action item bullet point 2 explaining phrase optimization fixes."
        ]
      }`;
    } else {
      systemPrompt = `You are a corporate technical screening gap analyzer.
      Cross-reference the candidate resume text against standard modern job requirements for a "${targetRole}" role at "${targetCompany}".
      Isolate precisely which technical languages, frameworks, or cloud tools are completely absent from their profile.
      
      CRITICAL RULE: You must respond ONLY with a valid JSON object matching the target schema below. No markdown backticks.
      
      Target Schema:
      {
        "score": 60,
        "feedback": [
          "Missing framework: No direct mentions of tool framework X preferred by ${targetCompany}.",
          "Missing core concept: Profile is missing cloud system design metrics required for ${targetRole} positions."
        ]
      }`;
    }

    // Connect to your Groq Llama 3.1 infrastructure pipeline instance
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Candidate Resume Content Material:\n\n${resumeText}` }
        ],
        temperature: 0.2, // Keep generation deterministic
        response_format: { type: 'json_object' }
      })
    });

    const aiData = await aiResponse.json();
    if (!aiResponse.ok) throw new Error(aiData.error?.message || 'Groq connection pipeline breakdown.');

    // Parse out clean structured results payload data maps
    const parsedResult = JSON.parse(aiData.choices[0].message.content);

    // Save calculation metrics to MongoDB database collection records
    const newAnalysis = await ResumeAnalysis.create({
      user: req.user._id,
      type,
      resumeText,
      targetCompany: type === 'gap' ? targetCompany : undefined,
      targetRole: type === 'gap' ? targetRole : undefined,
      score: parsedResult.score,
      feedback: parsedResult.feedback
    });

    res.status(201).json({ status: 'success', data: newAnalysis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};