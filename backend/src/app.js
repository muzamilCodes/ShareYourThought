import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import thoughtRoutes from './routes/thoughtRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import followRoutes from './routes/followRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import draftRoutes from './routes/draftRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import hashtagRoutes from './routes/hashtagRoutes.js';

const app = express();

// Trust reverse proxies (Render, Vercel, Cloudflare, Heroku) so client IP is accurately extracted from X-Forwarded-For
app.set('trust proxy', 1);

// Flexible CORS for local development and cloud deployments (Vercel, Render, custom domains)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (browser requests from Vercel, localhost, etc.)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Express 5 compatible NoSQL injection sanitizer
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      sanitizeData(data[i]);
    }
    return data;
  }
  for (const key of Object.keys(data)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete data[key];
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      sanitizeData(data[key]);
    }
  }
  return data;
}

app.use((req, _res, next) => {
  if (req.body) sanitizeData(req.body);
  if (req.params) sanitizeData(req.params);
  next();
});

app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Root and health check routes
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'ThoughtShare API is running', documentation: '/api/health' });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'thoughtshare-api', status: 'healthy' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'thoughtshare-api', status: 'healthy' });
});

// Mount application routes
const mountAppRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/thoughts`, thoughtRoutes);
  app.use(`${prefix}/comments`, commentRoutes);
  app.use(`${prefix}/likes`, likeRoutes);
  app.use(`${prefix}/follows`, followRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/messages`, messageRoutes);
  app.use(`${prefix}/categories`, categoryRoutes);
  app.use(`${prefix}/reports`, reportRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/drafts`, draftRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}/analytics`, analyticsRoutes);
  app.use(`${prefix}/hashtags`, hashtagRoutes);
  app.use(`${prefix}/search`, hashtagRoutes);
};

// Mount both `/api/...` and fallback `...` routes so requests never 404
mountAppRoutes('/api');
mountAppRoutes('');

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
