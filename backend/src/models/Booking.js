import mongoose from "mongoose";
import { BOOKING_STATUS, BOOKING_MODE } from "../constants/booking.js";

const bookingAddressSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    location: {
      lat: Number,
      lng: Number
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    serviceType: { type: String, required: true, trim: true },
    serviceDescription: { type: String, required: true, trim: true },
    address: { type: bookingAddressSchema, required: true },
    status: {
      type: String,
      enum: BOOKING_STATUS,
      default: "pending"
    },
    mode: {
      type: String,
      enum: Object.values(BOOKING_MODE),
      required: true
    },
    isEmergency: { type: Boolean, default: false },
    scheduledFor: Date,
    bookingOtpVerified: { type: Boolean, default: false },
    whatsappLink: String
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, status: 1 });

export default mongoose.model("Booking", bookingSchema);
