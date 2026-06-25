import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    photoURL: {
      type: String,
      default: "",
    },
    authProvider: {
      type: String,
      enum: ["google", "password"],
      default: "password",
    },
    credits: {
      type: Number,
      default: 5,
      min: 0,
    },
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);
export default User;