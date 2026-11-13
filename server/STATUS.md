# Server Status

## Completed

All 34 files created under `server/`:

- **Config**: `config/env.js`, `config/db.js`
- **Models**: `User.js`, `Project.js`, `TelemetryEvent.js`, `Rollup.js`, `Alert.js`, `ServiceState.js`
- **Middleware**: `auth.js` (JWT), `apiKey.js`, `validate.js` (Zod)
- **Validation**: `schemas.js` — register, login, project, envelope (with superRefine per type), ingest
- **Routes**: `auth.js`, `projects.js`, `telemetry.js`, `services.js`, `alerts.js`, `ingest.js`, `stats.js`
- **Services**: `stats.js`, `ingestion.js`, `rollup.js`, `anomaly.js`, `broadcast.js`
- **Sockets**: `ingest.js` (apiKey auth), `dashboard.js` (JWT auth)
- **Entry**: `server.js` — wires everything, CORS for localhost:5173, graceful shutdown
- **Seed**: `seed-user.js` — demo@mernify.dev / demo1234 / apiKey: dev-key
- **Tests**: `__tests__/validation.test.js`, `__tests__/dedup.test.js`
- **Docs**: `README.md`, `STATUS.md`
- **Package**: `package.json`, `.env.example`

## How to Run

```bash
cd server
npm install
cp .env.example .env
npm run seed   # Seeds demo user + project
npm run dev    # Starts with nodemon
```

## Contract Compliance

| Requirement | Status |
|---|---|
| CommonJS modules | ✅ |
| Express + Mongoose + Socket.IO | ✅ |
| Zod validation with superRefine | ✅ |
| JWT auth middleware | ✅ |
| API key auth middleware | ✅ |
| Time-series TelemetryEvent | ✅ |
| Token bucket rate limiter | ✅ |
| Sequence tracking | ✅ |
| Ingestion buffer + flush | ✅ |
| 1-minute rollups | ✅ |
| Z-score anomaly detection | ✅ |
| Error rate alerting | ✅ |
| Heartbeat / service-down | ✅ |
| Delta broadcast (100ms) | ✅ |
| Socket.IO /ingest + /dashboard | ✅ |
| Graceful shutdown | ✅ |
| Seed script | ✅ |
| Tests (node:test) | ✅ |
