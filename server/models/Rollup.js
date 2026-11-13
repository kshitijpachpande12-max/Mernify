const mongoose = require('mongoose');

const rollupSchema = new mongoose.Schema({
  projectId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  serviceName: { type: String, required: true },
  bucket:      { type: Date, required: true },
  field:       { type: String, required: true },
  avg:         { type: Number, default: 0 },
  min:         { type: Number, default: 0 },
  max:         { type: Number, default: 0 },
  count:       { type: Number, default: 0 },
  sum:         { type: Number, default: 0 },
});

rollupSchema.index(
  { projectId: 1, serviceName: 1, bucket: 1, field: 1 },
  { unique: true }
);

module.exports = mongoose.model('Rollup', rollupSchema);
