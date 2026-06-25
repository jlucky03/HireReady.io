import express from "express";
import multer from "multer";
import { protect } from "../controllers/authController.js";
import {
  analyzeAtsResumeScore,
  getAtsHistory,
} from "../controllers/resumeController.js";
import { redisRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return cb(new Error("Only PDF resumes are allowed."), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

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

router.get("/history", protect, getAtsHistory);

export default router;