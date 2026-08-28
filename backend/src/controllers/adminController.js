import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildPagination } from "../utils/pagination.js";

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [totalUsers, totalProviders, totalBookings, pendingProviders, emergencyBookings, statusBreakdown] =
    await Promise.all([
      User.countDocuments(),
      Provider.countDocuments(),
      Booking.countDocuments(),
      Provider.countDocuments({ isApproved: false }),
      Booking.countDocuments({ isEmergency: true }),
      Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
    ]);

  res.json({
    totalUsers,
    totalProviders,
    totalBookings,
    pendingProviders,
    emergencyBookings,
    statusBreakdown
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const pagination = buildPagination(req.query.page, req.query.limit);
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    User.countDocuments()
  ]);

  res.json({
    items: users,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit)
    }
  });
});

export const listProvidersAdmin = asyncHandler(async (req, res) => {
  const pagination = buildPagination(req.query.page, req.query.limit);
  const [providers, total] = await Promise.all([
    Provider.find().sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    Provider.countDocuments()
  ]);

  res.json({
    items: providers,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit)
    }
  });
});

export const listBookingsAdmin = asyncHandler(async (req, res) => {
  const pagination = buildPagination(req.query.page, req.query.limit);
  const [bookings, total] = await Promise.all([
    Booking.find()
      .populate("user", "name phone email")
      .populate("provider", "businessName whatsappPhone")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Booking.countDocuments()
  ]);

  res.json({
    items: bookings,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit)
    }
  });
});

export const approveProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.providerId);
  if (!provider) {
    throw new ApiError(404, "Provider not found");
  }
  provider.isApproved = true;
  await provider.save();

  res.json({ message: "Provider approved", provider });
});
