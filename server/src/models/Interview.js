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
  score: { type: Number, default: null },
  overallFeedback: { type: String, default: "" } // 🌟 Added high level text area summaries
}, { timestamps: true });

export default mongoose.model('Interview', interviewSchema);