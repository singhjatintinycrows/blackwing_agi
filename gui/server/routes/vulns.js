'use strict';
const express = require('express');
const requireAuth = require('../middleware/auth');
const db = require('../db/db');

const router = express.Router();

// GET /api/vulns
// Query params: severity, status, category, from, to
router.get('/', requireAuth, (req, res) => {
  const { severity, status, category, from, to } = req.query;

  let sql = `
    SELECT f.*, a.app_name, a.target, a.run_id
    FROM findings f
    JOIN assessments a ON f.assessment_id = a.id
    WHERE a.user_id = ?
  `;
  const params = [req.user.sub];

  if (severity) { sql += ' AND f.severity = ?'; params.push(severity); }
  if (status)   { sql += ' AND f.status = ?';   params.push(status); }
  if (category) { sql += ' AND f.category = ?'; params.push(category); }
  if (from)     { sql += ' AND f.created_at >= ?'; params.push(from); }
  if (to)       { sql += ' AND f.created_at <= ?'; params.push(to); }

  sql += ` ORDER BY CASE f.severity
    WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3
    WHEN 'low' THEN 4 ELSE 5 END, f.created_at DESC`;

  res.json(db.prepare(sql).all(...params));
});

// GET /api/vulns/:id
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare(`
    SELECT f.*, a.app_name, a.target, a.run_id
    FROM findings f
    JOIN assessments a ON f.assessment_id = a.id
    WHERE f.id = ? AND a.user_id = ?
  `).get(req.params.id, req.user.sub);
  if (!row) return res.status(404).json({ error: 'Finding not found.' });
  res.json(row);
});

// PATCH /api/vulns/:id
router.patch('/:id', requireAuth, (req, res) => {
  const { status, remediation } = req.body || {};
  const VALID_STATUS = new Set(['open', 'confirmed', 'remediated', 'wontfix']);

  const finding = db.prepare(`
    SELECT f.id FROM findings f
    JOIN assessments a ON f.assessment_id = a.id
    WHERE f.id = ? AND a.user_id = ?
  `).get(req.params.id, req.user.sub);
  if (!finding) return res.status(404).json({ error: 'Finding not found.' });

  if (status !== undefined && !VALID_STATUS.has(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  const fields = [];
  const params = [];
  if (status !== undefined)     { fields.push('status = ?');     params.push(status); }
  if (remediation !== undefined){ fields.push('remediation = ?'); params.push(remediation); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update.' });

  fields.push(`updated_at = datetime('now')`);
  params.push(req.params.id);

  db.prepare(`UPDATE findings SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM findings WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
