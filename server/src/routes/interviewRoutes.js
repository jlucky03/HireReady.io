import { Router } from 'express';
import { startInterview, submitAnswer, getInterviewHistory } from '../controllers/interviewController.js';
import { protect } from '../controllers/authController.js'; // 🌟 FIXED: Points to your official authController path!

const router = Router();

// Secure Voice Interview Loop Sequence Routes
router.post('/start', protect, startInterview);
router.post('/submit', protect, submitAnswer);
router.get('/history', protect, getInterviewHistory);

export default router;