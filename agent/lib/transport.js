'use strict';

const http = require('http');
const https = require('https');

let io;
try {
  io = require('socket.io-client').io;
} catch {
  try {
    io = require('../../scripts/node_modules/socket.io-client').io;
  } catch {
    io = null;
  }
}

/**
 * HTTP REST Ingestion Helper (Fallback for Vercel & serverless environments)
 */
function postHttp(serverUrl, apiKey, events) {
  return new Promise((resolve) => {
    try {
      const url = new URL(serverUrl.replace(/\/$/, '') + '/api/ingest');
      const payload = JSON.stringify({ events });
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'x-api-key': apiKey,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ accepted: events.length, duplicates: 0, rejected: 0 });
            }
          });
        }
      );

      req.on('error', (err) => {
        console.warn('[sentinel-agent] http ingest error:', err.message);
        resolve({ accepted: 0, duplicates: 0, rejected: events.length });
      });

      req.write(payload);
      req.end();
    } catch {
      resolve({ accepted: 0, duplicates: 0, rejected: events.length });
    }
  });
}

/**
 * Socket.IO + HTTP Fallback transport — connects to the Sentinel server
 * and emits batches of telemetry envelopes.
 */
function createTransport() {
  let socket = null;
  let targetUrl = '';
  let activeKey = '';
  let isCloud = false;

  return {
    /**
     * Open a connection to serverUrl with apiKey auth.
     */
    connect(serverUrl, apiKey) {
      targetUrl = serverUrl;
      activeKey = apiKey;
      isCloud = serverUrl.includes('vercel.app') || serverUrl.startsWith('https:');

      if (isCloud) {
        // Vercel serverless does not keep persistent WebSockets open — use direct HTTP REST
        return;
      }

      if (socket) return;
      try {
        if (!io) return;
        socket = io(serverUrl + '/ingest', {
          auth: { apiKey },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000,
          transports: ['websocket', 'polling'],
        });

        socket.on('connect_error', () => {
          // Socket failed, will automatically fallback to HTTP in send()
        });
      } catch (err) {
        console.warn('[sentinel-agent] socket init warning:', err.message);
      }
    },

    /**
     * Send an array of envelopes via Socket.IO or HTTP REST fallback.
     */
    send(events, retries) {
      if (retries === undefined) retries = 3;

      // Cloud or Vercel mode -> send directly via HTTP REST
      if (isCloud || !socket || !socket.connected) {
        return postHttp(targetUrl, activeKey, events);
      }

      return new Promise((resolve) => {
        let attempt = 0;

        function trySend() {
          const timeout = setTimeout(() => {
            attempt++;
            if (attempt >= retries) {
              // Fallback to HTTP on socket timeout
              postHttp(targetUrl, activeKey, events).then(resolve);
            } else {
              setTimeout(trySend, Math.pow(2, attempt - 1) * 1000);
            }
          }, 4000);

          try {
            socket.emit('ingest', events, (ack) => {
              clearTimeout(timeout);
              resolve(ack || { accepted: events.length, duplicates: 0, rejected: 0 });
            });
          } catch (err) {
            clearTimeout(timeout);
            postHttp(targetUrl, activeKey, events).then(resolve);
          }
        }

        trySend();
      });
    },

    /**
     * Cleanly disconnect.
     */
    disconnect() {
      if (socket) {
        try {
          socket.disconnect();
        } catch (_) {
          /* ignore */
        }
        socket = null;
      }
    },

    /**
     * Whether the underlying socket is currently connected.
     */
    isConnected() {
      return !!(socket && socket.connected);
    },
  };
}

module.exports = { createTransport };
