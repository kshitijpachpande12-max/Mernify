const mongoose = require('mongoose');

const serviceStateSchema = new mongoose.Schema({
  projectId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  serviceName:   { type: String, required: true },
  instanceId:    { type: String, required: true },
  lastHeartbeat: { type: Date, default: Date.now },
  status:        { type: String, enum: ['up', 'down'], default: 'up' },
});

serviceStateSchema.index(
  { projectId: 1, serviceName: 1, instanceId: 1 },
  { unique: true }
);

module.exports = mongoose.model('ServiceState', serviceStateSchema);
