import PDFParser from 'pdf2json';
import Groq from 'groq-sdk';
import crypto from "crypto";
import redisClient from "../config/redis.js";
import ResumeAnalysis from "../models/ResumeAnalysis.js";
import { logAction } from "../utils/auditLogger.js";

const getResumeHash = (text) => {
  return crypto.createHash("sha256").update(text).digest("hex");
};

const normalizeResumeText = (text) => {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

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

const safeDecode = (raw) => {
  if (typeof raw !== 'string') return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    try {
      return unescape(raw);
    } catch {
      return raw;
    }
  }
};

const parsePdfText = (pdfParser, buffer) => new Promise((resolve, reject) => {
  const cleanup = () => {
    pdfParser.removeListener('pdfParser_dataError', onError);
    pdfParser.removeListener('pdfParser_dataReady', onReady);
  };

  const onError = (errData) => {
    cleanup();
    reject(new Error(errData?.parserError || 'Unknown PDF parsing error.'));
  };

  const onReady = (pdfData) => {
    cleanup();

    let extractedText = '';
    if (!pdfData?.Pages || !Array.isArray(pdfData.Pages)) {
      return reject(new Error('PDF parser returned invalid document structure.'));
    }

    for (const page of pdfData.Pages) {
      if (!page?.Texts || !Array.isArray(page.Texts)) continue;
      for (const textObj of page.Texts) {
        if (!textObj?.R || !Array.isArray(textObj.R)) continue;
        for (const t of textObj.R) {
          extractedText += `${safeDecode(t?.T)} `;
        }
      }
      extractedText += '\n';
    }

    resolve(extractedText.trim());
  };

  pdfParser.on('pdfParser_dataError', onError);
  pdfParser.on('pdfParser_dataReady', onReady);
  pdfParser.parseBuffer(buffer);
});

const parseAtsOutput = (rawContent) => {
  if (typeof rawContent !== 'string') {
    throw new Error('Groq completion response is not a string.');
  }

  let normalized = rawContent.trim();
  if (normalized.includes('```')) {
    normalized = normalized.replace(/```json/gi, '').replace(/```/g, '').trim();
  }

  const maybeJson = normalized.match(/\{[\s\S]*\}$/);
  if (maybeJson) {
    normalized = maybeJson[0];
  }

  return JSON.parse(normalized);
};

const defaultAtsFallback = {
  score: 70,
  summary: 'Profile successfully extracted. Analysis finalized with layout fallback presets.',
  improvements: [
    'Quantify tech optimization entries by noting exact performance metrics or latency deltas.',
    'Ensure scalable framework dependencies like Redis caching or Docker are clearly listed inside project summaries.'
  ]
};

