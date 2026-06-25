import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: "" },
  idealAnswer: { type: String, default: "" }, // 🌟 Added placeholder for standard solutions
  feedback: { type: String, default: "" }     // 🌟 Added feedback target metrics
});

const interviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
  questions: { type: [questionSchema], default: [] }, 
  currentStep: { type: Number, default: 1 },
  isFinished: { type: Boolean, default: false },
  status: {
  type: String,
  enum: ["active", "evaluating", "completed", "failed"],
  default: "active",
},
  score: { type: Number, default: null },
  overallFeedback: { type: String, default: "" },
   // 🌟 Added high level text area summaries
   strengths: {
  type: [String],
  default: [],
},
weaknesses: {
  type: [String],
  default: [],
},
suggestions: {
  type: [String],
  default: [],
},
}, { timestamps: true });

interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ user: 1, status: 1 });
interviewSchema.index({ user: 1, topic: 1 });
interviewSchema.index({ user: 1, status: 1, createdAt: -1 });

export default mongoose.model('Interview', interviewSchema);