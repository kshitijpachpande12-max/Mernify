'use strict';

/**
 * Express middleware factory.
 * Aggregates HTTP traffic into windows or immediate serverless flushes.
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

    if (agent && typeof agent.addToBuffer === 'function' && typeof agent.createEnvelope === 'function') {
      agent.addToBuffer(agent.createEnvelope('http', payload));
    }
  }

  // Only start recurring interval timer if not in pure serverless mode (where intervals freeze)
  if (!agent || !agent.isServerless) {
    windowTimer = setInterval(() => {
      try {
        flushWindow();
      } catch (_) {
        /* never crash host */
      }
    }, WINDOW_MS);

    if (windowTimer && windowTimer.unref) {
      windowTimer.unref();
    }
  }

  // The actual Express middleware
  return function sentinelMiddleware(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      try {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const route = (req.route && req.route.path) || req.baseUrl || req.path || '/';
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

        // SERVERLESS RESILIENCE:
        // In serverless environments (e.g. Vercel, AWS Lambda), execution freezes immediately
        // after response delivery. We must flush the window, collect metrics, emit a heartbeat,
        // and trigger flushBuffer() before the lambda freezes!
        if (agent && agent.isServerless) {
          flushWindow();
          if (typeof agent.collectMetrics === 'function') {
            agent.collectMetrics();
          }
          if (typeof agent.sendHeartbeat === 'function') {
            agent.sendHeartbeat();
          }
          if (typeof agent.flushBuffer === 'function') {
            agent.flushBuffer();
          }
        }
      } catch (_) {
        /* never crash host */
      }
    });

    next();
  };
}

module.exports = { createMiddleware };
