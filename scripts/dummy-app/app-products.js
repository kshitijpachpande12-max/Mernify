/**
 * scripts/dummy-app/app-products.js
 * Dummy Products Service on port 4003.
 * Demonstrates telemetry instrumentation with /products, /catalog, /leak, /block, and /health.
 */

const express = require('express');

// Graceful agent initialization
let agent = null;
try {
  agent = require('../../agent');
  if (typeof agent === 'function') {
    agent({ serviceName: 'product-service', apiKey: 'dev-key', projectId: 'proj_demo', serverUrl: 'http://localhost:5000' });
  } else if (agent && typeof agent.init === 'function') {
    agent.init({ serviceName: 'product-service', apiKey: 'dev-key', projectId: 'proj_demo', serverUrl: 'http://localhost:5000' });
  }
  console.log('[app-products] Telemetry agent attached');
} catch (e) {
  console.log('[app-products] Running without agent (fallback mode):', e.message);
}

const app = express();
const PORT = process.env.PORT || 4003;

app.use(express.json());
if (agent && typeof agent.middleware === 'function') {
  app.use(agent.middleware());
}

// In-memory leak storage to prevent garbage collection
const leakedBuffers = [];

// GET & POST /products
app.all('/products', (req, res) => {
  res.json({
    service: 'product-service',
    status: 'ok',
    items: [
      { id: 'prod_1', name: 'Mechanical Keyboard Pro', category: 'Peripherals', inStock: true, price: 129 },
      { id: 'prod_2', name: 'Ultra-wide 4K Monitor', category: 'Monitors', inStock: true, price: 499 },
      { id: 'prod_3', name: 'Noise-Cancelling Headphones', category: 'Audio', inStock: false, price: 249 }
    ],
    timestamp: new Date().toISOString()
  });
});

// GET /products/:id
app.get('/products/:id', (req, res) => {
  res.json({
    service: 'product-service',
    id: req.params.id,
    name: 'Sample Product',
    price: 99,
    status: 'available'
  });
});

// GET /leak - 10MB memory allocation
app.get('/leak', (req, res) => {
  const buf = Buffer.alloc(10 * 1024 * 1024, 'X');
  leakedBuffers.push(buf);
  const mem = process.memoryUsage();
  res.json({
    message: 'Allocated 10MB to leak buffer',
    leakedCount: leakedBuffers.length,
    totalLeakedMB: leakedBuffers.length * 10,
    rssMB: Math.round(mem.rss / 1024 / 1024),
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024)
  });
});

// GET /block - 2s CPU busy wait
app.get('/block', (req, res) => {
  const start = Date.now();
  while (Date.now() - start < 2000) {
    Math.sqrt(Math.random() * 1000000);
  }
  res.json({
    message: 'Event loop blocked for 2 seconds',
    actualDurationMs: Date.now() - start
  });
});

// GET /health
app.get('/health', (req, res) => {
  res.json({
    service: 'product-service',
    status: 'healthy',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[app-products] Listening on port ${PORT} (http://localhost:${PORT})`);

  // Periodic request simulation to generate active live telemetry
  setInterval(() => {
    try {
      const http = require('http');
      const req = http.get(`http://localhost:${PORT}/products`, () => {});
      req.on('error', () => {});
    } catch (_) {}
  }, 1500);
});
