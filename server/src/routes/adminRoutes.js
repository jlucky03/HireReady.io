import express from "express";
import { protect } from "../controllers/authController.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import {
  getAdminOverview,
  getAdminUsers,
  updateUserCredits,
  getFailedInterviews,
  getAdminHealth,
  retryFailedInterviewEvaluation,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get("/overview", getAdminOverview);
router.get("/users", getAdminUsers);
router.patch("/users/:id/credits", updateUserCredits);
router.get("/failed-interviews", getFailedInterviews);
router.post("/failed-interviews/:id/retry", retryFailedInterviewEvaluation);
router.get("/health", getAdminHealth);

export default router;