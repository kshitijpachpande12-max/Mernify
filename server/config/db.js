const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    const sanitized = MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`[db] Connected to MongoDB: ${sanitized}`);
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
