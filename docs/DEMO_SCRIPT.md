# MERNIFY 3-5 Minute Interactive Demo Walkthrough

This guide provides an end-to-end walkthrough script designed for live hackathon presentations, stakeholder demos, or technical deep-dives into MERNIFY.

---

## ⏱️ Demo Overview Timeline

| Phase | Step | Target Time | Focus Area |
| :--- | :--- | :--- | :--- |
| **01** | Setup & Authentication | 30s | Server spin-up, historical seed, login flow |
| **02** | Live Multi-Source Load | 60s | Real-time chart rendering, RPS, latency percentiles |
| **03** | Synthetic Latency Spike & Alerting | 45s | Anomaly detection, z-score breach, critical alert |
| **04** | Heartbeat Silence & Service Down | 45s | Instance health monitoring & automated failure alert |
| **05** | Multi-Tab Independent Subscriptions | 30s | Room-based isolation across browser tabs |
| **06** | Historical Query & Incident Replay | 45s | Time range switch (1h), cursor merge, timeline scrubber |
| **07** | Wrap-Up & Debug Metrics | 15s | Frame render rate, throughput stats, dark mode toggle |

---

## 🎬 Step-by-Step Script

### Step 1: System Spin-Up & Authentication (30 seconds)

1. **Terminal Commands**:
   Ensure mock server and seeded data are initialized:
   ```bash
   # Terminal 1: Start Mock Server
   cd scripts && npm run mock

   # Terminal 2: Backfill Historical Incident Data
   cd scripts && npm run seed

   # Terminal 3: Start Client UI
   cd client && npm run dev
   ```
2. **Action**: Open `http://localhost:5173` in your browser.
3. **Narration**:
   > *"Welcome to MERNIFY — a lightweight, open-source alternative to Datadog built with the MERN stack and Socket.IO. We'll begin by logging into the Demo workspace using our preconfigured credentials `demo@mernify.dev` and `demo1234`."*
4. **Action**: Enter credentials and click **Sign In**. Point out the active project selector displaying `Demo Project (proj_demo)`.

---

### Step 2: Live Multi-Source Load Streaming (60 seconds)

1. **Action**: In Terminal 4, launch the load simulator with 10 concurrent sources:
   ```bash
   cd scripts && npm run simulate -- --sources 10 --project proj_demo
   ```
2. **Visual Highlights**:
   - Point to the live telemetry charts updating at 60 FPS without page refresh.
   - Point out the **CPU Utilization** and **V8 Heap Memory** sparklines moving in sync with the simulator's diurnal drift.
   - Highlight the **HTTP Analytics** cards showing real-time Request Throughput (RPS) and latency percentiles (**P50**, **P95**, and **P99**).
   - Scroll down to the **Per-Route Breakdown** table displaying active requests, error percentages, and latency percentiles per endpoint (e.g., `GET /cart`, `POST /pay`).
3. **Narration**:
   > *"Under the hood, our client isn't re-rendering on every incoming socket packet. Instead, 100ms server delta batches are queued in a React ref buffer and drained smoothly using `requestAnimationFrame`, rendering hundreds of data points at 60 FPS with zero UI stutter."*

---

### Step 3: Latency Spike & Anomaly Detection (45 seconds)

1. **Action**: Ramp up simulated load to 50 sources to inject latency spikes:
   ```bash
   cd scripts && npm run simulate -- --sources 50 --project proj_demo
   ```
2. **Visual Highlights**:
   - Observe the **Latency P95/P99** graphs spike upward.
   - Watch the **Alerts Panel** on the right side of the dashboard.
   - Notice a yellow **Warning** banner appear: *"Z-Score Anomaly Detected: CPU / Latency drift exceeds +2.5σ"*.
   - Within seconds, as load intensifies, observe the transition to a red **Critical** alert banner.
3. **Narration**:
   > *"MERNIFY runs continuous sliding-window statistical analysis on incoming streams. When a metric breaches standard deviations or predefined safety thresholds, an instant alert is pushed over the `/dashboard` Socket.IO namespace to all listening operators."*

---

### Step 4: Heartbeat Silence & Service Down Detection (45 seconds)

1. **Action**: Stop or terminate one of the service simulators (press `Ctrl+C` in Terminal 4 or stop a specific worker).
2. **Visual Highlights**:
   - Direct attention to the **Services Fleet** widget.
   - Notice the status pill for the stopped instance change from a glowing green **UP** to a red **DOWN** status precisely 15 seconds after heartbeat cessation.
   - Point out the corresponding automated alert appearing in the alert feed: *"service_down: Heartbeat timeout exceeded for service instance"*.
3. **Narration**:
   > *"Every instrumented agent emits periodic heartbeat pings. If a service container crashes or gets hung in an infinite event loop for more than 15 seconds, the server marks the node down and dispatches a critical alert."*

---

### Step 5: Multi-Tab Independent Subscriptions (30 seconds)

1. **Action**: Open a second browser tab navigating to `http://localhost:5173`.
2. **Action**: On Tab 1, select and filter exclusively for `cart-service`. On Tab 2, select and filter for `payments-service`.
3. **Visual Highlights**:
   - Demonstrate that Tab 1 only receives and visualizes `cart-service` metrics, while Tab 2 displays `payments-service` telemetry.
4. **Narration**:
   > *"Unlike basic WebSocket broadcasts that overwhelm client browsers, MERNIFY uses room-based isolation (`project:{projectId}:service:{serviceName}`). Tabs only receive data for the specific services the user is viewing, minimizing wire overhead and CPU footprint."*

---

### Step 6: Historical Data & Incident Replay Slider (45 seconds)

1. **Action**: On the top-right time range picker, switch from **Live** to **1h**.
2. **Visual Highlights**:
   - Show the 6-hour historical dataset backfilled by `seed.js` instantly rendering historical charts.
   - Point out that live incoming streaming points continue to stitch seamlessly onto the right-most edge of the chart without duplicating points (managed via ULID `eventId` and `asOf` cursoring).
   - Grab the **Incident Replay Slider** and scrub backward into the historical incident window (-2h to -1h45m).
   - Watch the charts, route tables, and error logs replay the exact system state during the historical outage.
   - Click **Live** to snap back to real-time mode.
3. **Narration**:
   > *"Observability requires both live triage and post-mortem analysis. Our hybrid query engine fetches historical time-buckets via REST while deduplicating live socket batches. The incident slider allows engineering teams to scrub through an outage second-by-second to identify root causes."*

---

### Step 7: Technical Wrap-Up & Diagnostics (15 seconds)

1. **Action**: Scroll to the **Debug Status Footer**.
2. **Visual Highlights**:
   - Point out the live telemetry metrics: **Total Events Received**, **Events/Sec Throughput**, and current **Render FPS (60.0)**.
   - Click the **Theme Toggle** in the navigation header to show instant dark/light mode switching.
3. **Narration**:
   > *"With real-time dual-namespace Socket.IO communication, RAF buffer smoothing, statistical anomaly alerts, and full incident replay, MERNIFY delivers enterprise observability at hackathon simplicity. Thank you!"*
