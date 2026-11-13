# Server Status

## Completed

All files created under `server/`:

- **Config**: `config/env.js`, `config/db.js` (supports MongoDB Atlas & local URI with credential masking in logs)
- **Models**: `User.js`, `Project.js`, `TelemetryEvent.js`, `Rollup.js`, `Alert.js`, `ServiceState.js`
- **Middleware**: `auth.js` (JWT), `apiKey.js`, `validate.js` (Zod returning clean JSON error strings)
- **Validation**: `schemas.js` — register, login, project, envelope (with discriminated payload schemas), ingest
- **Routes**: `auth.js`, `projects.js`, `telemetry.js`, `services.js`, `alerts.js`, `ingest.js`, `stats.js`
- **Services**: `stats.js` (includes uptimeSec), `ingestion.js` (rate-limited token bucket configurable via env), `rollup.js`, `anomaly.js`, `broadcast.js`
- **Sockets**: `ingest.js` (apiKey auth, accepts envelope arrays or object batches), `dashboard.js` (JWT auth, multi-room join)
- **Utils**: `utils/projectResolver.js` (resolves by ObjectId, apiKey, or 'proj_demo')
- **Entry**: `server.js` — wires everything, CORS for localhost:5173, graceful shutdown
- **Seed**: `seed-user.js` — demo@mernify.dev / demo1234 / apiKey: dev-key
- **Tests**: `__tests__/validation.test.js`, `__tests__/dedup.test.js` (28/28 pass)
- **Docs**: `README.md`, `STATUS.md`
- **Package**: `package.json`, `.env.example`

## How to Run

```bash
cd server
npm install
cp .env.example .env
# Set MONGO_URI in .env (MongoDB Atlas mongodb+srv://... or local mongodb://...)
npm run seed   # Seeds demo user + project
npm run dev    # Starts with nodemon
```

## Contract Compliance

| Requirement | Status |
|---|---|
| CommonJS modules | ✅ |
| Express + Mongoose + Socket.IO | ✅ |
| Zod validation with per-payload schemas | ✅ |
| JWT auth middleware | ✅ |
| API key auth middleware | ✅ |
| Time-series TelemetryEvent | ✅ |
| Token bucket rate limiter (120k/min default) | ✅ |
| Sequence tracking & gap detection | ✅ |
| Ingestion buffer + batch flush (500ms / 1000 events) | ✅ |
| 1-minute rollups | ✅ |
| Z-score anomaly detection (|z| > 3 for 3 consecutive) | ✅ |
| Error rate alerting (> 10%) | ✅ |
| Heartbeat / service-down (30s timeout) | ✅ |
| Delta broadcast (100ms) | ✅ |
| Socket.IO /ingest + /dashboard | ✅ |
| Graceful shutdown | ✅ |
| Seed script | ✅ |
| Tests (node:test) — 28/28 passing | ✅ |
| Interoperability with Agent 2 scripts & client | ✅ |
