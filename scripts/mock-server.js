/**
 * scripts/mock-server.js
 * In-memory Mock Express + Socket.IO server on port 5000 for MERNIFY.
 */

const http = require('http');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { ulid } = require('ulid');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'mock-secret';

// In-Memory Storage
const users = [
  {
    id: 'user_demo',
    email: 'demo@mernify.dev',
    password: 'demo1234',
    name: 'Demo User'
  }
];

const projects = [
  {
    id: 'proj_demo',
    name: 'Demo Project',
    apiKey: 'dev-key',
    createdAt: new Date().toISOString()
  }
];

// Telemetry store: array of valid envelopes
const telemetryEvents = [];
const seenEventIds = new Set();
const alerts = [];

// Service tracking:
// Map<projectId, Map<serviceName, Map<instanceId, { lastSeen: number, status: 'up' | 'down' }>>>
const serviceRegistry = new Map();

// Dashboard buffered batches:
// Map<roomKey, envelope[]>
const bufferMap = new Map();

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Helper: JWT verification middleware with multiple secret fallback
const KNOWN_SECRETS = [
  JWT_SECRET,
  'change-me-in-production',
  'dev_secret_jwt_key_12345',
  'dev-secret'
];

function verifyAnyJwt(token) {
  if (!token) return null;
  for (const sec of KNOWN_SECRETS) {
    try {
      return jwt.verify(token, sec);
    } catch {}
  }
  return null;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyAnyJwt(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = decoded;
  next();
}

// ---------------- REST API ----------------

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }
  const user = {
    id: `user_${ulid()}`,
    name: name || email.split('@')[0],
    email,
    password
  };
  users.push(user);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// GET /api/projects
app.get('/api/projects', requireAuth, (req, res) => {
  res.json(projects);
});

// POST /api/projects
app.post('/api/projects', requireAuth, (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'Project name required' });
  }
  const newProject = {
    id: `proj_${ulid().toLowerCase()}`,
    name,
    apiKey: `key_${ulid().toLowerCase()}`,
    createdAt: new Date().toISOString()
  };
  projects.push(newProject);
  res.status(201).json(newProject);
});

// DELETE /api/projects/:id
app.delete('/api/projects/:id', (req, res) => {
  const targetId = req.params.id;
  const idx = projects.findIndex(
    (p) => p.id === targetId || p.apiKey === targetId || p.name === targetId
  );
  if (idx !== -1) {
    const deleted = projects.splice(idx, 1)[0];
    telemetryEvents = telemetryEvents.filter(
      (ev) => ev.projectId !== targetId && ev.projectId !== deleted.id
    );
    serviceRegistry.delete(targetId);
    serviceRegistry.delete(deleted.id);
    alerts = alerts.filter((a) => a.projectId !== targetId && a.projectId !== deleted.id);
  }
  res.json({ id: targetId, message: 'Project deleted successfully' });
});

// GET /api/services?projectId
app.get('/api/services', (req, res) => {
  const projectId = req.query.projectId;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const projServices = serviceRegistry.get(projectId);
  if (!projServices) {
    return res.json([]);
  }

  const result = [];
  const now = Date.now();
  for (const [serviceName, instancesMap] of projServices.entries()) {
    const instances = [];
    for (const [instanceId, instData] of instancesMap.entries()) {
      const isUp = (now - instData.lastSeen) <= 15000;
      instances.push({
        instanceId,
        status: isUp ? 'up' : 'down',
        lastSeen: instData.lastSeen
      });
    }
    result.push({
      serviceName,
      instances
    });
  }
  res.json(result);
});

// GET /api/telemetry?projectId&service&type&from&to&limit&bucket
app.get('/api/telemetry', (req, res) => {
  const { projectId, service, type, from, to, limit, bucket } = req.query;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  const fromTs = from ? Number(from) : 0;
  const toTs = to ? Number(to) : Date.now();
  const maxLimit = limit ? Math.min(Number(limit), 5000) : 1000;

  let filtered = telemetryEvents.filter(ev => {
    if (ev.projectId !== projectId) return false;
    if (service && ev.serviceName !== service) return false;
    if (type && ev.type !== type) return false;
    if (ev.ts < fromTs || ev.ts > toTs) return false;
    return true;
  });

  // Sort by timestamp ascending
  filtered.sort((a, b) => a.ts - b.ts);

  if (filtered.length > maxLimit) {
    filtered = filtered.slice(filtered.length - maxLimit);
  }

  res.json({
    points: filtered,
    asOf: Date.now()
  });
});

