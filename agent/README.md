# mernify-agent

Lightweight telemetry agent for Node.js applications. Collects system metrics,
HTTP traffic stats, errors, and custom events, then sends them to a
[Mernify](../README.md) server via Socket.IO.

## Installation

```bash
cd agent
npm install
```

## Quick Start

```js
const express = require('express');
const mernify = require('mernify-agent'); // or require('../../agent')

const app = express();

// 1. Initialise the agent
mernify.init({
  apiKey: 'dev-key',                         // required — your project API key
  serverUrl: 'http://localhost:5000',         // optional, defaults to localhost:5000
  serviceName: 'my-app',                     // required — logical service name
  // instanceId: 'custom-id',                // optional — auto-generated if omitted
});

// 2. Add the middleware (aggregates HTTP metrics into 1 s windows)
app.use(mernify.middleware());

// 3. Track custom events
mernify.track('cart.items', 5);

// 4. Emit log entries
mernify.log('info', 'Server started');
mernify.log('warn', 'Disk usage high');
mernify.log('error', 'Payment gateway timeout');

app.get('/', (req, res) => res.json({ ok: true }));

app.listen(3000, () => console.log('listening on 3000'));
```

## What It Collects

| Type        | Interval | Description |
|-------------|----------|-------------|
| **metrics** | 2 s      | CPU %, RSS memory, heap used, event-loop lag, uptime |
| **http**    | 1 s      | Request count, 4xx/5xx errors, latency P50/P95/P99, per-route breakdown |
| **error**   | realtime | Uncaught exceptions & unhandled rejections (deduplicated by stack hash) |
| **heartbeat** | 5 s   | Signals the service instance is alive |
| **custom**  | on-demand | Any key/value pair via `track(name, value)` |
| **log**     | on-demand | Structured log lines via `log(level, message)` |

## How It Works

1. **Buffer** — Events are buffered in memory (max 10 000). Oldest events are
   dropped when the buffer is full.
2. **Flush** — Every 1 second the buffer is flushed and sent to the server as a
   batch over Socket.IO (`/ingest` namespace).
3. **Retry** — Failed sends are retried up to 3 times with exponential
   back-off (1 s → 2 s → 4 s). On final failure a warning is logged and the
   events are discarded — **the agent never throws or crashes the host app**.
4. **Timers** — All internal timers are `unref()`-ed so they don't prevent the
   Node.js process from exiting naturally.

## API

### `init(options)`

| Option        | Type   | Required | Default                   |
|---------------|--------|----------|---------------------------|
| `apiKey`      | string | ✅       |                           |
| `serverUrl`   | string |          | `http://localhost:5000`   |
| `serviceName` | string | ✅       |                           |
| `instanceId`  | string |          | auto-generated (ULID)     |

Returns the agent instance (for chaining).

### `middleware()`

Returns an Express-compatible middleware function. Must be called **after**
`init()`.

### `track(name, value)`

Enqueues a custom telemetry event.

### `log(level, message)`

Enqueues a log event. `level` must be `"info"`, `"warn"`, or `"error"`.

## Envelope Format

Every telemetry event is wrapped in a standard envelope:

```json
{
  "eventId": "01HXYZ...",
  "projectId": "<apiKey>",
  "serviceName": "my-app",
  "instanceId": "01HXYZ...",
  "seq": 42,
  "ts": 1700000000000,
  "type": "metrics",
  "payload": { "..." }
}
```

## License

MIT
