/**
 * scripts/bench.js
 * Ingest throughput & latency benchmark suite for MERNIFY.
 * Runs load tests at 100, 500, and 1000 sources for 30s each and writes results to docs/benchmarks.md.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { io } = require('socket.io-client');
const { ulid } = require('ulid');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const API_KEY = process.env.API_KEY || 'dev-key';
const PROJECT_ID = process.env.PROJECT_ID || 'proj_demo';
const DURATION_SEC = process.env.BENCH_DURATION ? parseInt(process.env.BENCH_DURATION, 10) : 30;

const TIERS = [100, 500, 1000];

function checkServerAvailable(url) {
  return new Promise((resolve) => {
    const req = http.get(`${url.replace(/\/$/, '')}/api/services?projectId=proj_demo`, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function computePercentile(arr, p) {
  if (arr.length === 0) return 0;
  arr.sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (arr.length - 1));
  return arr[idx];
}

async function runTier(sourcesCount, durationSec) {
  console.log(`\n======================================================`);
  console.log(`[bench] Running tier: ${sourcesCount} sources for ${durationSec}s`);
  console.log(`======================================================`);

  const socketUrl = `${SERVER_URL.replace(/\/$/, '')}/ingest`;
  const socket = io(socketUrl, {
    auth: { apiKey: API_KEY },
    transports: ['websocket'],
    reconnection: false
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Connection timeout to ' + socketUrl)), 5000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  const latencies = [];
  let totalEventsSent = 0;
  let totalEventsAccepted = 0;
  let totalEventsDropped = 0;

  // Initialize sources
  const sources = [];
  for (let i = 0; i < sourcesCount; i++) {
    const svcIndex = (i % 5) + 1;
    sources.push({
      serviceName: `service-${svcIndex}`,
      instanceId: `inst-${svcIndex}-${i + 1}`,
      seq: 1
    });
  }

  const startTime = Date.now();
  const endTime = startTime + (durationSec * 1000);

  let intervalTimer;

  await new Promise((resolve) => {
    intervalTimer = setInterval(() => {
      const now = Date.now();
      if (now >= endTime) {
        clearInterval(intervalTimer);
        return resolve();
      }

      // Generate batch for all sources
      const batch = [];
      for (const src of sources) {
        // Metrics envelope
        batch.push({
          eventId: ulid(),
          projectId: PROJECT_ID,
          serviceName: src.serviceName,
          instanceId: src.instanceId,
          seq: src.seq++,
          ts: now,
          type: 'metrics',
          payload: {
            cpuPercent: 25 + Math.random() * 40,
            memRssMB: 200 + Math.random() * 100,
            heapUsedMB: 120 + Math.random() * 50,
            eventLoopLagMs: 2 + Math.random() * 5,
            uptimeSec: Math.floor((now - startTime) / 1000)
          }
        });

        // HTTP envelope
        batch.push({
          eventId: ulid(),
          projectId: PROJECT_ID,
          serviceName: src.serviceName,
          instanceId: src.instanceId,
          seq: src.seq++,
          ts: now,
          type: 'http',
          payload: {
            windowMs: 1000,
            requests: 50 + Math.floor(Math.random() * 50),
            errors4xx: 0,
            errors5xx: 0,
            latencyP50: 25,
            latencyP95: 65,
            latencyP99: 120,
            byRoute: {
              'GET /test': { count: 50, errors: 0, p95: 50 }
            }
          }
        });
      }

      const count = batch.length;
      totalEventsSent += count;
      const t0 = Date.now();

      socket.emit('ingest', batch, (ack) => {
        const roundtrip = Date.now() - t0;
        latencies.push(roundtrip);
        if (ack) {
          totalEventsAccepted += (ack.accepted || 0);
          totalEventsDropped += (ack.rejected || 0);
        } else {
          totalEventsDropped += count;
        }
      });

      const elapsed = Math.round((now - startTime) / 1000);
      process.stdout.write(`\r[bench] ${sourcesCount} sources: ${elapsed}s / ${durationSec}s | Sent: ${totalEventsSent} | Accepted: ${totalEventsAccepted} `);
    }, 1000);
  });

  // Grace period for in-flight acks
  await new Promise(r => setTimeout(r, 1000));
  socket.disconnect();

  const actualDurationSec = (Date.now() - startTime) / 1000;
  const eventsPerSec = Math.round(totalEventsAccepted / actualDurationSec);
  const p95Latency = computePercentile(latencies, 95);

  console.log(`\n[bench] Tier ${sourcesCount} finished.`);
  console.log(`[bench] Events/sec: ${eventsPerSec.toLocaleString()}`);
  console.log(`[bench] Drops:      ${totalEventsDropped}`);
  console.log(`[bench] P95 Latency: ${p95Latency}ms`);

  return {
    sources: sourcesCount,
    eventsPerSec,
    drops: totalEventsDropped,
    p95Latency: `${p95Latency}ms`
  };
}

async function main() {
  console.log('======================================================');
  console.log('           MERNIFY BENCHMARK SUITE                    ');
  console.log('======================================================');
  console.log(`Server URL:  ${SERVER_URL}`);
  console.log(`Duration:    ${DURATION_SEC}s per tier`);
  console.log(`Tiers:       ${TIERS.join(', ')} sources`);
  console.log('------------------------------------------------------');

  const serverOnline = await checkServerAvailable(SERVER_URL);
  if (!serverOnline) {
    console.error(`\n[bench] ERROR: Server is not reachable at ${SERVER_URL}.`);
    console.error(`[bench] Please start the server in another terminal:`);
    console.error(`        node scripts/mock-server.js\n`);
    process.exit(1);
  }

  const results = [];
  for (const tier of TIERS) {
    const res = await runTier(tier, DURATION_SEC);
    results.push(res);
  }

  console.log('\n======================================================');
  console.log('                 FINAL RESULTS                        ');
  console.log('======================================================');
  console.table(results);

  // Format Markdown Table
  const markdown = [
    '# MERNIFY Benchmark Results',
    '',
    `*Generated on: ${new Date().toISOString()}*`,
    `*Duration: ${DURATION_SEC}s per tier | Server: ${SERVER_URL}*`,
    '',
    '| Sources | Events/sec | Drops | P95 Latency |',
    '|---------|-----------|-------|-------------|'
  ];

  results.forEach(r => {
    markdown.push(`| ${r.sources.toString().padEnd(7)} | ${r.eventsPerSec.toLocaleString().padEnd(9)} | ${r.drops.toString().padEnd(5)} | ${r.p95Latency.padEnd(11)} |`);
  });

  markdown.push('');
  markdown.push('### Methodology');
  markdown.push('- Each source sends metrics & http envelopes at 1s intervals via Socket.IO `/ingest` namespace with ack confirmations.');
  markdown.push('- Latency is computed roundtrip from emit to server acknowledgement.');
  markdown.push('- Drops include rejected payloads, schema failures, or dropped acknowledgements.');

  const docsDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const outputPath = path.join(docsDir, 'benchmarks.md');
  fs.writeFileSync(outputPath, markdown.join('\n'), 'utf8');

  console.log(`\n[bench] Wrote benchmark results to ${outputPath}`);
}

main().catch(err => {
  console.error('[bench] Fatal benchmark error:', err);
  process.exit(1);
});
