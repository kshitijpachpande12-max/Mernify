const express = require('express');
const { authApiKey } = require('../middleware/apiKey');
const { validate } = require('../middleware/validate');
const { ingestSchema } = require('../validation/schemas');
const { ingest, flush } = require('../services/ingestion');
const ServiceState = require('../models/ServiceState');

const router = express.Router();

// POST / — ingest telemetry events
router.post('/', authApiKey, async (req, res) => {
  try {
    let events = null;
    if (Array.isArray(req.body)) {
      events = req.body;
    } else if (req.body && Array.isArray(req.body.events)) {
      events = req.body.events;
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Expected non-empty array of events' });
    }

    const result = await ingest(events, req.project);

    // Immediately flush to MongoDB (vital for serverless runtimes like Vercel)
    await flush();

    // Reconcile and update active service state
    const now = new Date();
    const serviceMap = new Map();
    for (const ev of events) {
      if (ev.serviceName) {
        const inst = ev.instanceId || `${ev.serviceName}-inst-1`;
        serviceMap.set(`${ev.serviceName}:${inst}`, {
          serviceName: ev.serviceName,
          instanceId: inst,
        });
      }
    }

    await Promise.all(
      Array.from(serviceMap.values()).map(({ serviceName, instanceId }) =>
        ServiceState.findOneAndUpdate(
          { projectId: req.project._id, serviceName, instanceId },
          { lastHeartbeat: now, status: 'up' },
          { upsert: true }
        )
      )
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
