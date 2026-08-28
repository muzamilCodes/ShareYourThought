import { body, query } from "express-validator";
import { BOOKING_STATUS } from "../constants/booking.js";

export const bookingBaseValidator = [
  body("providerId").optional().isMongoId(),
  body("customerName").trim().notEmpty(),
  body("customerPhone").trim().notEmpty(),
  body("serviceType").trim().notEmpty(),
  body("serviceDescription").trim().notEmpty(),
  body("address.city").trim().notEmpty(),
  body("address.pincode").trim().notEmpty(),
  body("address.fullAddress").trim().notEmpty(),
  body("address.location.lat").optional().isFloat(),
  body("address.location.lng").optional().isFloat(),
  body("isEmergency").optional().isBoolean(),
  body("bookingOtp").trim().notEmpty()
];

export const bookingStatusValidator = [body("status").isIn(BOOKING_STATUS)];

export const bookingListValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("status").optional().isIn(BOOKING_STATUS),
  query("serviceType").optional().trim()
];
