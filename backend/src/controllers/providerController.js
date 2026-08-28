import Provider from "../models/Provider.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildPagination } from "../utils/pagination.js";
import { buildWhatsAppLink } from "../utils/whatsapp.js";

export const createOrUpdateProvider = asyncHandler(async (req, res) => {
  const payload = {
    user: req.user._id,
    businessName: req.body.businessName,
    phone: req.body.phone,
    whatsappPhone: req.body.whatsappPhone,
    servicesOffered: req.body.servicesOffered,
    categories: req.body.categories,
    availability: req.body.availability,
    serviceAreas: req.body.serviceAreas
  };

  const provider = await Provider.findOneAndUpdate({ user: req.user._id }, payload, {
    new: true,
    upsert: true
  });

  res.status(201).json({
    message: "Provider profile submitted. Awaiting admin approval if not approved yet.",
    provider
  });
});

export const listProviders = asyncHandler(async (req, res) => {
  const { category, search, page, limit } = req.query;
  const pagination = buildPagination(page, limit);
  const filter = { isApproved: true };

  if (category) {
    filter.categories = category;
  }

  if (search) {
    filter.$or = [
      { businessName: new RegExp(search, "i") },
      { servicesOffered: new RegExp(search, "i") },
      { categories: new RegExp(search, "i") }
    ];
  }

  const [providers, total] = await Promise.all([
    Provider.find(filter)
      .sort({ completedJobs: -1, rating: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Provider.countDocuments(filter)
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

export const getProviderWhatsAppContact = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.providerId);
  if (!provider || !provider.isApproved) {
    throw new ApiError(404, "Provider not found");
  }

  const link = buildWhatsAppLink({
    providerPhone: provider.whatsappPhone,
    userName: req.user?.name || "Guest",
    phone: req.user?.phone || "Not provided",
    address: req.user?.address?.fullAddress || "Will share on chat",
    serviceType: req.query.serviceType || provider.categories[0],
    description: req.query.description || "Need service assistance"
  });

  res.json({ whatsappLink: link, provider });
});
