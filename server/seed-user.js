const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Project = require('./models/Project');

async function seed() {
  await connectDB();

  const email = 'demo@mernify.dev';
  const password = 'demo1234';

  // Upsert demo user
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name: 'Demo User', email, password });
    console.log(`[seed] Created user: ${email} / ${password}`);
  } else {
    console.log(`[seed] User already exists: ${email}`);
  }

  // Upsert demo project
  let project = await Project.findOne({ apiKey: 'dev-key' });
  if (!project) {
    project = await Project.create({
      name: 'Demo Project',
      ownerId: user._id,
      apiKey: 'dev-key',
    });
    console.log(`[seed] Created project "${project.name}" with apiKey: dev-key`);
  } else {
    console.log(`[seed] Project already exists with apiKey: dev-key`);
  }

  console.log('\n--- Seed Complete ---');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`API Key:  dev-key`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
