const Alert = require('../models/Alert');
const ServiceState = require('../models/ServiceState');
const { ulid } = require('ulid');

// ── Rolling z-score state ────────────────────────────────────
// key: "projectId:serviceName:metric" -> { values: number[], consecutive: number }
const zscoreState = new Map();
const Z_THRESHOLD = 3;
const CONSECUTIVE_REQUIRED = 3;
const WINDOW_SIZE = 100;

function rollingZscore(key, value) {
  let state = zscoreState.get(key);
  if (!state) {
    state = { values: [], consecutive: 0 };
    zscoreState.set(key, state);
  }

  state.values.push(value);
  if (state.values.length > WINDOW_SIZE) {
    state.values.shift();
  }

  if (state.values.length < 10) return null; // Not enough data

  const n = state.values.length;
  const mean = state.values.reduce((a, b) => a + b, 0) / n;
  const variance = state.values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  if (std === 0) {
    state.consecutive = 0;
    return null;
  }

  const z = Math.abs((value - mean) / std);

  if (z > Z_THRESHOLD) {
    state.consecutive++;
    if (state.consecutive >= CONSECUTIVE_REQUIRED) {
      state.consecutive = 0; // Reset after alerting
      return { z, mean, std };
    }
  } else {
    state.consecutive = 0;
  }

  return null;
}

// ── Error rate tracking ──────────────────────────────────────
const ERROR_RATE_THRESHOLD = 0.1; // 10%

// ── Process events ───────────────────────────────────────────
async function processEvents(events) {
  const newAlerts = [];

  for (const ev of events) {
    const projectId = ev.projectId;
    const serviceName = ev.serviceName;

    // Z-score on http latencyP95
    if (ev.type === 'http' && ev.payload && ev.payload.latencyP95 !== undefined) {
      const key = `${projectId}:${serviceName}:latencyP95`;
      const anomaly = rollingZscore(key, ev.payload.latencyP95);
      if (anomaly) {
        const alert = await Alert.create({
          id: ulid(),
          projectId,
          serviceName,
          type: 'zscore',
          metric: 'latencyP95',
          severity: 'critical',
          message: `Anomalous latencyP95: z=${anomaly.z.toFixed(2)} (mean=${anomaly.mean.toFixed(2)}, std=${anomaly.std.toFixed(2)})`,
          value: ev.payload.latencyP95,
          threshold: Z_THRESHOLD,
          ts: new Date(),
        });
        newAlerts.push(alert);
      }
    }

    // Z-score on metrics cpuPercent
    if (ev.type === 'metrics' && ev.payload && ev.payload.cpuPercent !== undefined) {
      const key = `${projectId}:${serviceName}:cpuPercent`;
      const anomaly = rollingZscore(key, ev.payload.cpuPercent);
      if (anomaly) {
        const alert = await Alert.create({
          id: ulid(),
          projectId,
          serviceName,
          type: 'zscore',
          metric: 'cpuPercent',
          severity: 'warning',
          message: `Anomalous cpuPercent: z=${anomaly.z.toFixed(2)} (mean=${anomaly.mean.toFixed(2)}, std=${anomaly.std.toFixed(2)})`,
          value: ev.payload.cpuPercent,
          threshold: Z_THRESHOLD,
          ts: new Date(),
        });
        newAlerts.push(alert);
      }
    }

    // Error rate threshold (from http events)
    if (ev.type === 'http' && ev.payload) {
      const { requests, errors4xx = 0, errors5xx = 0 } = ev.payload;
      if (requests > 0) {
        const errorRate = (errors4xx + errors5xx) / requests;
        if (errorRate > ERROR_RATE_THRESHOLD) {
          const alert = await Alert.create({
            id: ulid(),
            projectId,
            serviceName,
            type: 'error_rate',
            metric: 'error_rate',
            severity: errorRate > 0.5 ? 'critical' : 'warning',
            message: `High error rate: ${(errorRate * 100).toFixed(1)}% (${errors4xx + errors5xx}/${requests})`,
            value: errorRate,
            threshold: ERROR_RATE_THRESHOLD,
            ts: new Date(),
          });
          newAlerts.push(alert);
        }
      }
    }

    // Update heartbeat & active service state
    if (ev.type === 'heartbeat' || ev.type === 'metrics' || ev.type === 'http') {
      const prev = await ServiceState.findOneAndUpdate(
        { projectId, serviceName, instanceId: ev.instanceId },
        { lastHeartbeat: new Date(), status: 'up' },
        { upsert: true, returnDocument: 'before' }
      );
      if (!prev || prev.status === 'down') {
        if (_broadcast && _dashboardIo) {
          _broadcast.emitServiceStatus(_dashboardIo, {
            projectId,
            serviceName,
            instanceId: ev.instanceId,
            status: 'up',
            ts: Date.now(),
          });
        }
      }
    }
  }

  return newAlerts;
}

// ── Heartbeat checker ────────────────────────────────────────
const HEARTBEAT_TIMEOUT = 30000; // 30s
let heartbeatInterval = null;
let _dashboardIo = null;
let _broadcast = null;

async function checkHeartbeats() {
  const cutoff = new Date(Date.now() - HEARTBEAT_TIMEOUT);
  try {
    const stale = await ServiceState.find({
      status: 'up',
      lastHeartbeat: { $lt: cutoff },
    });

    const newAlerts = [];
    for (const s of stale) {
      s.status = 'down';
      await s.save();

      const alert = await Alert.create({
        id: ulid(),
        projectId: s.projectId,
        serviceName: s.serviceName,
        type: 'service_down',
        metric: 'heartbeat',
        severity: 'critical',
        message: `Service ${s.serviceName} instance ${s.instanceId} is down (no heartbeat for 30s)`,
        value: 0,
        threshold: HEARTBEAT_TIMEOUT,
        ts: new Date(),
      });
      newAlerts.push(alert);

      if (_broadcast && _dashboardIo) {
        _broadcast.emitServiceStatus(_dashboardIo, {
          projectId: s.projectId,
          serviceName: s.serviceName,
          instanceId: s.instanceId,
          status: 'down',
          ts: Date.now(),
        });
        _broadcast.emitAlert(_dashboardIo, alert);
      }
    }
    return newAlerts;
  } catch (err) {
    console.error('[anomaly] heartbeat check error:', err.message);
    return [];
  }
}

function startHeartbeatChecker(dashboardIo, broadcast) {
  _dashboardIo = dashboardIo;
  _broadcast = broadcast;
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => checkHeartbeats(), 10000);
}

function stopHeartbeatChecker() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

module.exports = {
  processEvents,
  checkHeartbeats,
  startHeartbeatChecker,
  stopHeartbeatChecker,
};
