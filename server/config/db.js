const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

let isConnected = false;

async function connectDB() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    const sanitized = MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`[db] Connected to MongoDB: ${sanitized}`);
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

module.exports = { connectDB };
