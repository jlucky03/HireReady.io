import { Router } from 'express';
import { startInterview, submitAnswer, getInterviewHistory } from '../controllers/interviewController.js';
import { protect } from '../controllers/authController.js'; // 🌟 FIXED: Points to your official authController path!
import { redisRateLimiter } from "../middleware/rateLimiter.js";
import {getInterviewById} from "../controllers/interviewController.js";
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
  startInterview
);
router.post('/submit', protect, submitAnswer);
router.get('/history', protect, getInterviewHistory);
router.get("/:id", protect, getInterviewById);

export default router;