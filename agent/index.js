'use strict';

let ulid;
try {
  ulid = require('ulid').ulid;
} catch {
  try {
    ulid = require('../scripts/node_modules/ulid').ulid;
  } catch {
    ulid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}
const { createBuffer } = require('./lib/buffer');
const { createTransport } = require('./lib/transport');
const { collect } = require('./lib/collector');
const { createMiddleware } = require('./lib/middleware');
const { setupErrorTracking } = require('./lib/errors');

/**
 * Mernify Agent — lightweight telemetry agent for Node.js applications.
 *
 * Usage:
 *   const mernify = require('mernify-agent');
 *   mernify.init({ apiKey: 'my-key', serviceName: 'my-app' });
 *   app.use(mernify.middleware());
 *   mernify.track('cart.items', 5);
 *   mernify.log('info', 'Server started');
 */

// ── Singleton state ────────────────────────────────────────────────────────

let config = null;        // { apiKey, serverUrl, serviceName, instanceId, projectId }
let seq = 0;              // monotonically increasing counter
let buffer = null;        // createBuffer instance
let transport = null;     // createTransport instance
let metricsTimer = null;
let heartbeatTimer = null;
let flushTimer = null;
let _middleware = null;
let errorTracker = null;
let initialized = false;

// ── Helpers ────────────────────────────────────────────────────────────────

function createEnvelope(type, payload) {
  return {
    eventId: ulid(),
    projectId: config.projectId,
    serviceName: config.serviceName,
    instanceId: config.instanceId,
    seq: seq++,
    ts: Date.now(),
    type,
    payload,
  };
}

function addToBuffer(envelope) {
  if (buffer) {
    buffer.add(envelope);
  }
}

// ── Flush loop ─────────────────────────────────────────────────────────────

async function flushBuffer() {
  if (!buffer || !transport) return;
  try {
    const events = buffer.flush();
    if (events.length === 0) return;
    await transport.send(events);
  } catch (err) {
    console.warn('[mernify-agent] flush error:', err.message);
  }
}

// ── System metrics collection ──────────────────────────────────────────────

async function collectMetrics() {
  try {
    const payload = await collect();
    addToBuffer(createEnvelope('metrics', payload));
  } catch (err) {
    console.warn('[mernify-agent] metrics collection error:', err.message);
  }
}

// ── Heartbeat ──────────────────────────────────────────────────────────────

function sendHeartbeat() {
  try {
    addToBuffer(createEnvelope('heartbeat', {}));
  } catch (err) {
    console.warn('[mernify-agent] heartbeat error:', err.message);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

function agent(opts) {
  if (opts) return agent.init(opts);
  return agent;
}

agent.init = function(opts) {
  try {
    if (initialized) {
      console.warn('[mernify-agent] already initialized — ignoring duplicate init()');
      return agent;
    }

    if (!opts || !opts.apiKey || !opts.serviceName) {
      throw new Error('mernify-agent: apiKey and serviceName are required');
    }

    config = {
      apiKey: opts.apiKey,
      serverUrl: opts.serverUrl || 'http://localhost:5000',
      serviceName: opts.serviceName,
      instanceId: opts.instanceId || ulid(),
      projectId: opts.projectId || 'proj_demo',
    };

    seq = 0;
    buffer = createBuffer(10000);
    transport = createTransport();

    // Connect to server
    transport.connect(config.serverUrl, config.apiKey);

    // Set up error tracking
    errorTracker = setupErrorTracking({
      addToBuffer,
      createEnvelope,
    });

    // Immediate initial metric & heartbeat so service registers instantly
    collectMetrics();
    sendHeartbeat();
    setTimeout(() => { flushBuffer(); }, 100);

    // Start recurring collection timers
    metricsTimer = setInterval(() => { collectMetrics(); }, 2000);
    heartbeatTimer = setInterval(() => { sendHeartbeat(); }, 5000);
    flushTimer = setInterval(() => { flushBuffer(); }, 1000);

    // Unref all timers so they don't keep the process alive
    if (metricsTimer.unref) metricsTimer.unref();
    if (heartbeatTimer.unref) heartbeatTimer.unref();
    if (flushTimer.unref) flushTimer.unref();

    initialized = true;
  } catch (err) {
    console.error('[mernify-agent] init failed:', err.message);
  }

  return agent;
};

agent.middleware = function() {
  if (!initialized) {
    console.warn('[mernify-agent] middleware() called before init() — returning no-op');
    return function noopMiddleware(req, res, next) { next(); };
  }

  if (!_middleware) {
    _middleware = createMiddleware({ addToBuffer, createEnvelope });
  }

  return _middleware;
};

agent.track = function(name, value) {
  try {
    if (!initialized) return;
    addToBuffer(createEnvelope('custom', { name, value }));
  } catch (_) {
    /* never crash host */
  }
};

agent.log = function(level, msg) {
  try {
    if (!initialized) return;
    const allowed = ['info', 'warn', 'error'];
    if (!allowed.includes(level)) {
      console.warn('[mernify-agent] invalid log level "' + level + '", defaulting to "info"');
      level = 'info';
    }
    addToBuffer(createEnvelope('log', { level, message: msg }));
  } catch (_) {
    /* never crash host */
  }
};

agent.addToBuffer = addToBuffer;
agent.createEnvelope = createEnvelope;

module.exports = agent;
