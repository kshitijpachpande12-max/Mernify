const mongoose = require('mongoose');
const { ulid } = require('ulid');

const alertSchema = new mongoose.Schema({
  id:          { type: String, default: () => ulid() },
  projectId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  serviceName: { type: String, required: true },
  type: {
    type: String,
    enum: ['zscore', 'error_rate', 'service_down'],
    required: true,
  },
  metric:    { type: String },
  severity: {
    type: String,
    enum: ['warning', 'critical'],
    required: true,
  },
  message:   { type: String, required: true },
  value:     { type: Number },
  threshold: { type: Number },
  ts:        { type: Date, default: Date.now },
  resolved:  { type: Boolean, default: false },
});

module.exports = mongoose.model('Alert', alertSchema);
