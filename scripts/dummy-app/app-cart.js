/**
 * scripts/dummy-app/app-cart.js
 * Dummy Cart Service on port 4001.
 * Demonstrates telemetry instrumentation with /cart, /pay, /leak, /block, and /health.
 */

const express = require('express');

// Graceful agent initialization
let agent = null;
try {
  agent = require('../../agent');
  if (typeof agent === 'function') {
    agent({ serviceName: 'cart-service', apiKey: 'dev-key', projectId: 'proj_demo', serverUrl: 'http://localhost:5000' });
  } else if (agent && typeof agent.init === 'function') {
    agent.init({ serviceName: 'cart-service', apiKey: 'dev-key', projectId: 'proj_demo', serverUrl: 'http://localhost:5000' });
  }
  console.log('[app-cart] Telemetry agent attached');
} catch (e) {
  console.log('[app-cart] Running without agent (fallback mode):', e.message);
}

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

// In-memory leak storage to prevent garbage collection
const leakedBuffers = [];

// GET & POST /cart
app.all('/cart', (req, res) => {
  res.json({
    service: 'cart-service',
    status: 'ok',
    cart: [
      { id: 'item_1', name: 'Mechanical Keyboard', price: 120, qty: 1 },
      { id: 'item_2', name: 'Ultra-wide Monitor', price: 450, qty: 1 }
    ],
    currency: 'USD',
    subtotal: 570
  });
});

// GET & POST /pay
app.all('/pay', (req, res) => {
  res.json({
    service: 'cart-service',
    status: 'payment_initiated',
    orderId: `ord_${Date.now()}`,
    amount: 570,
    timestamp: new Date().toISOString()
  });
});

// GET /leak - 10MB memory allocation held in memory
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
  // Busy loop for 2000ms
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
    service: 'cart-service',
    status: 'healthy',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[app-cart] Listening on port ${PORT} (http://localhost:${PORT})`);
});
