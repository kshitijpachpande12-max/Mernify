/**
 * scripts/simulator.js
 * Real-time load & chaos telemetry generator for MERNIFY.
 * Usage: node simulator.js --sources 200 --interval 1000 --apiKey dev-key --project proj_demo [--chaos] [--server http://localhost:5000]
 */

const { io } = require('socket.io-client');
const { ulid } = require('ulid');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('sources', {
    alias: 's',
    type: 'number',
    default: 200,
    description: 'Number of sources/instances to simulate'
  })
  .option('interval', {
    alias: 'i',
    type: 'number',
    default: 1000,
    description: 'Tick interval in milliseconds'
  })
  .option('apiKey', {
    alias: 'k',
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
    description: 'MERNIFY server URL'
  })
  .help()
  .argv;

const { sources: numSources, interval, apiKey, project: projectId, chaos, server: serverUrl } = argv;

console.log('--- MERNIFY Telemetry Simulator ---');
console.log(`Server:    ${serverUrl}`);
console.log(`Project:   ${projectId}`);
console.log(`API Key:   ${apiKey}`);
console.log(`Sources:   ${numSources}`);
console.log(`Interval:  ${interval}ms`);
console.log(`Chaos:     ${chaos ? 'ENABLED (5% dup, 3% ooo, 1% malformed)' : 'DISABLED'}`);
console.log('-----------------------------------');

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

// Connect to Socket.IO /ingest namespace
const ingestUrl = `${serverUrl.replace(/\/$/, '')}/ingest`;
const socket = io(ingestUrl, {
  auth: { apiKey },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log(`[simulator] Connected to ingest namespace at ${ingestUrl} (socket id: ${socket.id})`);
});

socket.on('connect_error', (err) => {
  console.error(`[simulator] Connection error: ${err.message}`);
});

socket.on('disconnect', (reason) => {
  console.warn(`[simulator] Disconnected: ${reason}`);
});

let tickCount = 0;

function generateEnvelope(src, type, payload, customSeq, customEventId) {
  let eventId = customEventId || ulid();
  let seq = customSeq !== undefined ? customSeq : src.seq++;

  if (chaos) {
    // 5% duplicate eventIds
    if (recentEventIds.length > 20 && Math.random() < 0.05) {
      const idx = Math.floor(Math.random() * recentEventIds.length);
      eventId = recentEventIds[idx];
    } else {
      recentEventIds.push(eventId);
      if (recentEventIds.length > 500) recentEventIds.shift();
    }

    // 3% out-of-order seq
    if (Math.random() < 0.03) {
      seq = Math.max(1, seq - Math.floor(Math.random() * 5) - 1);
    }

    // 1% malformed payload
    if (Math.random() < 0.01) {
      return {
        eventId,
        projectId: null, // missing required
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
    seq,
    ts: Date.now(),
    type,
    payload
  };
}

function tick() {
  if (!socket.connected) {
    return;
  }

  tickCount++;
  const envelopes = [];
  const now = Date.now();

  for (const src of sources) {
    src.uptimeSec += Math.round(interval / 1000);

    // Sine-wave drift + occasional spike (~1%)
    const isCpuSpike = Math.random() < 0.01;
    const sineFactor = Math.sin((tickCount * src.cpuDriftFreq) + src.cpuPhase);
    let cpuPercent = src.baseCpu + (sineFactor * 15) + ((Math.random() - 0.5) * 6);
    if (isCpuSpike) {
      cpuPercent = 88 + Math.random() * 10; // 88% - 98%
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

    // 3. Heartbeat envelope (every ~3 ticks to avoid bloat, or every tick)
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

  // Send batch via Socket.IO ingest
  if (envelopes.length > 0) {
    const count = envelopes.length;
    windowSent += count;
    totalSent += count;

    socket.emit('ingest', envelopes, (ack) => {
      if (ack) {
        totalAccepted += (ack.accepted || 0);
        totalDuplicates += (ack.duplicates || 0);
        totalRejected += (ack.rejected || 0);
      }
    });
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

const timer = setInterval(tick, interval);

process.on('SIGINT', () => {
  console.log('\n[simulator] Stopping simulation...');
  clearInterval(timer);
  socket.disconnect();
  process.exit(0);
});
