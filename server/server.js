const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { PORT } = require('./config/env');
const { connectDB } = require('./config/db');

// Services
const ingestion = require('./services/ingestion');
const anomaly = require('./services/anomaly');
const broadcast = require('./services/broadcast');

// Socket namespaces
const { setupIngestNamespace } = require('./sockets/ingest');
const { setupDashboardNamespace } = require('./sockets/dashboard');
const { computeRollups } = require('./services/rollup');

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const telemetryRoutes = require('./routes/telemetry');
const serviceRoutes = require('./routes/services');
const alertRoutes = require('./routes/alerts');
const ingestRoutes = require('./routes/ingest');
const statsRoutes = require('./routes/stats');

// ── Express app ──────────────────────────────────────────────
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── HTTP + Socket.IO server ──────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true },
});

// Setup namespaces
setupIngestNamespace(io);
const dashboardNs = setupDashboardNamespace(io);

// ── Wire ingestion → broadcast + anomaly ─────────────────────
ingestion.onFlush = async (flushedEvents) => {
  // Broadcast to dashboard clients
  broadcast.addEvents(flushedEvents);

  // Compute rollups
  try {
    await computeRollups(flushedEvents);
  } catch (err) {
    console.error('[server] rollup error:', err.message);
  }

  // Anomaly detection
  try {
    const alerts = await anomaly.processEvents(flushedEvents);
    for (const alert of alerts) {
      broadcast.emitAlert(dashboardNs, alert);
    }
  } catch (err) {
    console.error('[server] anomaly error:', err.message);
  }
};

// ── Start ────────────────────────────────────────────────────
async function start() {
  await connectDB();

  ingestion.startFlushing();
  broadcast.startBroadcasting(dashboardNs);
  anomaly.startHeartbeatChecker(dashboardNs, broadcast);

  server.listen(PORT, () => {
    console.log(`[server] Mernify backend running on port ${PORT}`);
  });
}

// ── Graceful shutdown ────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[server] ${signal} received — shutting down...`);
  ingestion.stopFlushing();
  broadcast.stopBroadcasting();
  anomaly.stopHeartbeatChecker();

  // Flush remaining events
  await ingestion.flush();

  io.close();
  server.close(() => {
    console.log('[server] HTTP server closed');
    process.exit(0);
  });

  // Force exit after 5s
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

module.exports = { app, server, io };
