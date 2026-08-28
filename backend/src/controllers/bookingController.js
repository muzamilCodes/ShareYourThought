import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import OtpToken from "../models/OtpToken.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildWhatsAppLink } from "../utils/whatsapp.js";
import { buildPagination } from "../utils/pagination.js";

const verifyBookingOtp = async (contact, bookingOtp) => {
  const otpRecord = await OtpToken.findOne({
    contact,
    purpose: "booking",
    code: bookingOtp,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new ApiError(401, "Booking OTP is invalid or expired");
  }

  otpRecord.isUsed = true;
  await otpRecord.save();
};

export const createSystemBooking = asyncHandler(async (req, res) => {
  const contact = req.user.phone || req.user.email;
  await verifyBookingOtp(contact, req.body.bookingOtp);

  const provider = req.body.providerId ? await Provider.findById(req.body.providerId) : null;
  if (req.body.providerId && !provider) {
    throw new ApiError(404, "Provider not found");
  }

  const booking = await Booking.create({
    user: req.user._id,
    provider: provider?._id,
    customerName: req.body.customerName,
    customerPhone: req.body.customerPhone,
    serviceType: req.body.serviceType,
    serviceDescription: req.body.serviceDescription,
    address: req.body.address,
    mode: "system",
    isEmergency: req.body.isEmergency || false,
    scheduledFor: req.body.scheduledFor,
    bookingOtpVerified: true
  });

  res.status(201).json({ message: "Booking created", booking });
});

export const generateWhatsAppBookingLink = asyncHandler(async (req, res) => {
  const contact = req.user.phone || req.user.email;
  await verifyBookingOtp(contact, req.body.bookingOtp);

  const provider = await Provider.findById(req.body.providerId);
  if (!provider || !provider.isApproved) {
    throw new ApiError(404, "Approved provider not found");
  }

  const link = buildWhatsAppLink({
    providerPhone: provider.whatsappPhone,
    userName: req.body.customerName,
    phone: req.body.customerPhone,
    address: req.body.address.fullAddress,
    serviceType: req.body.serviceType,
    description: req.body.serviceDescription
  });

  const booking = await Booking.create({
    user: req.user._id,
    provider: provider._id,
    customerName: req.body.customerName,
    customerPhone: req.body.customerPhone,
    serviceType: req.body.serviceType,
    serviceDescription: req.body.serviceDescription,
    address: req.body.address,
    mode: "whatsapp",
    isEmergency: req.body.isEmergency || false,
    bookingOtpVerified: true,
    whatsappLink: link
  });

  res.json({
    message: "WhatsApp booking link generated",
    whatsappLink: link,
    booking
  });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const { page, limit, status, serviceType } = req.query;
  const pagination = buildPagination(page, limit);
  const filter = { user: req.user._id };

  if (status) {
    filter.status = status;
  }
  if (serviceType) {
    filter.serviceType = new RegExp(serviceType, "i");
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("provider", "businessName whatsappPhone categories")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Booking.countDocuments(filter)
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

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  booking.status = req.body.status;
  await booking.save();

  res.json({ message: "Booking status updated", booking });
});
