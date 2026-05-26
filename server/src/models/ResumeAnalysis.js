import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['ats', 'gap'],
    required: true
  },
  resumeText: {
    type: String,
    required: true
  },
  // Target parameter metrics used during the corporate gap audits
  targetCompany: String,
  targetRole: String,
  // The structured JSON payloads returned from the Llama 3.1 engine
  score: {
    type: Number,
    default: 0
  },
  feedback: {
    type: [String], // Structured array of bullet points
    required: true
  }
}, { timestamps: true });

export default mongoose.model('ResumeAnalysis', resumeAnalysisSchema);