// src/config/db.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error(
    'FATAL: No MongoDB connection string found. Set MONGO_URI (or MONGODB_URI) in environment variables.'
  );
  // Do not attempt to connect to localhost as a fallback in production
  throw new Error('MONGO_URI not set');
}

/**
 * Connect to MongoDB with a simple retry mechanism.
 * @param {object} options optional settings: retries, delayMs
 */
async function connectDB({ retries = 5, delayMs = 5000 } = {}) {
  // Optional: tune mongoose globally (not required)
  // mongoose.set('strictQuery', true);

  async function tryConnect(remaining) {
    try {
      console.log('Attempting MongoDB connection...');
      // Note: do NOT pass useNewUrlParser / useUnifiedTopology (deprecated warnings)
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB connected');
      return;
    } catch (err) {
      console.error(`MongoDB connection error: ${err.message}`);
      if (remaining > 0) {
        console.log(`Retrying in ${delayMs / 1000}s... (${remaining} attempts left)`);
        await new Promise((res) => setTimeout(res, delayMs));
        return tryConnect(remaining - 1);
      } else {
        console.error('Failed to connect to MongoDB after retries.');
        // throw to let caller decide (your server.start handles process.exit)
        throw err;
      }
    }
  }

  return tryConnect(retries);
}

module.exports = connectDB;
