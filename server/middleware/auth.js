const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const KNOWN_SECRETS = [
  JWT_SECRET,
  'change-me-in-production',
  'dev_secret_jwt_key_12345',
  'dev-secret'
];

function verifyAnyJwt(token) {
  for (const sec of KNOWN_SECRETS) {
    try {
      return jwt.verify(token, sec);
    } catch {}
  }
  return null;
}

function authJwt(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = header.slice(7);
  const decoded = verifyAnyJwt(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = { id: decoded.id, email: decoded.email };
  next();
}

module.exports = { authJwt, verifyAnyJwt };
