'use strict';

const { io } = require('socket.io-client');

/**
 * Socket.IO transport — connects to the Mernify server's /ingest namespace
 * and emits batches of telemetry envelopes.
 */
function createTransport() {
  let socket = null;

  return {
    /**
     * Open a connection to serverUrl/ingest with apiKey auth.
     */
    connect(serverUrl, apiKey) {
      if (socket) return;
      try {
        socket = io(serverUrl + '/ingest', {
          auth: { apiKey },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000,
          transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
          /* silent */
        });

        socket.on('connect_error', (err) => {
          console.warn('[mernify-agent] connection error:', err.message);
        });
      } catch (err) {
        console.warn('[mernify-agent] failed to create socket:', err.message);
      }
    },

    /**
     * Send an array of envelopes via the "ingest" event.
     * Retries up to `retries` times with exponential back-off.
     */
    send(events, retries) {
      if (retries === undefined) retries = 3;

      return new Promise((resolve) => {
        if (!socket || !socket.connected) {
          // Not connected — silently drop to avoid crashing host app
          resolve({ accepted: 0, duplicates: 0, rejected: events.length });
          return;
        }

        let attempt = 0;

        function trySend() {
          const timeout = setTimeout(() => {
            attempt++;
            if (attempt >= retries) {
              console.warn('[mernify-agent] ingest send timed out after', retries, 'retries');
              resolve({ accepted: 0, duplicates: 0, rejected: events.length });
            } else {
              // Exponential back-off: 1s, 2s, 4s …
              setTimeout(trySend, Math.pow(2, attempt - 1) * 1000);
            }
          }, 5000);

          try {
            socket.emit('ingest', events, (ack) => {
              clearTimeout(timeout);
              resolve(ack || { accepted: events.length, duplicates: 0, rejected: 0 });
            });
          } catch (err) {
            clearTimeout(timeout);
            console.warn('[mernify-agent] ingest emit error:', err.message);
            resolve({ accepted: 0, duplicates: 0, rejected: events.length });
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
