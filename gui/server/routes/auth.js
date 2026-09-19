'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const requireAuth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ACCESS_TTL = parseInt(process.env.JWT_ACCESS_TTL || '43200', 10);
const REFRESH_TTL = parseInt(process.env.JWT_REFRESH_TTL || '604800', 10);

function issueTokens(res, user) {
  const payload = { sub: user.id, email: user.email, name: user.name, role: user.role };

  const accessToken = jwt.sign(payload, SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = jwt.sign({ sub: user.id }, SECRET, { expiresIn: REFRESH_TTL });

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: ACCESS_TTL * 1000,
    secure: process.env.NODE_ENV === 'production',
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: REFRESH_TTL * 1000,
    path: '/api/auth',
    secure: process.env.NODE_ENV === 'production',
  });
}

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

  issueTokens(res, user);
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.status(204).end();
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(user);
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const token = req.cookies && req.cookies.refresh_token;
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Unauthorised' });
    issueTokens(res, user);
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch {
    res.status(401).json({ error: 'Unauthorised' });
  }
});

module.exports = router;
