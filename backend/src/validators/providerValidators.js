import { body, query } from "express-validator";

export const providerUpsertValidator = [
  body("businessName").trim().notEmpty(),
  body("phone").trim().notEmpty(),
  body("whatsappPhone").trim().notEmpty(),
  body("servicesOffered").isArray({ min: 1 }),
  body("categories").isArray({ min: 1 }),
  body("availability.isAvailable").optional().isBoolean(),
  body("availability.scheduleLabel").optional().trim(),
  body("serviceAreas").optional().isArray()
];

export const providerListValidator = [
  query("category").optional().trim(),
  query("search").optional().trim(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 })
];
