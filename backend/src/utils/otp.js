import crypto from "crypto";
import nodemailer from "nodemailer";
import env from "../config/env.js";

export const generateOtpCode = () => {
  const min = 10 ** (env.otpLength - 1);
  const max = 10 ** env.otpLength - 1;
  return String(crypto.randomInt(min, max));
};

const transporter =
  env.smtpHost && env.smtpUser
    ? nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass
        }
      })
    : null;

export const deliverOtp = async ({ contact, code, purpose }) => {
  if (env.otpDeliveryMode === "email" && transporter) {
    await transporter.sendMail({
      from: env.otpSenderEmail,
      to: contact,
      subject: `QuickServices OTP for ${purpose}`,
      text: `Your QuickServices OTP is ${code}. It expires in ${env.otpTtlMinutes} minutes.`
    });
    return;
  }

  if (env.otpDeliveryMode === "sms") {
    console.log(`[SMS OTP] ${contact} -> ${code} (${purpose})`);
    return;
  }

  console.log(`[OTP] ${contact} -> ${code} (${purpose})`);
};
