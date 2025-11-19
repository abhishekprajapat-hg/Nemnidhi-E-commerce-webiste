// src/config/db.js
const mongoose = require('mongoose');

const DEFAULT_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useCreateIndex and useFindAndModify removed in mongoose v6
};

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(uri, DEFAULT_OPTIONS);
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err && err.stack ? err.stack : err);
    throw err;
  }
}

module.exports = connectDB;
