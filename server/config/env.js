const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/mernify',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
  PORT: parseInt(process.env.PORT, 10) || 5000,
};
