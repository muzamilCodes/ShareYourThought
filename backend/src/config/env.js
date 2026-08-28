import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb+srv://warmuzamil113_db_user:muzamilnabi_123@cluster0.levopet.mongodb.net/shareyourthoughts?retryWrites=true&w=majority',
  clientUrl: process.env.CLIENT_URL || '*',
  jwtSecret:
    process.env.JWT_SECRET ||
    'jhsdjjfjhkzhgsvkvdjfgfjdkhbhjAFDdhfmhnKHCBKNBKNkljhnkhsdjjfjhkzhgsvkvdjfgfjdkhbhjAFDdhfmhnKHCBKNBKNkljhnk',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'no-reply@thoughtshare.local'
};

export default env;
