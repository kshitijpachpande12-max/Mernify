# MERNIFY Server

Real-time telemetry monitoring platform backend (Mini Datadog).

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and configure
cp .env.example .env
# Set MONGO_URI in .env:
# - MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster-url>.mongodb.net/mernify?retryWrites=true&w=majority
# - Or local MongoDB: mongodb://localhost:27017/mernify

# 3. Seed demo user & project
npm run seed

# 4. Start development server
npm run dev
```

## Default Credentials (after seeding)

| Field    | Value              |
| -------- | ------------------ |
| Email    | demo@mernify.dev   |
| Password | demo1234           |
| API Key  | dev-key            |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Log in, receive JWT

### Projects (requires JWT)
- `GET /api/projects` — List your projects
- `POST /api/projects` — Create a project

### Telemetry (requires JWT)
- `GET /api/telemetry?projectId=...` — Query events (supports `service`, `type`, `from`, `to`, `limit`, `bucket`)

### Services (requires JWT)
- `GET /api/services?projectId=...` — List service instances & status

### Alerts (requires JWT)
- `GET /api/alerts?projectId=...` — List alerts

### Ingest (requires x-api-key)
- `POST /api/ingest` — Ingest telemetry events batch

### Stats
- `GET /api/stats` — Ingestion pipeline stats

## Socket.IO Namespaces

### `/ingest` (auth: apiKey)
- Event: `ingest` — Send telemetry batch, receive ack

### `/dashboard` (auth: JWT)
- Event: `subscribe` / `unsubscribe` — Join/leave project rooms
- Receives: `metrics:batch`, `alert:new`, `service:status`

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.IO
- **Validation**: Zod
- **Auth**: JWT + bcryptjs
