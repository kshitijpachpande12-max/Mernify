/**
 * scripts/simulator.js
 * Real-time load & chaos telemetry generator for Sentinel.
 * Supports both WebSocket (/ingest) and HTTP REST (/api/ingest) for Vercel/cloud deployments.
 * Usage: node simulator.js --sources 10 --interval 1000 --apiKey <KEY> --project <ID> [--server https://...]
 */

const http = require('http');
const https = require('https');
const { io } = require('socket.io-client');
const { ulid } = require('ulid');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('sources', {
    alias: 's',
    type: 'number',
    default: 10,
    description: 'Number of sources/instances to simulate'
  })
  .option('interval', {
    alias: 'i',
    type: 'number',
    default: 1000,
    description: 'Tick interval in milliseconds'
  })
  .option('apiKey', {
    alias: ['k', 'YOUR_API_KEY', 'key'],
    type: 'string',
    default: 'dev-key',
    description: 'Project API key'
  })
  .option('project', {
    alias: 'p',
    type: 'string',
    default: 'proj_demo',
    description: 'Project ID'
  })
  .option('chaos', {
    alias: 'c',
    type: 'boolean',
    default: false,
    description: 'Enable chaos mode (5% dups, 3% out-of-order, 1% malformed)'
  })
  .option('server', {
    type: 'string',
    default: 'http://localhost:5000',
    description: 'Sentinel server URL'
  })
  .option('http', {
    type: 'boolean',
    default: false,
    description: 'Force HTTP REST ingestion instead of WebSocket (ideal for Vercel)'
  })
  .help()
  .argv;

// Resolve apiKey flexibly
const apiKey = (argv.apiKey && argv.apiKey !== 'dev-key')
  ? argv.apiKey
  : (argv.YOUR_API_KEY || argv.key || argv.apiKey || 'dev-key');

const { sources: numSources, interval, project: projectId, chaos, server: rawServerUrl } = argv;
const serverUrl = rawServerUrl.replace(/\/$/, '');

// Auto-detect if we should use HTTP ingestion (Vercel serverless does not keep persistent WebSockets)
const isCloudOrVercel = serverUrl.includes('vercel.app') || serverUrl.startsWith('https:') || argv.http;
let useHttpMode = isCloudOrVercel;

console.log('--- SENTINEL Telemetry Simulator ---');
console.log(`Server:    ${serverUrl}`);
console.log(`Project:   ${projectId}`);
console.log(`API Key:   ${apiKey}`);
console.log(`Sources:   ${numSources}`);
console.log(`Interval:  ${interval}ms`);
console.log(`Transport: ${useHttpMode ? 'HTTP REST (/api/ingest) [Vercel mode]' : 'Socket.IO (/ingest) + HTTP fallback'}`);
console.log(`Chaos:     ${chaos ? 'ENABLED (5% dup, 3% ooo, 1% malformed)' : 'DISABLED'}`);
console.log('------------------------------------');

// Service pool for realistic distribution
const serviceNames = [
  'cart-service',
  'payment-service',
  'product-service',
  'auth-service',
  'inventory-service',
  'order-service',
  'frontend-api'
];

// Initialize sources
const sources = [];
for (let i = 0; i < numSources; i++) {
  const serviceName = serviceNames[i % serviceNames.length];
  const instanceIndex = Math.floor(i / serviceNames.length) + 1;
  const instanceId = `${serviceName}-inst-${instanceIndex}`;

  sources.push({
    serviceName,
    instanceId,
    seq: 1,
    baseCpu: 20 + Math.random() * 30, // 20-50%
    cpuDriftFreq: 0.05 + Math.random() * 0.05,
    cpuPhase: Math.random() * Math.PI * 2,
    baseMemRssMB: 180 + Math.random() * 120, // 180-300MB
    baseLagMs: 2 + Math.random() * 4,
    uptimeSec: Math.floor(Math.random() * 3600)
  });
}

// Stats tracking
let totalSent = 0;
let totalAccepted = 0;
let totalDuplicates = 0;
let totalRejected = 0;
let windowSent = 0;
let lastStatsTime = Date.now();

// Recent event IDs for chaos mode duplication
const recentEventIds = [];

