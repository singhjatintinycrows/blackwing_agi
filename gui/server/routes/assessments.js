'use strict';
const express = require('express');
const requireAuth = require('../middleware/auth');
const { assessLimiter } = require('../middleware/rateLimit');
const agent = require('../services/agent');
const { parseReport } = require('../services/reportParser');
const db = require('../db/db');
const crypto = require('crypto');

const router = express.Router();

// Persist report + findings when an agent run completes
agent.agentEmitter.on('complete', ({ runId, rawLog, status }) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE run_id = ?').get(runId);
    if (!assessment) return;

    db.prepare(
      `UPDATE assessments SET status = ?, completed_at = datetime('now') WHERE run_id = ?`
    ).run(status, runId);

    const { findings, summary } = parseReport(rawLog);
    const title = assessment.app_name
      ? `${assessment.app_name} — Assessment Report`
      : `Assessment Report`;

    const reportResult = db.prepare(
      `INSERT INTO reports (assessment_id, title, summary, raw_log) VALUES (?, ?, ?, ?)`
    ).run(assessment.id, title, summary, rawLog);

    const reportId = reportResult.lastInsertRowid;
    const insertFinding = db.prepare(
      `INSERT INTO findings (report_id, assessment_id, severity, category, title, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const insertMany = db.transaction((rows) => {
      for (const f of rows) {
        insertFinding.run(reportId, assessment.id, f.severity, f.category, f.title, f.description);
      }
    });
    insertMany(findings);
  } catch (err) {
    console.error('Failed to persist report for run', runId, err.message);
  }
});

// POST /api/assessments
router.post('/', requireAuth, assessLimiter, (req, res) => {
  const {
    appName, devContact, target, spec, restrictedPaths,
    method, strategy, accounts, selectedScope, activeStandards,
    intrusive, findingValidation,
  } = req.body;

  if (!target) return res.status(400).json({ error: 'target is required.' });
  let parsedTarget;
  try {
    parsedTarget = new URL(target);
  } catch {
    return res.status(400).json({ error: 'Invalid target URL.' });
  }
  if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
    return res.status(400).json({ error: 'Target URL must use http or https.' });
  }

  const runId = crypto.randomUUID();

  const configJson = JSON.stringify({
    appName, devContact, target, spec, restrictedPaths,
    method, strategy, selectedScope, activeStandards, intrusive, findingValidation,
  });

  db.prepare(
    `INSERT INTO assessments (run_id, user_id, app_name, target, config_json)
     VALUES (?, ?, ?, ?, ?)`
  ).run(runId, req.user.sub, appName || null, target, configJson);

  try {
    agent.startRun(runId, {
      target, method, strategy, accounts, spec, restrictedPaths,
      activeStandards, selectedScope, intrusive, findingValidation,
      appName, devContact,
    });
  } catch (err) {
    db.prepare(`UPDATE assessments SET status = 'error' WHERE run_id = ?`).run(runId);
    return res.status(503).json({ error: err.message });
  }

  res.json({ runId });
});

// GET /api/assessments
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT id, run_id, app_name, target, status, created_at, completed_at
     FROM assessments WHERE user_id = ? ORDER BY created_at DESC`
  ).all(req.user.sub);
  res.json(rows);
});

// GET /api/assessments/:id
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare(
    `SELECT * FROM assessments WHERE run_id = ? AND user_id = ?`
  ).get(req.params.id, req.user.sub);
  if (!row) return res.status(404).json({ error: 'Assessment not found.' });
  res.json(row);
});

// GET /api/assessments/:id/stream
router.get('/:id/stream', requireAuth, (req, res) => {
  if (!agent.hasRun(req.params.id)) {
    return res.status(404).json({ error: 'Active run not found.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  agent.addClient(req.params.id, res);
  req.on('close', () => agent.removeClient(req.params.id, res));
});

// POST /api/assessments/:id/abort
router.post('/:id/abort', requireAuth, (req, res) => {
  const assessment = db.prepare(
    `SELECT id FROM assessments WHERE run_id = ? AND user_id = ?`
  ).get(req.params.id, req.user.sub);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

  if (!agent.abortRun(req.params.id)) {
    return res.status(404).json({ error: 'No active run to abort.' });
  }

  db.prepare(`UPDATE assessments SET status = 'aborted' WHERE run_id = ?`).run(req.params.id);
  res.status(204).end();
});

module.exports = router;
