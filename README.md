# 🛡️ SENTINEL

> **Sentinel (formerly Mernitor / Mernify / Mini Datadog)** — A high-throughput, lightweight real-time telemetry and incident intelligence platform built with the MERN stack, Socket.IO, and Vercel serverless cloud streaming.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend Deployment](https://img.shields.io/badge/Vercel-Frontend%20Live-6366f1?logo=vercel&logoColor=white)](https://sentinel-i6lk.vercel.app)
[![Backend Deployment](https://img.shields.io/badge/Vercel-Backend%20Live-10b981?logo=vercel&logoColor=white)](https://sentinel-rosy-three.vercel.app/health)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Socket.IO-brightgreen)](https://socket.io/)

---

## 🌐 Live Deployments

| Component | Live URL | Status | Description |
| :--- | :--- | :---: | :--- |
| **Frontend Web App** | [https://sentinel-i6lk.vercel.app](https://sentinel-i6lk.vercel.app) | ![Live](https://img.shields.io/badge/Status-Online-emerald?style=flat-square) | React 18 + Vite observability dashboard with Magic UI & Skipper UI |
| **Backend Server** | [https://sentinel-rosy-three.vercel.app](https://sentinel-rosy-three.vercel.app) | ![Live](https://img.shields.io/badge/Status-Online-emerald?style=flat-square) | Ingestion pipeline, telemetry queries, and incident intelligence API |
| **Health Check** | [https://sentinel-rosy-three.vercel.app/health](https://sentinel-rosy-three.vercel.app/health) | `{"status":"ok"}` | Uptime verification and cold-start check |

---

### ⚡ Quick Live Cloud Demo

To stream real-time synthetic microservice telemetry directly into the live deployment:

```bash
# 1. Clone & install dependencies
git clone https://github.com/kshitijpachpande12-max/Mernify.git
cd Mernify/scripts && npm install

# 2. Launch the real-time telemetry simulator
node simulator.js --server https://sentinel-rosy-three.vercel.app --project YOUR_PROJECT_ID --apiKey YOUR_API_KEY --sources 10 --interval 1000
```
Then open **[https://sentinel-i6lk.vercel.app](https://sentinel-i6lk.vercel.app)** in your browser to view your live telemetry streams!

---

## 🔌 Attaching the Sentinel Agent to Your Own Service

Anyone can instrument their existing Node.js / Express backend with Sentinel in under 2 minutes.

### 1. Get Your Credentials
1. Open the [Sentinel Web App](https://sentinel-i6lk.vercel.app) and sign in.
2. Select or create your project on the **Projects** page.
3. Copy your **API Key** from the project card, and copy your **Project ID** from the dashboard URL (`https://sentinel-i6lk.vercel.app/dashboard/<PROJECT_ID>`).

### 2. Install the Agent

You can install the Sentinel telemetry agent into any existing Node.js project using any of these methods:

#### Option A: Direct from Git (Instant 1-step install, no npm publishing needed!)
```bash
npm install github:kshitijpachpande12-max/Sentinel
```
*(or using the Mernify repository name)*:
```bash
npm install github:kshitijpachpande12-max/Mernify
```

#### Option B: Local Folder Copy
Simply copy the lightweight `agent/` folder from this repo into your project.

### 3. Initialize in Your Express Application
Add Sentinel to your existing service's entry point (e.g. `index.js`, `server.js`, or `app.js`). Your existing routes, database, and ports stay completely untouched:

```javascript
// --- Your Existing Express Server ---
const express = require('express');
const app = express();

// 1. Import Sentinel (use 'sentinel-telemetry-agent' if installed via npm/git, or './agent' if local)
const sentinel = require('sentinel-telemetry-agent'); 
// const sentinel = require('./agent'); // if copied locally 

// 2. Initialize with your Sentinel project credentials
sentinel.init({
  serviceName: 'my-existing-api',                   // Whatever name you want shown on the dashboard
  apiKey: 'YOUR_PROJECT_API_KEY',                  // Copied from Sentinel project card
  projectId: 'YOUR_PROJECT_ID',                    // Copied from /dashboard/<PROJECT_ID> URL
  serverUrl: 'https://sentinel-rosy-three.vercel.app', // Or http://localhost:5000 if running locally
});

// 3. Mount the tracking middleware right after const app = express()
app.use(sentinel.middleware());

// --- Everything else in your existing app stays exactly the same! ---
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

app.listen(process.env.PORT || 8000, () => {
  console.log('Existing application running normally — telemetry streaming to Sentinel in background');
});
```

> **Non-Intrusive & Fail-Safe Guarantee:** Sentinel operates asynchronously in an in-memory ring-buffer. It does not block request lifecycles, requires no port changes, and if the Sentinel telemetry endpoint is ever unreachable, the agent drops events silently so your host application is never affected.

### 4. Non-Express Services (Workers, Cron Jobs, Scripts)
If your service doesn't use Express (e.g. a message queue consumer, cron job, or worker), call `sentinel.init(...)` at startup without the middleware. Sentinel will still continuously stream **CPU usage, RSS Memory, Event Loop Lag, Heartbeats (UP status), and Uncaught Crash Traces** automatically!

### 5. Services in Other Languages (Python, Go, Java, Rust)
Services written in other languages can stream telemetry directly using any standard HTTP client:
- **POST** `https://sentinel-rosy-three.vercel.app/api/ingest`
- **Header:** `x-api-key: YOUR_PROJECT_API_KEY`
- **Body:** `{ "events": [ { "eventId": "01J...", "projectId": "...", "serviceName": "go-api", "type": "heartbeat", "seq": 1, "ts": 1731600000000, "payload": {} } ] }`

### 4. What Happens Automatically
Once initialized, the Sentinel Agent operates completely in the background:
- **System Metrics (every 2s):** Automatically captures host CPU utilization %, RSS memory, V8 heap usage, and event loop latency without impacting your app.
- **HTTP Analytics (every request):** Calculates throughput (RPS), error rates, and **P50 / P95 / P99** latency percentiles broken down per route.
- **Instance Heartbeats (every 5s):** Emits heartbeat pings to mark your service green **`UP`** in the Sentinel fleet monitor.
- **Error Capture:** Intercepts unhandled promise rejections and uncaught exceptions, grouping them by stack trace hash in the Sentinel error timeline.
- **Zero Overhead:** Queues telemetry events in an in-memory ring-buffer and flushes in batches without blocking the Node.js event loop. If Sentinel is unreachable, it silently drops packets to ensure your host application never crashes.

---

## 💡 The Problem & The Solution

Enterprise observability platforms (Datadog, New Relic, Dynatrace) are notoriously complex, resource-heavy, and cost-prohibitive for startups, hackathons, and agile teams. Monitoring microservices or node processes shouldn't require complex agent daemon orchestrations or astronomical SaaS bills.

**SENTINEL** is an ultra-lightweight, open-source telemetry monitoring platform. Designed from scratch on the MERN stack with dual-channel Socket.IO architecture, Sentinel ingests runtime metrics, HTTP access analytics, application error traces, and instance heartbeats at sub-millisecond speeds, streaming live updates directly into an interactive, zero-latency dashboard.

---

## 🚀 Key Features

- **⚡ Real-Time Runtime Metrics**: Ingests and renders CPU load (`cpuPercent`), RSS memory, V8 heap usage, event loop lag, and process uptime at 60 FPS.
- **🌐 HTTP Traffic Analytics**: Real-time request throughput (RPS), HTTP 4xx & 5xx error rates, latency percentiles (**P50**, **P95**, **P99**), and per-route drilldowns.
- **🚨 Intelligent Anomaly Detection**: Real-time statistical z-score evaluation alerting on unexpected CPU/memory drifts and automated threshold alerts on error spikes.
- **🔍 Error Tracking & Stack Grouping**: Real-time exception capture grouped automatically by stack trace hash (`stackHash`) with occurrence counters and detailed route contextualization.
- **💓 Service Health & Fleet Monitoring**: Automatic heartbeat tracking across distributed services and instances with instant status toggling (`up` / `down`) on silence timeouts (>15s).
- **📂 Multi-Project Support & Secure Auth**: Project-isolated namespaces guarded by API keys (`x-api-key`) for ingestion and JWT authentication for UI access.
- **🔄 Isolated Service Subscriptions**: Independent per-tab/per-widget Socket.IO room subscriptions enabling targeted live feeds without redundant wire traffic.
- **⏪ Historical Data with Seamless Live Merge**: Time-range selector (15m, 1h, 6h, 24h) backfilling historical aggregates, automatically merging real-time events without duplication via `eventId` dedup and `asOf` cursors.
- **⏯️ Incident Replay Slider**: Scrub back in time through recorded production incidents to inspect correlated metrics and root-cause regressions step-by-step.
- **🌓 Responsive Dark Mode UI**: Built with **Magic UI**, **Skipper UI**, Tailwind CSS, and Recharts, designed for observability war-rooms with smooth kinetic transitions, spotlight cards, animated border beams, particle crowds, and customizable data densities.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Blazing fast client bundle with hot-module replacement |
| **Component Libraries** | Magic UI + Skipper UI | High-end micro-interactions, kinetic typography, dynamic liquid simulation, spotlight cards |
| **Animation Engine** | Framer Motion | Smooth physics-based spring animations, layout transitions, and spotlight tracking |
| **UI Styling** | Tailwind CSS + CLSX + Tailwind-Merge | Utility-first, responsive dark luxury theme styling with dynamic class composition |
| **Visualization** | Recharts | Composable declarative charting for latency percentiles and system metrics |
| **Real-Time Transport** | Socket.IO | Bi-directional, namespace-isolated WebSocket communication with fallback |
| **Backend API** | Node.js + Express | High-performance ingest pipeline and REST control plane |
| **Persistence** | MongoDB + Mongoose | Document storage for telemetry timeseries, projects, users, and alert models |
| **Security & IDs** | JWT & ULID | Stateless token-based dashboard auth and monotonic lexicographical event IDs |

---

## 🏗️ Architecture Overview

```
 [ Instrument / Agent ] ──( HTTP POST / WebSocket )──▶ [ /ingest Namespace ]
                                                                │
                                                                ▼
                                                    [ Ingest Validation & Dedup ]
                                                                │
                                        ┌───────────────────────┴──────────────────────┐
                                        ▼                                              ▼
                             [ MongoDB Persistence ]                     [ Anomaly Detection & Room Dispatch ]
                                                                                       │
                                                                                       ▼
 [ React Dashboard UI ] ◀──────( Batched WebSocket 100ms )──────── [ /dashboard Namespace ]
```

1. **Ingest Pipeline**: Instrumented client applications stream telemetry envelopes over WebSocket or HTTP using their unique API key to the `/ingest` namespace.
2. **Dedup & Validation**: Incoming envelopes are validated and deduplicated using unique monotonic `ULID` event IDs.
3. **Delta Batching & Broadcast**: Telemetry events are batched every 100ms and fanned out strictly to authorized room subscribers (`project:{projectId}:service:{serviceName}`) on the `/dashboard` namespace.
4. **Smooth Frontend Rendering**: The React client buffers socket batches in mutable refs and renders via `requestAnimationFrame` (RAF) to maintain 60 FPS under heavy data loads without React state bottlenecks.

---

## 📊 Data Generation & Chaos Resilience

Sentinel includes a comprehensive synthetic telemetry harness out-of-the-box:

- **`simulator.js`**: Generates real-time synthetic traffic across $N$ independent service instances. Features realistic sine-wave diurnal drift, baseline jitter, and configurable anomaly/spike injection (~1% chance).
- **`seed.js`**: Backfills up to 6 hours of historical telemetry chunks via the ingestion API across multiple services, including a realistic pre-configured incident window (-2h to -1h45m) with 90%+ CPU spikes and 5x error cascades.
- **`--chaos` Resilience Testing**: Injects hostile real-world network edge cases:
  - 5% duplicate `eventId` packets to test deduplication idempotency.
  - 3% out-of-order sequence (`seq`) timestamps to verify monotonic client reconciliation.
  - 1% malformed payloads to validate ingest boundary sanitation.

---

## ⚡ Real-Time Streaming Mechanics

| Mechanism | Description |
| :--- | :--- |
| **Dual Namespaces** | `/ingest` strictly handles high-throughput ingest agents authorized via API keys; `/dashboard` serves authenticated browser sessions via JWTs. |
| **Room-Based Subscriptions** | Granular filtering at `project:{projectId}:service:{serviceName}` ensures clients only receive data for active tabs/views. |
| **100ms Server Delta Batching** | Server flushes queued telemetry envelopes in micro-batches every 100ms (`metrics:batch`), eliminating packet storm overhead. |
| **Dedup & Cursoring** | Seamless history-to-live transitions combine historical REST queries with live socket streams using `eventId` set checks and `asOf` cursor markers. |

---

## 🏁 Getting Started & Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Running Locally (Quick Start)

Run each step in a dedicated terminal:

```bash
# Terminal 1 — Start Server (or Mock API + Socket.IO Server)
cd scripts && npm install && npm run mock

# Terminal 2 — Seed 6 Hours of Historical Incident Data
cd scripts && npm run seed

# Terminal 3 — Launch the React Dashboard
cd client && npm install && npm run dev

# Terminal 4 — Simulate Live Telemetry Stream
cd scripts && npm run simulate -- --sources 50 --project proj_demo
```

### Demo Credentials

| Role | Email / Key | Password | Note |
| :--- | :--- | :--- | :--- |
| **UI Login** | `demo@mernify.dev` | `demo1234` | Full access to demo projects |
| **Ingest Key** | `dev-key` | *N/A* | Used in `x-api-key` header or socket auth |

---

## 📈 Benchmark Performance

Benchmarks captured using `scripts/bench.js` over 30-second sustained stress runs:

| Sources | Events/sec | Drops | P95 Latency |
| :--- | :--- | :--- | :--- |
| **100** | 99 | 0 | 6ms |
| **500** | 497 | 0 | 14ms |
| **1000** | 987 | 0 | 25ms |

*(Run `npm run bench` inside `scripts/` to generate live platform benchmarks on your hardware).*

---

## 📁 Project Structure

```text
mernify/
├── agent/            # Node.js auto-instrumentation SDK / client library
├── client/           # React 18 + Vite dashboard frontend
│   ├── src/
│   │   ├── components/ 
│   │   │   ├── magicui/  # Magic UI components (BorderBeam, MagicCard, ShinyButton, etc.)
│   │   │   ├── skipper/  # Skipper UI components (CanvasCrowd, KineticTitle, LiquidSimulation)
│   │   │   └── charts/   # Composable telemetry and latency charts
│   │   ├── context/    # Socket.IO & telemetry state management
│   │   ├── hooks/      # Real-time subscriptions & RAF rendering buffers
│   │   └── lib/        # Utility helpers (cn, tailwind-merge, clsx)
│   └── package.json
├── docs/             # Technical architecture, benchmarks & demo scripts
├── scripts/          # Mock servers, telemetry simulators, seeders & benchmarks
├── server/           # Production Express + MongoDB telemetry server
└── README.md
```

---

## 🤝 Attributions & Core Libraries

- **[Magic UI](https://magicui.design/)**: Modern animated UI components (BorderBeam, MagicCard, ShinyButton, AnimatedGradientText, Particles, TextReveal).
- **[Skipper UI](https://skiper-ui.com/)**: Dynamic canvas visualizations and kinetic letter interactions (CanvasCrowd, KineticTitle, LiquidSimulation).
- **[Framer Motion](https://www.framer.com/motion/)**: Production-ready motion and animation library for React.
- **[Socket.IO](https://socket.io/)**: Low-latency bi-directional event transport.
- **[Recharts](https://recharts.org/)**: Composable SVG-based charting primitives.
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility styling system.
- **[Vite](https://vitejs.dev/)**: Next generation frontend tooling.
- **[ULID](https://github.com/ulid/javascript)**: Universally Unique Lexicographically Sortable Identifiers.
- **[MongoDB](https://www.mongodb.com/)**: Document-oriented data persistence.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
