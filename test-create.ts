import mongoose from 'mongoose';
import { connectDB } from './src/lib/db.js';
import { Tournament } from './src/models/Tournament.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  await connectDB();
  try {
    const t = await Tournament.create({
      matchMode: 'BR',
      subMode: 'Solo',
      entryFee: 10,
      prizePool: 100,
      startTime: new Date()
    });
    console.log("Created successfully", t);
  } catch (err) {
    console.log("Error creating:", err);
  }
  process.exit();
}
main();
