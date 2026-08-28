import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty(),
  body("email").optional().isEmail(),
  body("phone").optional().isLength({ min: 8, max: 20 }),
  body("password").optional().isLength({ min: 6 }),
  body("email").custom((value, { req }) => {
    if (!value && !req.body.phone) {
      throw new Error("Email or phone is required");
    }
    return true;
  })
];

export const verifyOtpValidator = [
  body("contact").trim().notEmpty(),
  body("purpose").isIn(["register", "login", "booking"]),
  body("otp").isLength({ min: 4, max: 8 })
];

export const loginValidator = [
  body("contact").trim().notEmpty(),
  body("password").optional().isLength({ min: 6 })
];
