import crypto from 'crypto';
import nodemailer from 'nodemailer';
import env from '../config/env.js';

export const generateOtpCode = () => {
  const length = env.otpLength || 6;
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(crypto.randomInt(min, max));
};

let cachedTransporter = null;

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort || 587,
      secure: env.smtpSecure,
      pool: true,
      maxConnections: 5,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }
  return cachedTransporter;
}

async function sendViaResend({ to, subject, html, text }) {
  if (!env.resendApiKey) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.resendApiKey}`
      },
      body: JSON.stringify({
        from: env.resendFrom || 'ThoughtShare <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        text
      })
    });
    const data = await res.json();
    if (res.ok && data?.id) {
      console.log(`[Resend API] Successfully delivered OTP email to ${to} (ID: ${data.id})`);
      return true;
    }
    console.warn('[Resend API Warning]', data?.message || data);
    return false;
  } catch (err) {
    console.warn('[Resend API Error]', err.message);
    return false;
  }
}

async function sendViaBrevo({ to, subject, html, text }) {
  if (!env.brevoApiKey) return false;
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.brevoApiKey
      },
      body: JSON.stringify({
        sender: {
          name: 'ThoughtShare',
          email: env.brevoSenderEmail || 'warmuzamil68@gmail.com'
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text
      })
    });
    const data = await res.json();
    if (res.ok && (data?.messageId || data?.id)) {
      console.log(`[Brevo API] Successfully delivered OTP email to ${to}`);
      return true;
    }
    console.warn('[Brevo API Warning]', data?.message || data);
    return false;
  } catch (err) {
    console.warn('[Brevo API Error]', err.message);
    return false;
  }
}

async function sendViaSmtp({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: env.otpSenderEmail || env.smtpFrom,
      to,
      subject,
      text,
      html
    });
    console.log(`[SMTP] Successfully delivered OTP email to ${to}`);
    return true;
  } catch (err) {
    console.error(`[SMTP Error] Failed to send email to ${to}:`, err.message);
    return false;
  }
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

  console.log(`[OTP Generated] Code: ${code} | Target: ${contact} | Purpose: ${purpose}`);

  // 1. Try Resend HTTPS REST API (Port 443 - 100% Reliable on Render/Cloud)
  let delivered = await sendViaResend({ to: contact, subject, html: htmlContent, text: textContent });
  if (delivered) return;

  // 2. Try Brevo HTTPS REST API (Port 443)
  delivered = await sendViaBrevo({ to: contact, subject, html: htmlContent, text: textContent });
  if (delivered) return;

  // 3. Try Nodemailer Gmail / SMTP
  await sendViaSmtp({ to: contact, subject, html: htmlContent, text: textContent });
};


