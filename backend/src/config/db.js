import mongoose from 'mongoose';
import dns from 'node:dns';
import env from './env.js';

// Configure DNS servers for MongoDB Atlas SRV connection string resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in restricted environments
}

export default async function connectDB() {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is required to start the backend');
  }

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}
