const Project = require('../models/Project');

async function authApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }
  try {
    const project = await Project.findOne({ apiKey: key });
    if (!project) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    req.project = {
      _id: project._id,
      name: project.name,
      ownerId: project.ownerId,
      apiKey: project.apiKey,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'API key lookup failed' });
  }
}

module.exports = { authApiKey };
