import express from "express";
import { protect } from "../controllers/authController.js";
import {
  createCreditOrder,
  verifyCreditPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", protect, createCreditOrder);
router.post("/verify", protect, verifyCreditPayment);

export default router;