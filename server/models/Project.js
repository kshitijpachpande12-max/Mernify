const mongoose = require('mongoose');
const { ulid } = require('ulid');

const projectSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  ownerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  apiKey:    { type: String, default: () => ulid(), unique: true },
  createdAt: { type: Date, default: Date.now },
});

projectSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Project', projectSchema);
