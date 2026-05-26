import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'An interview session must belong to a verified User tracking ID.'],
  },
  topic: {
    type: String,
    required: [true, 'An interview practice topic or job description query is required.'],
    trim: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard'],
  },
  isFinished: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
    default: 0, // Assigned out of 100 strictly on the 5th turn calculation
  },
  finalSummary: {
    type: String, // Flat primitive string format to prevent React Error #310
    default: '',
  },
  // Dynamic array structure containing individual question interaction metrics
  turns: [
    {
      question: { type: String, required: true },
      answer: { type: String, default: '' },
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      improvedAnswer: { type: String, default: '' },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;