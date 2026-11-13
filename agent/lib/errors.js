'use strict';

const crypto = require('crypto');

/**
 * Error tracking — intercepts uncaughtException and unhandledRejection,
 * deduplicates via stack hash, and pushes error envelopes into the agent buffer.
 */
function setupErrorTracking(agent) {
  const seen = {}; // stackHash -> count

  function handleError(err, route) {
    try {
      if (!(err instanceof Error)) {
        err = new Error(String(err));
      }

      const message = err.message || 'Unknown error';
      const stackLines = (err.stack || '').split('\n').slice(0, 4); // message + first 3 frames
      const hashInput = message + '\n' + stackLines.join('\n');
      const stackHash = crypto.createHash('sha256').update(hashInput).digest('hex');

      const isFirst = !seen[stackHash];
      seen[stackHash] = (seen[stackHash] || 0) + 1;

      const payload = {
        message,
        stackHash,
        count: seen[stackHash],
      };

      if (route) payload.route = route;
      if (isFirst) payload.stack = err.stack || '';

      agent.addToBuffer(agent.createEnvelope('error', payload));
    } catch (_) {
      // Never crash the host app
    }
  }

  process.on('uncaughtException', (err) => {
    handleError(err);
    // Do NOT re-throw — the agent must never bring down the host process
  });

  process.on('unhandledRejection', (reason) => {
    handleError(reason instanceof Error ? reason : new Error(String(reason)));
  });

  // Return handle so middleware can also report errors with a route context
  return { handleError };
}

module.exports = { setupErrorTracking };
