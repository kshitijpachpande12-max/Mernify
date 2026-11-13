const express = require('express');
const Alert = require('../models/Alert');
const Project = require('../models/Project');
const { authJwt } = require('../middleware/auth');

const router = express.Router();

router.use(authJwt);

router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const project = await Project.findById(projectId);
    if (!project || project.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const alerts = await Alert.find({ projectId: project._id })
      .sort({ ts: -1 })
      .lean();

    const formatted = alerts.map((a) => ({
      id: a.id || a._id.toString(),
      projectId: a.projectId.toString(),
      serviceName: a.serviceName,
      type: a.type,
      metric: a.metric,
      severity: a.severity,
      message: a.message,
      value: a.value,
      threshold: a.threshold,
      ts: a.ts instanceof Date ? a.ts.getTime() : new Date(a.ts).getTime(),
      resolved: !!a.resolved,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
