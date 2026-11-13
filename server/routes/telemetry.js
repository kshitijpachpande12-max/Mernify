const express = require('express');
const TelemetryEvent = require('../models/TelemetryEvent');
const Project = require('../models/Project');
const { authJwt } = require('../middleware/auth');

const router = express.Router();

router.use(authJwt);

const NUMERIC_FIELDS = [
  'cpuPercent',
  'memRssMB',
  'heapUsedMB',
  'eventLoopLagMs',
  'latencyP95',
  'latencyP50',
  'latencyP99',
  'requests',
];

router.get('/', async (req, res) => {
  try {
    const { projectId, service, type, from, to, limit: rawLimit, bucket, field } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // Verify ownership
    const project = await Project.findById(projectId);
    if (!project || project.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 1000, 1), 10000);

    // Build base filter
    const filter = { projectId: project._id };
    if (service) filter.serviceName = service;
    if (type) filter.type = type;
    if (from || to) {
      filter.ts = {};
      if (from) {
        const fromNum = Number(from);
        filter.ts.$gte = isNaN(fromNum) ? new Date(from) : new Date(fromNum);
      }
      if (to) {
        const toNum = Number(to);
        filter.ts.$lte = isNaN(toNum) ? new Date(to) : new Date(toNum);
      }
    }

    if (!bucket) {
      // Raw query — return envelopes sorted by ts asc
      const rawEvents = await TelemetryEvent.find(filter)
        .sort({ ts: 1 })
        .limit(limit)
        .lean();

      const points = rawEvents.map((e) => ({
        eventId: e.eventId,
        projectId: e.projectId ? e.projectId.toString() : String(project._id),
        serviceName: e.serviceName,
        instanceId: e.instanceId,
        seq: e.seq,
        ts: e.ts instanceof Date ? e.ts.getTime() : new Date(e.ts).getTime(),
        type: e.type,
        payload: e.payload,
      }));

      const asOf = points.length > 0 ? points[points.length - 1].ts : Date.now();
      return res.json({ points, asOf });
    }

    // Bucketed aggregation
    const bucketMs = bucket === '1s' ? 1000 : 60000;
    const targetFields = field ? [field] : NUMERIC_FIELDS;

    // Grouping expressions
    const groupFields = {
      _id: {
        bucket: {
          $toDate: {
            $subtract: [
              { $toLong: '$ts' },
              { $mod: [{ $toLong: '$ts' }, bucketMs] },
            ],
          },
        },
      },
      count: { $sum: 1 },
    };

    for (const f of targetFields) {
      groupFields[`avg_${f}`] = { $avg: `$payload.${f}` };
      groupFields[`min_${f}`] = { $min: `$payload.${f}` };
      groupFields[`max_${f}`] = { $max: `$payload.${f}` };
    }

    const pipeline = [
      { $match: filter },
      { $group: groupFields },
      { $sort: { '_id.bucket': 1 } },
      { $limit: limit },
    ];

    const aggregated = await TelemetryEvent.aggregate(pipeline);

    // Transform into { ts, avg, min, max, count, field } per bucket
    const points = [];
    for (const row of aggregated) {
      const bucketTs = new Date(row._id.bucket).getTime();
      for (const f of targetFields) {
        if (row[`avg_${f}`] !== null && row[`avg_${f}`] !== undefined) {
          points.push({
            ts: bucketTs,
            avg: Math.round(row[`avg_${f}`] * 100) / 100,
            min: row[`min_${f}`],
            max: row[`max_${f}`],
            count: row.count,
            field: f,
          });
        }
      }
    }

    const asOf = points.length > 0 ? points[points.length - 1].ts : Date.now();
    res.json({ points, asOf });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
