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

// DELETE /:id — remove a project and the telemetry stored under it
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectId = project._id;
    await Promise.all([
      TelemetryEvent.deleteMany({ projectId }),
      Alert.deleteMany({ projectId }),
      ServiceState.deleteMany({ projectId }),
      Rollup.deleteMany({ projectId }),
    ]);
    await Project.deleteOne({ _id: projectId });

    res.json({ id: projectId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
