const mongoose = require('mongoose');
const Project = require('../models/Project');

/**
 * Flexible project resolver — resolves a project by ObjectId, apiKey,
 * or the well-known 'proj_demo' identifier used by the simulator and seeder.
 */
async function resolveProject(identifier) {
  if (!identifier) return null;

  let project = null;

  if (mongoose.isValidObjectId(identifier)) {
    project = await Project.findById(identifier);
  }

  if (!project) {
    project = await Project.findOne({
      $or: [
        { apiKey: identifier },
        { name: identifier },
        ...(identifier === 'proj_demo'
          ? [{ apiKey: 'dev-key' }, { name: 'Demo Project' }]
          : []),
      ],
    });
  }

  if (!project && identifier === 'proj_demo') {
    project = await Project.findOne({ apiKey: 'dev-key' });
  }

  return project;
}

module.exports = { resolveProject };
