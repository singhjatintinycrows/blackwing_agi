'use strict';
const express = require('express');
const requireAuth = require('../middleware/auth');
const db = require('../db/db');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin role required.' });
  next();
}

// GET /api/tools
router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM tools ORDER BY name').all());
});

// GET /api/tools/:id
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Tool not found.' });
  res.json(row);
});

// POST /api/tools
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, type, description, config_json } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });

  const result = db.prepare(
    'INSERT INTO tools (name, type, description, config_json) VALUES (?, ?, ?, ?)'
  ).run(name, type || null, description || null, config_json || null);

  const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(tool);
});

// PATCH /api/tools/:id
router.patch('/:id', requireAuth, requireAdmin, (req, res) => {
  const tool = db.prepare('SELECT id FROM tools WHERE id = ?').get(req.params.id);
  if (!tool) return res.status(404).json({ error: 'Tool not found.' });

  const { name, type, description, config_json } = req.body || {};
  const fields = [];
  const params = [];
  if (name !== undefined)        { fields.push('name = ?');        params.push(name); }
  if (type !== undefined)        { fields.push('type = ?');        params.push(type); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description); }
  if (config_json !== undefined) { fields.push('config_json = ?'); params.push(config_json); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update.' });

  params.push(req.params.id);
  db.prepare(`UPDATE tools SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id));
});

// DELETE /api/tools/:id
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const tool = db.prepare('SELECT id FROM tools WHERE id = ?').get(req.params.id);
  if (!tool) return res.status(404).json({ error: 'Tool not found.' });
  db.prepare('DELETE FROM tools WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
