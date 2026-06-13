import express from 'express';
import multer from 'multer';
import { protect } from '../controllers/authController.js';
// 🌟 FIXED: Points straight to your official existing controller file path!
import { analyzeAtsResumeScore } from '../controllers/resumeController.js';
import { redisRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Route handle configuration mapping
router.post(
  "/analyze",
  protect,
  redisRateLimiter({
    keyPrefix: "ats",
    limit: 5,
    windowSeconds: 60 * 60,
    message: "ATS scan limit reached. Try again later.",
  }),
  upload.single("resume"),
  analyzeAtsResumeScore
);
export default router;