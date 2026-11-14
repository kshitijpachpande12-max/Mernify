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
    const now = Date.now();
    const SILENCE_TIMEOUT = 15000; // 15s

    // Group by serviceName
    const grouped = {};
    for (const s of states) {
      if (!grouped[s.serviceName]) grouped[s.serviceName] = [];
      const lastHeartbeatMs = s.lastHeartbeat ? new Date(s.lastHeartbeat).getTime() : 0;
      const isUp = s.status === 'up' && (now - lastHeartbeatMs <= SILENCE_TIMEOUT);
      grouped[s.serviceName].push({
        instanceId: s.instanceId,
        status: isUp ? 'up' : 'down',
        lastSeen: s.lastHeartbeat,
      });
    }

    // Fallback: If no states recorded yet, check distinct services in TelemetryEvent
    if (Object.keys(grouped).length === 0) {
      const TelemetryEvent = require('../models/TelemetryEvent');
      const distinctServices = await TelemetryEvent.distinct('serviceName', {
        projectId: project._id,
      });
      for (const name of distinctServices) {
        const latest = await TelemetryEvent.findOne({
          projectId: project._id,
          serviceName: name,
        })
          .sort({ ts: -1 })
          .select('ts')
          .lean();

        const latestTs = latest?.ts ? new Date(latest.ts).getTime() : 0;
        const isUp = latestTs > 0 && (now - latestTs <= SILENCE_TIMEOUT);
        grouped[name] = [{
          instanceId: `${name}-inst-1`,
          status: isUp ? 'up' : 'down',
          lastSeen: latest?.ts || new Date(0),
        }];
      }
    }

    // Default for demo project if brand new with no events yet
    if (
      Object.keys(grouped).length === 0 &&
      (project.apiKey === 'dev-key' || project.name === 'Demo Project')
    ) {
      grouped['cart-service'] = [{ instanceId: 'cart-inst-1', status: 'down', lastSeen: new Date(0) }];
      grouped['payment-service'] = [{ instanceId: 'payment-inst-1', status: 'down', lastSeen: new Date(0) }];
      grouped['product-service'] = [{ instanceId: 'product-inst-1', status: 'down', lastSeen: new Date(0) }];
      grouped['auth-service'] = [{ instanceId: 'auth-inst-1', status: 'down', lastSeen: new Date(0) }];
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
