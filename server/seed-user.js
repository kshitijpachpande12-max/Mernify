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

  // Upsert demo services in ServiceState so dashboard immediately discovers them
  const ServiceState = require('./models/ServiceState');
  const demoServices = ['cart-service', 'payment-service', 'auth-service'];
  for (const svc of demoServices) {
    await ServiceState.findOneAndUpdate(
      { projectId: project._id, serviceName: svc, instanceId: `${svc}-inst-1` },
      { lastHeartbeat: new Date(), status: 'up' },
      { upsert: true }
    );
  }
  console.log('[seed] Registered demo services: cart-service, payment-service, auth-service');

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
