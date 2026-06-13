import express from "express";
import { protect } from "../controllers/authController.js";
import {
  createCreditOrder,
  verifyCreditPayment,
  getPaymentHistory,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", protect, createCreditOrder);
router.post("/verify", protect, verifyCreditPayment);
router.get("/history", protect, getPaymentHistory);

export default router;