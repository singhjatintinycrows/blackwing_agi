'use strict';
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Verifies the httpOnly access_token cookie and attaches the decoded user
// (sub, email, name, role) to req.user. SSE/EventSource requests authenticate
// the same way, since the browser sends the cookie automatically.
module.exports = function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.access_token;
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorised' });
  }
};
