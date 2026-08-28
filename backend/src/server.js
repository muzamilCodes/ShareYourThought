import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import { seedCategories } from './utils/seedCategories.js';

async function startServer() {
  // Attempt MongoDB connection
  try {
    await connectDB();
    await seedCategories();
  } catch (error) {
    console.error('⚠️ MongoDB connection failed on startup:', error.message);
    console.log('ℹ️ Server will continue running to serve health checks. Please check your MONGO_URI credentials in Render Environment variables.');
  }

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`🚀 ThoughtShare API running on port ${env.port} in ${env.nodeEnv} mode`);
  });
}

startServer();
