import mongoose from "mongoose";

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeName: {
      type: String,
      default: "resume.pdf",
    },
    resumeHash: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["ats"],
      default: "ats",
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    summary: {
      type: String,
      default: "",
    },
    improvements: {
      type: [String],
      default: [],
    },
    extractedText: {
      type: String,
      default: "",
    },
    cached: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });
resumeAnalysisSchema.index({ user: 1, resumeHash: 1 });
resumeAnalysisSchema.index({ user: 1, type: 1, createdAt: -1 });

export default mongoose.model("ResumeAnalysis", resumeAnalysisSchema);