// GET /api/alerts?projectId
app.get('/api/alerts', (req, res) => {
  const { projectId } = req.query;
  const filtered = projectId ? alerts.filter(a => a.projectId === projectId) : alerts;
  res.json(filtered.slice(-100));
});

// Ingest validation and processing
function processIngestBatch(events, key) {
  let accepted = 0;
  let duplicates = 0;
  let rejected = 0;

  if (!Array.isArray(events)) {
    return { accepted: 0, duplicates: 0, rejected: 1 };
  }

  const now = Date.now();

  for (const ev of events) {
    if (!ev || typeof ev !== 'object') {
      rejected++;
      continue;
    }
    const { eventId, projectId, serviceName, instanceId, ts, type, payload } = ev;
    if (!eventId || !projectId || !serviceName || !instanceId || !type || !payload) {
      rejected++;
      continue;
    }

    if (seenEventIds.has(eventId)) {
      duplicates++;
      continue;
    }

    seenEventIds.add(eventId);
    // Keep set bounded to last 200,000 entries
    if (seenEventIds.size > 200000) {
      const first = seenEventIds.values().next().value;
      seenEventIds.delete(first);
    }

    accepted++;
    telemetryEvents.push(ev);
    // Keep telemetry bounded in memory (e.g. 100,000)
    if (telemetryEvents.length > 100000) {
      telemetryEvents.shift();
    }

    // Update service registry
    updateServiceState(projectId, serviceName, instanceId, ts || now);

    // Check synthetic alerts
    checkAlerts(ev);

    // Buffer for dashboard namespace
    bufferEnvelope(ev);
  }

  return { accepted, duplicates, rejected };
}

// POST /api/ingest
app.post('/api/ingest', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  const proj = projects.find(p => p.apiKey === apiKey);
  if (!proj) {
    return res.status(403).json({ error: 'Invalid apiKey' });
  }

  const { events } = req.body || {};
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'Body must contain events array' });
  }

  const result = processIngestBatch(events, apiKey);
  res.json(result);
});

// ---------------- Service State & Alerts ----------------

function updateServiceState(projectId, serviceName, instanceId, ts) {
  if (!serviceRegistry.has(projectId)) {
    serviceRegistry.set(projectId, new Map());
  }
  const projMap = serviceRegistry.get(projectId);
  if (!projMap.has(serviceName)) {
    projMap.set(serviceName, new Map());
  }
  const svcMap = projMap.get(serviceName);

  const prev = svcMap.get(instanceId);
  const wasDown = !prev || prev.status === 'down';

  svcMap.set(instanceId, {
    lastSeen: ts,
    status: 'up'
  });

  if (wasDown) {
    emitServiceStatus(projectId, serviceName, instanceId, 'up', ts);
  }
}

function emitServiceStatus(projectId, serviceName, instanceId, status, lastSeen) {
  const statusPayload = {
    projectId,
    serviceName,
    instanceId,
    status,
    lastSeen
  };
  const room = `project:${projectId}:service:${serviceName}`;
  dashboardNs.to(room).emit('service:status', statusPayload);
  dashboardNs.to(`project:${projectId}`).emit('service:status', statusPayload);
}

function checkAlerts(ev) {
  const { projectId, serviceName, type, payload, ts } = ev;

  // CPU ZScore alert
  if (type === 'metrics' && payload && typeof payload.cpuPercent === 'number') {
    const cpu = payload.cpuPercent;
    if (cpu > 95) {
      triggerAlert({
        id: ulid(),
        projectId,
        serviceName,
        type: 'zscore',
        metric: 'cpuPercent',
        severity: 'critical',
        message: `Critical CPU spike on ${serviceName}: ${cpu.toFixed(1)}%`,
        value: cpu,
        threshold: 95,
        ts: ts || Date.now(),
        resolved: false
      });
    } else if (cpu > 85) {
      triggerAlert({
        id: ulid(),
        projectId,
        serviceName,
        type: 'zscore',
        metric: 'cpuPercent',
        severity: 'warning',
        message: `High CPU warning on ${serviceName}: ${cpu.toFixed(1)}%`,
        value: cpu,
        threshold: 85,
        ts: ts || Date.now(),
        resolved: false
      });
    }
  }

  // Error rate alert
  if (type === 'http' && payload) {
    const { requests = 0, errors4xx = 0, errors5xx = 0 } = payload;
    const totalErrors = errors4xx + errors5xx;
    if (requests > 0) {
      const errRate = (totalErrors / requests) * 100;
      if (errRate > 15 || totalErrors > 25) {
        triggerAlert({
          id: ulid(),
          projectId,
          serviceName,
          type: 'error_rate',
          metric: 'httpErrorRate',
          severity: errRate > 30 ? 'critical' : 'warning',
          message: `Elevated error rate on ${serviceName}: ${errRate.toFixed(1)}% (${totalErrors} errors)`,
          value: errRate,
          threshold: 15,
          ts: ts || Date.now(),
          resolved: false
        });
      }
    }
  }
}

