const express = require('express');
const ServiceState = require('../models/ServiceState');
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

    const states = await ServiceState.find({ projectId: project._id }).lean();

    // Group by serviceName
    const grouped = {};
    for (const s of states) {
      if (!grouped[s.serviceName]) grouped[s.serviceName] = [];
      grouped[s.serviceName].push({
        instanceId: s.instanceId,
        status: s.status,
        lastSeen: s.lastHeartbeat,
      });
    }

    const result = Object.entries(grouped).map(([serviceName, instances]) => ({
      serviceName,
      instances,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
