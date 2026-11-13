const mongoose = require('mongoose');

const telemetryEventSchema = new mongoose.Schema(
  {
    eventId:     { type: String, required: true },
    projectId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    serviceName: { type: String, required: true },
    instanceId:  { type: String, required: true },
    seq:         { type: Number, required: true },
    ts:          { type: Date, required: true },
    type: {
      type: String,
      enum: ['metrics', 'http', 'error', 'heartbeat', 'custom', 'log'],
      required: true,
    },
    payload:    { type: mongoose.Schema.Types.Mixed },
    meta: {
      projectId:   { type: String },
      serviceName: { type: String },
      instanceId:  { type: String },
    },
    receivedAt: { type: Date, default: Date.now },
  },
  {
    timeseries: {
      timeField: 'ts',
      metaField: 'meta',
      granularity: 'seconds',
    },
  }
);

telemetryEventSchema.index({ eventId: 1 }, { unique: true });
telemetryEventSchema.index({ projectId: 1, serviceName: 1, ts: -1 });
telemetryEventSchema.index({ projectId: 1, ts: -1 });

const TelemetryEvent = mongoose.model('TelemetryEvent', telemetryEventSchema);

TelemetryEvent.on('index', (err) => {
  if (err) {
    console.warn('[db] TelemetryEvent index note (timeseries compatibility):', err.message);
  }
});

module.exports = TelemetryEvent;
