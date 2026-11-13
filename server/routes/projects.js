const express = require('express');
const Project = require('../models/Project');
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

module.exports = router;
