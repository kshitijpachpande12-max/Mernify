const Rollup = require('../models/Rollup');

const METRICS_FIELDS = ['cpuPercent', 'memRssMB', 'heapUsedMB', 'eventLoopLagMs', 'uptimeSec'];

/**
 * Compute 1-minute rollups for metrics events and bulk upsert.
 */
async function computeRollups(events) {
  const metricsEvents = events.filter((e) => e.type === 'metrics');
  if (metricsEvents.length === 0) return;

  const ops = [];

  for (const ev of metricsEvents) {
    const bucket = new Date(
      Math.floor(new Date(ev.ts).getTime() / 60000) * 60000
    );

    for (const field of METRICS_FIELDS) {
      const value = ev.payload && ev.payload[field];
      if (value === undefined || value === null) continue;

      ops.push({
        updateOne: {
          filter: {
            projectId: ev.projectId,
            serviceName: ev.serviceName,
            bucket,
            field,
          },
          update: {
            $inc: { count: 1, sum: value },
            $min: { min: value },
            $max: { max: value },
            $setOnInsert: {
              projectId: ev.projectId,
              serviceName: ev.serviceName,
              bucket,
              field,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (ops.length > 0) {
    try {
      await Rollup.bulkWrite(ops, { ordered: false });
    } catch (err) {
      console.error('[rollup] bulkWrite error:', err.message);
    }

    // Recompute avg for affected rollups
    const affectedKeys = [
      ...new Set(
        metricsEvents.map(
          (e) =>
            `${e.projectId}:${e.serviceName}:${Math.floor(
              new Date(e.ts).getTime() / 60000
            ) * 60000}`
        )
      ),
    ];

    for (const key of affectedKeys) {
      const [projectId, serviceName, bucketMs] = key.split(':');
      const bucket = new Date(parseInt(bucketMs, 10));
      try {
        const rollups = await Rollup.find({ projectId, serviceName, bucket });
        for (const r of rollups) {
          if (r.count > 0) {
            r.avg = r.sum / r.count;
            await r.save();
          }
        }
      } catch (err) {
        console.error('[rollup] avg recompute error:', err.message);
      }
    }
  }
}

module.exports = { computeRollups };
