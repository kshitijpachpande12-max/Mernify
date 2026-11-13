const Project = require('../models/Project');
const { ingest } = require('../services/ingestion');
const { ingestSchema } = require('../validation/schemas');
const stats = require('../services/stats');

function setupIngestNamespace(io) {
  const ns = io.of('/ingest');

  // Auth by API key
  ns.use(async (socket, next) => {
    const apiKey = socket.handshake.auth.apiKey || socket.handshake.headers['x-api-key'];
    if (!apiKey) return next(new Error('Missing apiKey'));

    try {
      const project = await Project.findOne({ apiKey });
      if (!project) return next(new Error('Invalid apiKey'));
      socket.project = {
        _id: project._id,
        name: project.name,
        ownerId: project.ownerId,
        apiKey: project.apiKey,
      };
      next();
    } catch (err) {
      next(new Error('Auth error'));
    }
  });

  ns.on('connection', (socket) => {
    stats.setConnectedIngest(ns.sockets.size);

    socket.on('ingest', async (data, ack) => {
      try {
        let events = null;
        if (Array.isArray(data)) {
          events = data;
        } else if (data && Array.isArray(data.events)) {
          events = data.events;
        }

        if (!events || !Array.isArray(events)) {
          if (ack) {
            ack({
              accepted: 0,
              duplicates: 0,
              rejected: 0,
              error: 'Invalid payload: expected an array of envelopes',
            });
          }
          return;
        }

        const result = await ingest(events, socket.project);
        if (ack) ack(result);
      } catch (err) {
        if (ack) ack({ accepted: 0, duplicates: 0, rejected: 0, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      stats.setConnectedIngest(ns.sockets.size);
    });
  });

  return ns;
}

module.exports = { setupIngestNamespace };
