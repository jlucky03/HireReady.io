import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
const CREDIT_PLANS = {
  starter: { credits: 10, amount: 9900 },
  growth: { credits: 25, amount: 19900 },
  pro: { credits: 50, amount: 34900 },
};

export const createCreditOrder = async (req, res) => {
  try {
    
    const { plan } = req.body;
    const selectedPlan = CREDIT_PLANS[plan];

    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid credit plan" });
    }
const razorpay = getRazorpay();
const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: "INR",
      receipt: `cr_${Date.now()}`,
    });

    await Payment.create({
      user: req.user._id,
      razorpayOrderId: order.id,
      amount: selectedPlan.amount,
      credits: selectedPlan.credits,
      status: "created",
    });

    res.status(200).json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      credits: selectedPlan.credits,
    });
  } catch (err) {
  console.error("Create order error:", err);
  res.status(500).json({ message: err.message });
}
};

export const verifyCreditPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        message: "Payment already verified",
        credits: req.user.credits,
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "paid";
    await payment.save();

    req.user.credits += payment.credits;
    await req.user.save();

    res.status(200).json({
      status: "success",
      message: "Credits added successfully",
      credits: req.user.credits,
    });
  } catch (err) {
  console.error("Create order error:", err);
  res.status(500).json({ message: err.message });
}
};