// HTTP REST Ingestion Helper
async function postHttpBatch(events) {
  const url = new URL(`${serverUrl}/api/ingest`);
  const payload = JSON.stringify({ events });
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve) => {
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-api-key': apiKey
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[simulator] HTTP Ingest Error: ${err.message}`);
      resolve(null);
    });
    req.write(payload);
    req.end();
  });
}

// WebSocket setup (if not forced to HTTP mode)
let socket = null;
if (!useHttpMode) {
  const ingestUrl = `${serverUrl}/ingest`;
  socket = io(ingestUrl, {
    auth: { apiKey },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log(`[simulator] Connected to WebSocket ingest at ${ingestUrl}`);
  });

  socket.on('connect_error', (err) => {
    if (!useHttpMode) {
      console.warn(`[simulator] WebSocket unavailable (${err.message}). Auto-switching to HTTP REST ingestion (/api/ingest)...`);
      useHttpMode = true;
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn(`[simulator] WebSocket disconnected: ${reason}`);
  });
}

let tickCount = 0;

function generateEnvelope(src, type, payload, customSeq, customEventId) {
  let eventId = customEventId || ulid();
  let seq = customSeq !== undefined ? customSeq : src.seq++;

  if (chaos) {
    if (recentEventIds.length > 20 && Math.random() < 0.05) {
      const idx = Math.floor(Math.random() * recentEventIds.length);
      eventId = recentEventIds[idx];
    } else {
      recentEventIds.push(eventId);
      if (recentEventIds.length > 500) recentEventIds.shift();
    }

    if (Math.random() < 0.03) {
      seq = Math.max(1, seq - Math.floor(Math.random() * 5) - 1);
    }

    if (Math.random() < 0.01) {
      return {
        eventId,
        projectId: null,
        serviceName: src.serviceName,
        payload: 'INVALID_PAYLOAD'
      };
    }
  }

  return {
    eventId,
    projectId,
    serviceName: src.serviceName,
    instanceId: src.instanceId,
    type,
    seq,
    ts: Date.now(),
    payload
  };
}

async function tick() {
  tickCount++;
  const envelopes = [];

  for (const src of sources) {
    src.uptimeSec += Math.round(interval / 1000);

    const isCpuSpike = Math.random() < 0.01;
    const sineFactor = Math.sin((tickCount * src.cpuDriftFreq) + src.cpuPhase);
    let cpuPercent = src.baseCpu + (sineFactor * 15) + ((Math.random() - 0.5) * 6);
    if (isCpuSpike) {
      cpuPercent = 88 + Math.random() * 10;
    }
    cpuPercent = Math.max(1, Math.min(99.9, cpuPercent));

    const memRssMB = Math.round((src.baseMemRssMB + (sineFactor * 10) + ((Math.random() - 0.5) * 5)) * 10) / 10;
    const heapUsedMB = Math.round((memRssMB * 0.55 + ((Math.random() - 0.5) * 4)) * 10) / 10;
    const eventLoopLagMs = Math.round((src.baseLagMs + (isCpuSpike ? 45 : 0) + (Math.random() * 3)) * 100) / 100;

    // 1. Metrics envelope
    envelopes.push(generateEnvelope(src, 'metrics', {
      cpuPercent: Math.round(cpuPercent * 10) / 10,
      memRssMB,
      heapUsedMB,
      eventLoopLagMs,
      uptimeSec: src.uptimeSec
    }));

    // 2. HTTP envelope
    const isErrorSpike = Math.random() < 0.015;
    const requests = 40 + Math.floor(Math.random() * 100);
    const errors4xx = Math.floor(Math.random() * (isErrorSpike ? 15 : 3));
    const errors5xx = isErrorSpike ? (5 + Math.floor(Math.random() * 20)) : (Math.random() < 0.05 ? 1 : 0);
    const latencyP50 = Math.round(15 + Math.random() * 30);
    const latencyP95 = Math.round(latencyP50 * 2.5 + (isErrorSpike ? 200 : 0));
    const latencyP99 = Math.round(latencyP95 * 1.6);

    envelopes.push(generateEnvelope(src, 'http', {
      windowMs: interval,
      requests,
      errors4xx,
      errors5xx,
      latencyP50,
      latencyP95,
      latencyP99,
      byRoute: {
        'GET /items': {
          count: Math.floor(requests * 0.4),
          errors: Math.floor(errors4xx * 0.5),
          p95: latencyP50 + 10
        },
        'POST /action': {
          count: Math.floor(requests * 0.35),
          errors: errors5xx,
          p95: latencyP95
        },
        'GET /health': {
          count: Math.floor(requests * 0.25),
          errors: 0,
          p95: 5
        }
      }
    }));

    // 3. Heartbeat envelope
    if (tickCount % 3 === 0) {
      envelopes.push(generateEnvelope(src, 'heartbeat', {}));
    }

    // 4. Occasional error envelope
    if (isErrorSpike || Math.random() < 0.02) {
      envelopes.push(generateEnvelope(src, 'error', {
        message: isErrorSpike ? 'Connection pool exhausted on database replica' : 'Unhandled promise rejection in worker handler',
        stackHash: isErrorSpike ? 'err_db_pool_timeout' : 'err_unhandled_promise_rej',
        route: 'POST /action',
        count: 1,
        stack: 'Error: Connection pool exhausted\n    at Pool.acquire (/app/node_modules/pool/index.js:84:11)\n    at Handler.process (/app/src/handler.js:32:15)'
      }));
    }
  }

  // Send batch
  if (envelopes.length > 0) {
    const count = envelopes.length;
    windowSent += count;
    totalSent += count;

    if (useHttpMode || !socket || !socket.connected) {
      // Send via HTTP REST
      const ack = await postHttpBatch(envelopes);
      if (ack) {
        totalAccepted += (ack.accepted || count);
        totalDuplicates += (ack.duplicates || 0);
        totalRejected += (ack.rejected || 0);
      } else {
        totalAccepted += count;
      }
    } else {
      // Send via WebSocket
      socket.emit('ingest', envelopes, (ack) => {
        if (ack) {
          totalAccepted += (ack.accepted || 0);
          totalDuplicates += (ack.duplicates || 0);
          totalRejected += (ack.rejected || 0);
        }
      });
    }
  }
}

// Stats timer: every 5s
setInterval(() => {
  const now = Date.now();
  const elapsedSec = (now - lastStatsTime) / 1000;
  const rate = Math.round(windowSent / elapsedSec);

  console.log(
    `[simulator] Stats | Rate: ${rate} evt/s | Total Sent: ${totalSent} | ` +
    `Accepted: ${totalAccepted} | Dups: ${totalDuplicates} | Rejected: ${totalRejected} | ` +
    `Sources: ${sources.length}`
  );

  windowSent = 0;
  lastStatsTime = now;
}, 5000);

// Main tick interval
const intervalId = setInterval(tick, interval);

// Graceful exit
function shutdown() {
  console.log('\n[simulator] Stopping simulation...');
  clearInterval(intervalId);
  if (socket) socket.close();
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
