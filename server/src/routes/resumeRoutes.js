import express from 'express';
import { analyzeResumePayload } from '../controllers/resumeController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

// Secure the route utilizing our custom authentication protection gateway middleware
router.post('/analyze', protect, analyzeResumePayload);

export default router;