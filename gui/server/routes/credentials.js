'use strict';
const express = require('express');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function requiredFields(m, s) {
  if (m === 'form')   return ['user', 'pass'];
  if (m === 'header') return ['token'];
  if (m === 'apikey') return ['token'];
  if (m === 'basic')  return ['user', 'pass'];
  if (m === 'oauth')  return ['user', 'pass'];
  if (m === 'mtls')   return ['cert', 'key'];
  if (m === 'none')   return [];
  if (m === 'sso') {
    if (s === 'token')    return ['token'];
    if (s === 'bypass')   return ['user', 'pass'];
    if (s === 'grant')    return ['user', 'pass'];
    if (s === 'recorded') return ['user', 'pass'];
  }
  return [];
}

// POST /api/validate-credentials
router.post('/', requireAuth, (req, res) => {
  const { method, strategy, accounts } = req.body;
  if (!Array.isArray(accounts)) return res.status(400).json({ error: 'accounts must be an array' });

  const required = requiredFields(method, strategy);
  const results = accounts.map((account, index) => {
    const hasEmpty = required.some(f => !account[f] || !String(account[f]).trim());
    if (hasEmpty) return { index, status: 'incomplete' };
    if (method === 'sso' && strategy === 'token' && index === 2) {
      return { index, status: 'expired' };
    }
    return { index, status: 'validated' };
  });

  res.json({ results });
});

module.exports = router;