function triggerAlert(alert) {
  alerts.push(alert);
  if (alerts.length > 1000) alerts.shift();

  const room = `project:${alert.projectId}:service:${alert.serviceName}`;
  dashboardNs.to(room).emit('alert:new', alert);
  dashboardNs.to(`project:${alert.projectId}`).emit('alert:new', alert);
}

// Check for 15s service down periodically
setInterval(() => {
  const now = Date.now();
  for (const [projectId, projMap] of serviceRegistry.entries()) {
    for (const [serviceName, svcMap] of projMap.entries()) {
      for (const [instanceId, instData] of svcMap.entries()) {
        if (instData.status === 'up' && (now - instData.lastSeen > 15000)) {
          instData.status = 'down';
          emitServiceStatus(projectId, serviceName, instanceId, 'down', instData.lastSeen);

          triggerAlert({
            id: ulid(),
            projectId,
            serviceName,
            type: 'service_down',
            metric: 'heartbeat',
            severity: 'critical',
            message: `Service instance ${instanceId} of ${serviceName} is down (silence > 15s)`,
            value: (now - instData.lastSeen) / 1000,
            threshold: 15,
            ts: now,
            resolved: false
          });
        }
      }
    }
  }
}, 2000);

// ---------------- Socket.IO Ingest Namespace ----------------

const ingestNs = io.of('/ingest');

ingestNs.use((socket, next) => {
  const apiKey = socket.handshake.auth && socket.handshake.auth.apiKey;
  if (!apiKey) {
    return next(new Error('Authentication error: Missing apiKey in auth handshake'));
  }
  const proj = projects.find(p => p.apiKey === apiKey);
  if (!proj) {
    return next(new Error('Authentication error: Invalid apiKey'));
  }
  socket.project = proj;
  next();
});

ingestNs.on('connection', (socket) => {
  socket.on('ingest', (events, callback) => {
    const result = processIngestBatch(events, socket.project.apiKey);
    if (typeof callback === 'function') {
      callback(result);
    }
  });
});

// ---------------- Socket.IO Dashboard Namespace ----------------

const dashboardNs = io.of('/dashboard');

dashboardNs.use((socket, next) => {
  const token =
    (socket.handshake.auth && socket.handshake.auth.token) ||
    (socket.handshake.query && socket.handshake.query.token) ||
    (socket.handshake.headers.authorization || '').replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication error: Missing token in auth'));
  }

  const decoded = verifyAnyJwt(token);
  if (!decoded) {
    return next(new Error('Authentication error: Invalid token'));
  }
  socket.user = decoded;
  next();
});

dashboardNs.on('connection', (socket) => {
  socket.on('subscribe', (data) => {
    if (!data || !data.projectId) return;
    const { projectId, services } = data;

    // Join general project room
    socket.join(`project:${projectId}`);

    if (Array.isArray(services) && services.length > 0) {
      services.forEach(svc => {
        const room = `project:${projectId}:service:${svc}`;
        socket.join(room);
      });
    }
  });

  socket.on('unsubscribe', (data) => {
    if (!data || !data.projectId) return;
    const { projectId, services } = data;

    if (Array.isArray(services) && services.length > 0) {
      services.forEach(svc => {
        const room = `project:${projectId}:service:${svc}`;
        socket.leave(room);
      });
    } else {
      socket.leave(`project:${projectId}`);
    }
  });
});

// Buffering and flushing batches every 100ms
function bufferEnvelope(ev) {
  const room = `project:${ev.projectId}:service:${ev.serviceName}`;
  if (!bufferMap.has(room)) {
    bufferMap.set(room, []);
  }
  bufferMap.get(room).push(ev);
}

setInterval(() => {
  for (const [room, batch] of bufferMap.entries()) {
    if (batch.length > 0) {
      dashboardNs.to(room).emit('metrics:batch', batch);
      bufferMap.set(room, []);
    }
  }
}, 100);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-server] MERNIFY Mock Server running on http://localhost:${PORT}`);
  console.log(`[mock-server] Ingest namespace: ws://localhost:${PORT}/ingest`);
  console.log(`[mock-server] Dashboard namespace: ws://localhost:${PORT}/dashboard`);
  console.log(`[mock-server] Demo user: demo@mernify.dev / demo1234, API Key: dev-key`);
});
