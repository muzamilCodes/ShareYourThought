import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || '',
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || '*',
  jwtSecret: process.env.JWT_SECRET || 'thoughtshare_jwt_secret_dev_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // SMTP Email
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@thoughtshare.local',
  smtpSecure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,

  // Cloudinary
  cloudName: process.env.CLOUD_NAME || '',
  cloudApiKey: process.env.CLOUD_API_KEY || '',
  cloudApiSecret: process.env.CLOUD_API_SECRET || '',

  // OTP Configuration
  otpLength: Number(process.env.OTP_LENGTH || 6),
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 10),
  otpDeliveryMode: process.env.OTP_DELIVERY_MODE || 'email',
  otpSenderEmail: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'no-reply@thoughtshare.local'
};

export default env;

