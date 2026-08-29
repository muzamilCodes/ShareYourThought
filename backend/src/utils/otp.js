import crypto from 'crypto';
import nodemailer from 'nodemailer';
import env from '../config/env.js';

export const generateOtpCode = () => {
  const length = env.otpLength || 6;
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(crypto.randomInt(min, max));
};

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort || 587,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
}

export const deliverOtp = async ({ contact, code, purpose }) => {
  const titles = {
    register: 'Verify your ThoughtShare Account',
    login: 'Your ThoughtShare Login Code',
    'reset-password': 'Reset your ThoughtShare Password'
  };

  const actionText = {
    register: 'complete your registration on ThoughtShare',
    login: 'log into your ThoughtShare account',
    'reset-password': 'reset your ThoughtShare account password'
  };

  const subject = titles[purpose] || 'Your ThoughtShare Verification Code';
  const action = actionText[purpose] || 'verify your identity';
  const ttlMinutes = env.otpTtlMinutes || 10;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="font-size: 26px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.5px;">ThoughtShare</h1>
        <p style="font-size: 14px; color: #6b7280; margin-top: 4px;">Share your ideas with the world</p>
      </div>

      <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 15px; color: #374151; margin-top: 0; margin-bottom: 16px;">
          Use the following 6-digit verification code to <strong>${action}</strong>:
        </p>

        <div style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #d95b28; background: #fff5eb; border: 2px dashed #f97316; padding: 12px 28px; border-radius: 8px; margin: 8px 0 16px 0;">
          ${code}
        </div>

        <p style="font-size: 13px; color: #6b7280; margin: 0;">
          ⏳ This code will expire in <strong>${ttlMinutes} minutes</strong>.
        </p>
      </div>

      <p style="font-size: 13px; color: #9ca3af; text-align: center; line-height: 1.5; margin: 0;">
        If you did not request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
      </p>

      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0 16px 0;" />

      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} ThoughtShare. All rights reserved.
      </p>
    </div>
  `;

  const textContent = `Your ThoughtShare verification code is: ${code}\n\nUse this code to ${action}. This code expires in ${ttlMinutes} minutes.\n\nIf you did not request this code, please ignore this message.`;

  console.log(`[OTP] Sent ${code} to ${contact} for ${purpose}`);

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.otpSenderEmail || env.smtpFrom,
        to: contact,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`[Email Sent] OTP email successfully sent to ${contact}`);
    } catch (err) {
      console.error(`[Email Error] Failed to send email to ${contact}:`, err.message);
      // Don't throw so dev / fallback mode still proceeds
    }
  }
};

