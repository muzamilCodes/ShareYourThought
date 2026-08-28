import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    businessName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsappPhone: { type: String, required: true, trim: true },
    servicesOffered: [{ type: String, required: true, trim: true }],
    categories: [{ type: String, required: true, trim: true }],
    availability: {
      isAvailable: { type: Boolean, default: true },
      scheduleLabel: { type: String, trim: true }
    },
    serviceAreas: [{ type: String, trim: true }],
    isApproved: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 }
  },
  { timestamps: true }
);

providerSchema.index({ categories: 1, isApproved: 1 });

export default mongoose.model("Provider", providerSchema);
