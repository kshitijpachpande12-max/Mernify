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

    const { resolveProject } = require('../utils/projectResolver');
    const project = await resolveProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.ownerId.toString() !== req.user.id) {
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

    // Fallback: If no states recorded yet, check distinct services in TelemetryEvent
    if (Object.keys(grouped).length === 0) {
      const distinctServices = await require('../models/TelemetryEvent').distinct('serviceName', {
        projectId: project._id,
      });
      for (const name of distinctServices) {
        grouped[name] = [{ instanceId: 'inst-1', status: 'up', lastSeen: new Date() }];
      }
    }

    // Default for demo project if brand new with no events yet
    if (
      Object.keys(grouped).length === 0 &&
      (project.apiKey === 'dev-key' || project.name === 'Demo Project')
    ) {
      grouped['cart-service'] = [{ instanceId: 'cart-inst-1', status: 'up', lastSeen: new Date() }];
      grouped['payment-service'] = [{ instanceId: 'payment-inst-1', status: 'up', lastSeen: new Date() }];
      grouped['auth-service'] = [{ instanceId: 'auth-inst-1', status: 'up', lastSeen: new Date() }];
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
