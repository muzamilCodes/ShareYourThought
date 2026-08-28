import mongoose from 'mongoose';
import env from './env.js';

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
