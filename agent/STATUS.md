# Agent Status

## Completed

All files created under `agent/`:

- **Entry**: `index.js` — `init({ apiKey, serverUrl, serviceName, instanceId? })`, `middleware()`, `track(name, value)`, `log(level, msg)`
- **Buffer**: `lib/buffer.js` — Bounded event buffer (max 10,000 events, drops oldest when full)
- **Collector**: `lib/collector.js` — System metrics via Node.js built-ins (`cpuPercent`, `memRssMB`, `heapUsedMB`, `eventLoopLagMs`, `uptimeSec`)
- **Middleware**: `lib/middleware.js` — Express middleware aggregating requests into 1-second windows (`latencyP50`, `latencyP95`, `latencyP99`, `errors4xx`, `errors5xx`, `byRoute`)
- **Transport**: `lib/transport.js` — Socket.IO client connecting to `/ingest` with `auth: { apiKey }`, retries with exponential backoff (1s, 2s, 4s)
- **Errors**: `lib/errors.js` — Intercepts `uncaughtException` & `unhandledRejection`, SHA-256 stack hash dedup
- **Docs**: `README.md`, `STATUS.md`
- **Package**: `package.json` — `mernify-agent` v1.0.0

## How to Import / Use in Agent 2's Scripts

From `scripts/`:
```js
const mernify = require('../agent'); // or require('mernify-agent')

mernify.init({
  apiKey: 'dev-key',
  serverUrl: 'http://localhost:5000',
  serviceName: 'order-service',
});

// For Express apps:
app.use(mernify.middleware());

// For custom metrics & logs:
mernify.track('checkout.count', 1);
mernify.log('info', 'Service started');
```

## Contract Compliance

| Requirement | Status |
|---|---|
| CommonJS, Node 18+ | ✅ |
| Entry point `agent/index.js` (`require('../../agent')` compatible) | ✅ |
| Envelope format: `{ eventId, projectId, serviceName, instanceId, seq, ts, type, payload }` | ✅ |
| System metrics every 2s (CPU %, RSS MB, Heap Used MB, Event Loop Lag ms, Uptime s) | ✅ |
| System metrics uses Node.js built-ins only (os, process) | ✅ |
| Middleware 1s aggregation window (never 1 event per request) | ✅ |
| HTTP percentiles P50, P95, P99 + per-route breakdown | ✅ |
| Error events with SHA-256 stackHash, stack only on first occurrence | ✅ |
| Heartbeat every 5s | ✅ |
| Buffer bounded at 10,000, drop oldest on overflow | ✅ |
| Flush every 1s or on demand | ✅ |
| Socket.IO namespace `/ingest` with `auth: { apiKey }` | ✅ |
| Non-crashing / resilient (all timers `unref()`-ed) | ✅ |
