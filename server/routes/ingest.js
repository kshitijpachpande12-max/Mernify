const express = require('express');
const { authApiKey } = require('../middleware/apiKey');
const { validate } = require('../middleware/validate');
const { ingestSchema } = require('../validation/schemas');
const { ingest } = require('../services/ingestion');

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
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
