/**
 * scripts/seed.js
 * Backfill 6 hours of historical telemetry via HTTP POST /api/ingest in chunks of 500.
 * 3 services, 1-second intervals, with an incident window between -2h and -1h45m.
 */

const http = require('http');
const https = require('https');
const { ulid } = require('ulid');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const API_KEY = process.env.API_KEY || 'dev-key';
const PROJECT_ID = process.env.PROJECT_ID || 'proj_demo';
const CHUNK_SIZE = 500;

// 4 services
const services = [
  { name: 'cart-service', instanceId: 'cart-service-inst-1', baseCpu: 35, baseMem: 210, baseRequests: 50 },
  { name: 'payment-service', instanceId: 'payment-service-inst-1', baseCpu: 45, baseMem: 280, baseRequests: 80 },
  { name: 'product-service', instanceId: 'product-service-inst-1', baseCpu: 30, baseMem: 220, baseRequests: 60 },
  { name: 'auth-service', instanceId: 'auth-service-inst-1', baseCpu: 25, baseMem: 160, baseRequests: 40 }
];

async function postBatch(events) {
  const url = new URL(`${SERVER_URL.replace(/\/$/, '')}/api/ingest`);
  const payload = JSON.stringify({ events });

  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-api-key': API_KEY
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`Server returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('--- MERNIFY Telemetry Seeder ---');
  console.log(`Target Server: ${SERVER_URL}`);
  console.log(`Project ID:    ${PROJECT_ID}`);
  console.log(`API Key:       ${API_KEY}`);
  console.log(`Duration:      6 hours (1-second intervals)`);
  console.log(`Chunk Size:    ${CHUNK_SIZE}`);
  console.log('--------------------------------');

  const now = Date.now();
  const sixHoursMs = 6 * 3600 * 1000;
  const startTs = now - sixHoursMs;

  const incidentStartTs = now - (2 * 3600 * 1000); // -2h
  const incidentEndTs = now - (105 * 60 * 1000);   // -1h45m (15 min incident)

  console.log(`Time Range:     ${new Date(startTs).toISOString()} -> ${new Date(now).toISOString()}`);
  console.log(`Incident Range: ${new Date(incidentStartTs).toISOString()} -> ${new Date(incidentEndTs).toISOString()}`);

  const totalSeconds = 6 * 3600;
  const stepSec = 1; // 1 second intervals

  let currentBatch = [];
  let totalGenerated = 0;
  let totalBatches = 0;
  let acceptedCount = 0;
  let duplicateCount = 0;
  let rejectedCount = 0;

  const startTime = Date.now();

  for (let s = 0; s < totalSeconds; s += stepSec) {
    const currentTs = startTs + (s * 1000);
    const isIncident = currentTs >= incidentStartTs && currentTs <= incidentEndTs;

    for (const svc of services) {
      // Normal sine wave drift
      const sine = Math.sin((s / 60) * 0.1);

      let cpuPercent = svc.baseCpu + (sine * 10) + ((Math.random() - 0.5) * 4);
      let memRssMB = svc.baseMem + (sine * 15);
      let requests = svc.baseRequests + Math.floor(Math.random() * 20);
      let errors4xx = Math.random() < 0.1 ? 1 : 0;
      let errors5xx = 0;
      let latencyP50 = 20 + Math.random() * 10;
      let latencyP95 = 50 + Math.random() * 15;
      let latencyP99 = 90 + Math.random() * 25;

      // Incident window: CPU 90%+, 5x error rate, high latency
      if (isIncident) {
        cpuPercent = 91 + Math.random() * 7; // 91% - 98%
        memRssMB += 150;
        requests = Math.floor(requests * 1.5);
        errors4xx = Math.floor(5 + Math.random() * 10);
        errors5xx = Math.floor(10 + Math.random() * 15); // 5x+ errors
        latencyP50 = 120 + Math.random() * 50;
        latencyP95 = 450 + Math.random() * 200;
        latencyP99 = 950 + Math.random() * 300;
      }

      cpuPercent = Math.min(99.9, Math.max(1, Math.round(cpuPercent * 10) / 10));

      // Metrics envelope
      currentBatch.push({
        eventId: ulid(),
        projectId: PROJECT_ID,
        serviceName: svc.name,
        instanceId: svc.instanceId,
        seq: s + 1,
        ts: currentTs,
        type: 'metrics',
        payload: {
          cpuPercent,
          memRssMB: Math.round(memRssMB * 10) / 10,
          heapUsedMB: Math.round(memRssMB * 0.58 * 10) / 10,
          eventLoopLagMs: isIncident ? (50 + Math.random() * 30) : (3 + Math.random() * 2),
          uptimeSec: s
        }
      });

      // HTTP envelope
      currentBatch.push({
        eventId: ulid(),
        projectId: PROJECT_ID,
        serviceName: svc.name,
        instanceId: svc.instanceId,
        seq: s + 1,
        ts: currentTs,
        type: 'http',
        payload: {
          windowMs: 1000,
          requests,
          errors4xx,
          errors5xx,
          latencyP50: Math.round(latencyP50),
          latencyP95: Math.round(latencyP95),
          latencyP99: Math.round(latencyP99),
          byRoute: {
            'GET /health': { count: Math.floor(requests * 0.3), errors: 0, p95: 5 },
            'POST /process': { count: Math.floor(requests * 0.7), errors: errors4xx + errors5xx, p95: Math.round(latencyP95) }
          }
        }
      });

      // If incident, emit error envelopes
      if (isIncident && Math.random() < 0.3) {
        currentBatch.push({
          eventId: ulid(),
          projectId: PROJECT_ID,
          serviceName: svc.name,
          instanceId: svc.instanceId,
          seq: s + 1,
          ts: currentTs,
          type: 'error',
          payload: {
            message: 'High load timeout during incident window',
            stackHash: 'err_incident_timeout',
            route: 'POST /process',
            count: 1,
            stack: 'Error: High load timeout\n    at Timeout.callback (/app/server.js:102:14)'
          }
        });
      }

      totalGenerated += 2;

      // Ingest chunk when batch size reached
      if (currentBatch.length >= CHUNK_SIZE) {
        totalBatches++;
        const pct = ((s / totalSeconds) * 100).toFixed(1);
        try {
          const res = await postBatch(currentBatch);
          acceptedCount += (res.accepted || 0);
          duplicateCount += (res.duplicates || 0);
          rejectedCount += (res.rejected || 0);
          process.stdout.write(`\r[seed] Progress: ${pct}% | Batch ${totalBatches} | Events ingested: ${acceptedCount} `);
        } catch (err) {
          console.error(`\n[seed] Failed to send batch ${totalBatches}: ${err.message}`);
        }
        currentBatch = [];
      }
    }
  }

  // Flush remaining events
  if (currentBatch.length > 0) {
    totalBatches++;
    try {
      const res = await postBatch(currentBatch);
      acceptedCount += (res.accepted || 0);
      duplicateCount += (res.duplicates || 0);
      rejectedCount += (res.rejected || 0);
    } catch (err) {
      console.error(`\n[seed] Failed to send final batch: ${err.message}`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n[seed] Completed backfill in ${durationSec}s!`);
  console.log(`[seed] Total Batches: ${totalBatches}`);
  console.log(`[seed] Accepted:      ${acceptedCount}`);
  console.log(`[seed] Duplicates:    ${duplicateCount}`);
  console.log(`[seed] Rejected:      ${rejectedCount}`);
}

main().catch(err => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
