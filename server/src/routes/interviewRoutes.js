import { Router } from 'express';
import {
  startInterview,
  submitAnswer,
  getInterviewHistory,
  getInterviewById,
  getInterviewAnalytics,
  retryInterviewEvaluation,
} from "../controllers/interviewController.js";
import { protect } from '../controllers/authController.js'; // 🌟 FIXED: Points to your official authController path!
import { redisRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  startInterviewSchema,
  submitAnswerSchema,
} from "../validators/interviewValidator.js";
const router = Router();

// Secure Voice Interview Loop Sequence Routes
router.post(
  "/start",
  protect,
  redisRateLimiter({
    keyPrefix: "interview",
    limit: 10,
    windowSeconds: 60 * 60,
    message: "Interview start limit reached. Try again later.",
  }),
  validate(startInterviewSchema),
  startInterview
);

router.post(
  "/submit",
  protect,
  validate(submitAnswerSchema),
  submitAnswer
);
router.get("/analytics", protect, getInterviewAnalytics);
router.get('/history', protect, getInterviewHistory);
router.post("/:id/retry-evaluation", protect, retryInterviewEvaluation);
router.get("/:id", protect, getInterviewById);

export default router;