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
  if (!env.smtpUser || !env.smtpPass) {
    return null;
  }
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 6000
    });
  }
  return cachedTransporter;
}

async function sendViaSmtp({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: `"Share Your Thoughts" <${env.smtpUser}>`,
      to,
      replyTo: env.smtpUser,
      sender: env.smtpUser,
      subject,
      text,
      html,
      headers: {
        'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Precedence': 'bulk',
        'Auto-Submitted': 'auto-generated'
      }
    });
    console.log(`[Gmail SMTP] Successfully delivered OTP email to ${to}`);
    return true;
  } catch (err) {
    console.warn(`[Gmail SMTP Warning] Could not send via Gmail to ${to}:`, err.message);
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
          name: 'Share Your Thoughts',
          email: env.brevoSenderEmail || 'warmuzamil68@gmail.com'
        },
        replyTo: {
          name: 'Share Your Thoughts Support',
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
        from: env.resendFrom || 'Share Your Thoughts <onboarding@resend.dev>',
        reply_to: env.smtpUser || 'warmuzamil68@gmail.com',
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

export const deliverOtp = async ({ contact, code, purpose }) => {
  const titles = {
    register: `${code} is your Share Your Thoughts registration code`,
    login: `${code} is your Share Your Thoughts login code`,
    'reset-password': `${code} is your Share Your Thoughts password reset code`
  };

  const actionText = {
    register: 'complete your registration on Share Your Thoughts',
    login: 'log into your Share Your Thoughts account',
    'reset-password': 'reset your Share Your Thoughts account password'
  };

  const subject = titles[purpose] || `${code} is your verification code`;
  const action = actionText[purpose] || 'verify your identity';
  const ttlMinutes = env.otpTtlMinutes || 10;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your 6-digit verification code is ${code}. Valid for ${ttlMinutes} minutes.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="540" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 32px 28px 24px 28px; text-align: center; border-bottom: 1px solid #f4f4f5;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #c86d34; letter-spacing: -0.5px;">Share Your Thoughts</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #71717a;">Authentic Perspectives & Community Ideas</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 28px 20px 28px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #27272a; line-height: 1.5;">
                Use the following 6-digit verification code to <strong>${action}</strong>:
              </p>
              <div style="margin: 20px auto; padding: 14px 28px; background-color: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; display: inline-block;">
                <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #ea580c; font-family: monospace, Courier, sans-serif;">${code}</span>
              </div>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #71717a;">
                ⏳ This code will expire in <strong>${ttlMinutes} minutes</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px 28px 28px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                If you did not make this request, you can safely ignore this message. No changes will be made to your account.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 28px; background-color: #fafafa; border-top: 1px solid #f4f4f5; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #a1a1aa;">
                © ${new Date().getFullYear()} Share Your Thoughts · Built for authentic community perspectives
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `Share Your Thoughts Verification Code\n\nYour 6-digit code is: ${code}\n\nUse this code to ${action}. This code expires in ${ttlMinutes} minutes.\n\nIf you did not request this, please ignore this email.`;

  console.log(`[OTP Generated] Code: ${code} | Target: ${contact} | Purpose: ${purpose}`);

  // 1. Send via Gmail SMTP (Instant direct inbox delivery)
  let delivered = await sendViaSmtp({ to: contact, subject, html: htmlContent, text: textContent });
  if (delivered) return;

  // 2. Fallback to Brevo REST API
  delivered = await sendViaBrevo({ to: contact, subject, html: htmlContent, text: textContent });
  if (delivered) return;

  // 3. Fallback to Resend REST API
  await sendViaResend({ to: contact, subject, html: htmlContent, text: textContent });
};


