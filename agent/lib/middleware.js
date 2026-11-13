'use strict';

/**
 * Express middleware factory.
 * Aggregates HTTP traffic into 1-second windows and emits a single
 * "http" envelope per window.
 */
function createMiddleware(agent) {
  const WINDOW_MS = 1000;

  let window = freshWindow();
  let windowTimer = null;

  function freshWindow() {
    return {
      startMs: Date.now(),
      requests: 0,
      errors4xx: 0,
      errors5xx: 0,
      latencies: [],
      byRoute: {},
    };
  }

  function percentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const idx = Math.floor(sorted.length * p);
    return sorted[Math.min(idx, sorted.length - 1)];
  }

  function flushWindow() {
    const w = window;
    window = freshWindow();

    if (w.requests === 0) return; // nothing to report

    const sorted = w.latencies.slice().sort((a, b) => a - b);

    const byRoute = {};
    for (const key of Object.keys(w.byRoute)) {
      const r = w.byRoute[key];
      const rs = r.latencies.slice().sort((a, b) => a - b);
      byRoute[key] = {
        count: r.count,
        errors: r.errors,
        p95: percentile(rs, 0.95),
      };
    }

    const payload = {
      windowMs: WINDOW_MS,
      requests: w.requests,
      errors4xx: w.errors4xx,
      errors5xx: w.errors5xx,
      latencyP50: percentile(sorted, 0.50),
      latencyP95: percentile(sorted, 0.95),
      latencyP99: percentile(sorted, 0.99),
      byRoute,
    };

    agent.addToBuffer(agent.createEnvelope('http', payload));
  }

  // Start the 1-second window flush timer
  windowTimer = setInterval(() => {
    try {
      flushWindow();
    } catch (_) {
      /* never crash host */
    }
  }, WINDOW_MS);

  // Don't prevent the process from exiting
  if (windowTimer && windowTimer.unref) {
    windowTimer.unref();
  }

  // The actual Express middleware
  return function mernifyMiddleware(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      try {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const route = (req.route && req.route.path) || req.path || '/';
        const routeKey = req.method + ' ' + route;

        window.requests++;
        window.latencies.push(duration);

        if (status >= 400 && status < 500) window.errors4xx++;
        if (status >= 500) window.errors5xx++;

        if (!window.byRoute[routeKey]) {
          window.byRoute[routeKey] = { count: 0, errors: 0, latencies: [] };
        }
        const r = window.byRoute[routeKey];
        r.count++;
        r.latencies.push(duration);
        if (status >= 400) r.errors++;
      } catch (_) {
        /* never crash host */
      }
    });

    next();
  };
}

module.exports = { createMiddleware };
