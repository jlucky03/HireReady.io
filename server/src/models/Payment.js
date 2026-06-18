import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    credits: { type: Number, required: true },
    processingAt: {
  type: Date,
},

paidAt: {
  type: Date,
},
    status: {
  type: String,
  enum: ["created", "processing", "paid", "failed"],
  default: "created",
},
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });
paymentSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

export default mongoose.model("Payment", paymentSchema);