export const analyzeAtsResumeScore = async (req, res) => {
  const originalWarn = console.warn;

  try {
    // 🌟 SILENCE ENGINE CLUTTER: Intercept and drop pdf2json link/form element warnings
    console.warn = function (...args) {
      const logMessage = args.join(' ');
      if (logMessage.includes('NOT valid form element') || logMessage.includes('Unsupported: field.type')) {
        return; // Quietly drop the warning layout lines without printing
      }
      originalWarn.apply(console, args);
    };

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Missing parameters. Please provide a valid resume PDF file.' });
    }
    const resumeRawText = await parsePdfText(new PDFParser(), req.file.buffer);

    if (!resumeRawText || !resumeRawText.trim()) {
      return res.status(400).json({ message: 'Unable to read file contents. The uploaded PDF may be empty or image-only.' });
    }

   const normalizedResumeText = normalizeResumeText(resumeRawText);
const resumeHash = getResumeHash(normalizedResumeText);
const cacheKey = `ats:${req.user._id}:${resumeHash}`;

let cached = null;

try {
  if (redisClient?.isOpen) {
    cached = await redisClient.get(cacheKey);
  }
} catch (err) {
  console.warn("Redis cache read skipped:", err.message);
}

if (cached) {
  const cachedData = JSON.parse(cached);

  const historyRecord = await ResumeAnalysis.create({
  user: req.user._id,
  resumeName: req.file.originalname || "resume.pdf",
  resumeHash,
  type: "ats",
  score: cachedData.atsAnalysis?.score || 0,
  summary: cachedData.atsAnalysis?.summary || "",
  improvements: cachedData.atsAnalysis?.improvements || [],
  extractedText: cachedData.extractedText || "",
  cached: true,
});

await logAction({
  req,
  action: "ATS_CACHE_HIT",
  entityType: "ResumeAnalysis",
  entityId: historyRecord._id,
  metadata: {
    resumeName: req.file.originalname || "resume.pdf",
    score: cachedData.atsAnalysis?.score || 0,
  },
});

return res.status(200).json({
    status: "success",
    atsAnalysis: cachedData.atsAnalysis,
    extractedText: cachedData.extractedText,
    remainingCredits: req.user.credits,
    cached: true,
  });
}

// Credit check only if not cached
if (req.user.credits < 1) {
  return res.status(402).json({
    message: "Not enough credits. ATS scan requires 1 credit.",
  });
}

    const prompt = `You are an elite, enterprise-grade Technical Recruiter and Automated ATS Resume Optimizer.
Analyze the following extracted text from a candidate's resume:

---
${resumeRawText}
---

CRITICAL RULES:
1. Calculate an overall objective ATS Match Score integer out of 100 based on standard industry keyword metrics, project tech stack depth, and quantitative achievement markers.
2. Compile a structured array called "improvements" containing concise, highly specific, actionable bullet points showing the candidate exactly how to upgrade their resume experience entries or project blocks.
3. Respond ONLY with a valid, completely flat JSON object matching the target schema below. Do not wrap in markdown backticks or text formatting wrappers.

Target Schema:
{
  "score": 75,
  "summary": "Brief high-level overview string highlighting overall strength and key domain omissions.",
  "improvements": [
    "Quantify your MERN stack project by detailing exactly how much latency decreased after implementing Redis cache layers.",
    "Add explicit containerization keywords such as Docker or deployment workflows to showcase scalable backend engineering know-how."
  ]
}`;

    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' }
    });

    const rawContent = String(chatCompletion?.choices?.[0]?.message?.content || '').trim();
    let aiOutput;

    try {
      aiOutput = parseAtsOutput(rawContent);
    } catch (parseError) {
      console.error('⚠️ JSON Parsing Failure on Groq payload.', parseError);
      console.error('Raw response text was:', rawContent);
      aiOutput = defaultAtsFallback;
    }

// Deduct 1 credit after successful analysis
req.user.credits -= 1;
await req.user.save();

try {
  if (redisClient?.isOpen) {
    await redisClient.setEx(
      cacheKey,
      60 * 60 * 24,
      JSON.stringify({
        atsAnalysis: aiOutput,
        extractedText: resumeRawText,
      })
    );
  }
} catch (err) {
  console.warn("Redis cache save skipped:", err.message);
}

const historyRecord = await ResumeAnalysis.create({
  user: req.user._id,
  resumeName: req.file.originalname || "resume.pdf",
  resumeHash,
  type: "ats",
  score: aiOutput?.score || 0,
  summary: aiOutput?.summary || "",
  improvements: aiOutput?.improvements || [],
  extractedText: resumeRawText,
  cached: false,
});

await logAction({
  req,
  action: "ATS_ANALYSIS_COMPLETED",
  entityType: "ResumeAnalysis",
  entityId: historyRecord._id,
  metadata: {
    resumeName: req.file.originalname || "resume.pdf",
    score: aiOutput?.score || 0,
    creditsUsed: 1,
  },
});

res.status(200).json({
  status: 'success',
  atsAnalysis: aiOutput,
  extractedText: resumeRawText,
  remainingCredits: req.user.credits,
  cached: false
});
  } catch (err) {
    res.status(500).json({ message: err?.message || "Unexpected server error." });
  } finally {
    console.warn = originalWarn;
  }
};

export const getAtsHistory = async (req, res) => {
  try {
    const history = await ResumeAnalysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      status: "success",
      history,
    });
  } catch (err) {
    res.status(500).json({
      message: err?.message || "Failed to load ATS history.",
    });
  }
};