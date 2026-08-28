import mongoose from 'mongoose';
import env from './env.js';

export default async function connectDB() {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is required to start the backend');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
}
