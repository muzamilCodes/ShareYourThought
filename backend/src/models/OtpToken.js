import mongoose from "mongoose";

const otpTokenSchema = new mongoose.Schema(
  {
    contact: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["register", "login", "booking"],
      required: true
    },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OtpToken", otpTokenSchema);
