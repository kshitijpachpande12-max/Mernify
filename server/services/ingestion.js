const TelemetryEvent = require('../models/TelemetryEvent');
const { envelopeSchema } = require('../validation/schemas');
const stats = require('./stats');

// ── Rate limiter (per-project token bucket) ──────────────────
const TOKENS_PER_MIN = parseInt(process.env.RATE_LIMIT_TOKENS_PER_MIN, 10) || 120000;
const REFILL_RATE = TOKENS_PER_MIN / 60000; // tokens per ms

const buckets = new Map(); // projectId -> { tokens, lastRefill }

function consumeTokens(projectId, n) {
  const now = Date.now();
  let bucket = buckets.get(projectId);
  if (!bucket) {
    bucket = { tokens: TOKENS_PER_MIN, lastRefill: now };
    buckets.set(projectId, bucket);
  }
  // Linear refill
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(TOKENS_PER_MIN, bucket.tokens + elapsed * REFILL_RATE);
  bucket.lastRefill = now;

  if (bucket.tokens < n) return false;
  bucket.tokens -= n;
  return true;
}

// ── Sequence tracking ────────────────────────────────────────
const seqTracker = new Map(); // "projectId:serviceName:instanceId" -> lastSeq

function trackSequence(event) {
  const key = `${event.projectId}:${event.serviceName}:${event.instanceId}`;
  const last = seqTracker.get(key);
  if (last !== undefined) {
    if (event.seq <= last) {
      // out-of-order or duplicate seq
    } else if (event.seq !== last + 1) {
      // gap detected
      console.warn(`[ingestion] seq gap for ${key}: expected ${last + 1}, got ${event.seq}`);
    }
  }
  seqTracker.set(key, event.seq);
}

// ── Buffer & flush ───────────────────────────────────────────
let buffer = [];
let flushInterval = null;
let _onFlush = null;

async function ingest(events, project) {
  // Rate limit check
  if (!consumeTokens(String(project._id), events.length)) {
    stats.recordReject(events.length);
    return { accepted: 0, duplicates: 0, rejected: events.length };
  }

  let accepted = 0;
  let rejected = 0;

  for (const raw of events) {
    const result = envelopeSchema.safeParse(raw);
    if (!result.success) {
      rejected++;
      continue;
    }
    const ev = result.data;
    trackSequence(ev);

    buffer.push({
      eventId: ev.eventId,
      projectId: project._id,
      serviceName: ev.serviceName,
      instanceId: ev.instanceId,
      seq: ev.seq,
      ts: new Date(ev.ts),
      type: ev.type,
      payload: ev.payload,
      meta: {
        projectId: String(project._id),
        serviceName: ev.serviceName,
        instanceId: ev.instanceId,
      },
      receivedAt: new Date(),
    });
    accepted++;
  }

  if (rejected > 0) stats.recordReject(rejected);
  if (accepted > 0) stats.recordEvents(accepted);

  // Flush if buffer large enough
  if (buffer.length >= 1000) {
    await flush();
  }

  return { accepted, duplicates: 0, rejected };
}

async function flush() {
  if (buffer.length === 0) return;

  const batch = buffer.splice(0);
  let duplicates = 0;

  try {
    await TelemetryEvent.insertMany(batch, { ordered: false });
  } catch (err) {
    if (err.code === 11000 || (err.writeErrors && err.writeErrors.length)) {
      duplicates = err.writeErrors ? err.writeErrors.length : 1;
      stats.recordDuplicate(duplicates);
    } else {
      // Re-add failed batch (non-dup errors)
      console.error('[ingestion] flush error:', err.message);
      stats.recordDrop(batch.length);
    }
  }

  if (_onFlush) {
    try {
      _onFlush(batch);
    } catch (e) {
      console.error('[ingestion] onFlush callback error:', e.message);
    }
  }
}

function getBuffer() {
  return buffer;
}

function startFlushing() {
  if (flushInterval) return;
  flushInterval = setInterval(() => flush(), 500);
}

function stopFlushing() {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

module.exports = {
  ingest,
  flush,
  getBuffer,
  startFlushing,
  stopFlushing,
  get onFlush() {
    return _onFlush;
  },
  set onFlush(fn) {
    _onFlush = fn;
  },
};
