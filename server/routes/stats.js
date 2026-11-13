const express = require('express');
const stats = require('../services/stats');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(stats.getStats());
});

module.exports = router;
