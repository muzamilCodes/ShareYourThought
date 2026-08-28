import nodemailer from 'nodemailer';
import env from '../config/env.js';

export async function sendResetPasswordEmail({ to, resetUrl }) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    console.log('[reset-password]', to, resetUrl);
    return { previewUrl: resetUrl };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  return transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: 'Reset your ThoughtShare password',
    text: `Reset your password here: ${resetUrl}`,
    html: `<p>Reset your password here:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });
}
