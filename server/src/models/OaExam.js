import mongoose from 'mongoose';

const oaProblemSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
  title: { type: String, required: true },
  description: { type: String, required: true },
  constraints: { type: [String], default: [] },
  testCases: [
    {
      input: { type: String, required: true },
      output: { type: String, required: true }
    }
  ],
  optimalTimeComplexity: { type: String, default: "" },
  optimalSpaceComplexity: { type: String, default: "" },
  userSolution: { type: String, default: "" },
  isSolved: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  feedback: { type: String, default: "" }
});

const oaExamSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problems: { type: [oaProblemSchema], required: true }, // Contains exactly 3 sequential problem nodes
  timeLeft: { type: Number, default: 5400 }, // Global 90 Minute Exam Window Counter in seconds
  warningCount: { type: Number, default: 0 }, // Proctor Integrity Violations Tally
  isSubmitted: { type: Boolean, default: false },
  finalScore: { type: Number, default: 0 },
  overallProctorFeedback: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model('OaExam', oaExamSchema);