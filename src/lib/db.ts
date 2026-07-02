import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('MONGODB_URI is not defined. Database features will not work.');
    return;
  }

  try {
    const db = await mongoose.connect(mongoURI);
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
