const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const TelemetryEvent = require('../models/TelemetryEvent');
const Alert = require('../models/Alert');
const ServiceState = require('../models/ServiceState');
const Rollup = require('../models/Rollup');
const { authJwt } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { projectSchema } = require('../validation/schemas');

const router = express.Router();

router.use(authJwt);

// GET / — list user's projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ ownerId: req.user.id });
    res.json(
      projects.map((p) => ({
        id: p._id,
        name: p.name,
        apiKey: p.apiKey,
        createdAt: p.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — create project
router.post('/', validate(projectSchema), async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      ownerId: req.user.id,
    });
    res.status(201).json({
      id: project._id,
      name: project.name,
      apiKey: project.apiKey,
      createdAt: project.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — delete project and cascaded telemetry
router.delete('/:id', async (req, res) => {
  try {
    const { resolveProject } = require('../utils/projectResolver');
    const project = await resolveProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const projectId = project._id;
    await Project.findByIdAndDelete(projectId);

    // Cascade cleanup associated telemetry and alert data
    await Promise.allSettled([
      TelemetryEvent.deleteMany({ projectId }),
      ServiceState.deleteMany({ projectId }),
      Alert.deleteMany({ projectId }),
      Rollup ? Rollup.deleteMany({ projectId }) : Promise.resolve(),
      require('../models/Rollup1s').deleteMany({ projectId }),
      require('../models/Rollup1m').deleteMany({ projectId }),
    ]);

    res.json({ id: projectId.toString(), message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
