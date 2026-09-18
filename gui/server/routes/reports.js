'use strict';
const express = require('express');
const requireAuth = require('../middleware/auth');
const db = require('../db/db');
const { generateReportPdf } = require('../services/report/generate');

const router = express.Router();

// Same auto-detection the engine bridge uses: AI/LLM target -> AI Red Teaming
// report; anything else -> Website Assessment (web-app pentest) report.
const AI_SIGNAL = /\b(ai|llm|genai|gen-ai|gpt|chatbot|chat\s?bot|assistant|copilot|prompt|openai|anthropic|bedrock|gemini|claude|inference|completion)\b/i;
function detectAssessmentType(cfg, target, appName) {
  if (cfg && cfg.assessmentType) return cfg.assessmentType;
  const hay = [target, appName, cfg && cfg.spec].filter(Boolean).join(' ');
  return AI_SIGNAL.test(hay) ? 'ai' : 'web';
}

// GET /api/reports
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT r.id, r.assessment_id, r.title, r.summary, r.created_at,
           a.app_name, a.target, a.status,
           COUNT(f.id) AS finding_count
    FROM reports r
    JOIN assessments a ON r.assessment_id = a.id
    LEFT JOIN findings f ON f.report_id = r.id
    WHERE a.user_id = ?
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `).all(req.user.sub);
  res.json(rows);
});

// GET /api/reports/:id
router.get('/:id', requireAuth, (req, res) => {
  const report = db.prepare(`
    SELECT r.*, a.app_name, a.target, a.status AS assessment_status, a.run_id
    FROM reports r
    JOIN assessments a ON r.assessment_id = a.id
    WHERE r.id = ? AND a.user_id = ?
  `).get(req.params.id, req.user.sub);
  if (!report) return res.status(404).json({ error: 'Report not found.' });

  const findings = db.prepare(
    `SELECT * FROM findings WHERE report_id = ? ORDER BY
     CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3
                   WHEN 'low' THEN 4 ELSE 5 END`
  ).all(req.params.id);

  res.json({ ...report, findings });
});

// GET /api/reports/:id/pdf — the "Download Report" button. Renders the
// Tinycrows AI Red Teaming Report PDF from this report's findings.
router.get('/:id/pdf', requireAuth, async (req, res) => {
  const report = db.prepare(`
    SELECT r.*, a.app_name, a.target, a.status AS assessment_status, a.run_id, a.config_json, a.created_at AS started_at
    FROM reports r JOIN assessments a ON r.assessment_id = a.id
    WHERE r.id = ? AND a.user_id = ?
  `).get(req.params.id, req.user.sub);
  if (!report) return res.status(404).json({ error: 'Report not found.' });

  const findings = db.prepare(
    `SELECT * FROM findings WHERE report_id = ? ORDER BY
     CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3
                   WHEN 'low' THEN 4 ELSE 5 END`
  ).all(req.params.id);

  let cfg = {}; try { cfg = JSON.parse(report.config_json || '{}'); } catch {}
  const org = report.app_name || cfg.appName || '[Organization Name]';
  const assessmentType = detectAssessmentType(cfg, report.target, report.app_name);

  const data = {
    org,
    appName: report.app_name,
    target: report.target,
    systemUnderTest: report.app_name || report.target,
    summary: report.summary,
    preparedBy: (req.user && req.user.name) || 'Blackwing',
    reviewedBy: cfg.devContact || '',
    date: String(report.created_at || '').slice(0, 10) || undefined,
    assessmentType,
    findings: findings.map((f) => ({
      severity: f.severity, category: f.category, title: f.title,
      description: f.description, remediation: f.remediation, status: f.status,
    })),
  };

  try {
    const pdf = await generateReportPdf(data);
    const safe = String(org).replace(/[\[\]]/g, '').replace(/[^\w .-]/g, '').trim();
    const reportName = assessmentType === 'ai' ? 'AI Red Teaming Report.pdf' : 'Website Assessment Report.pdf';
    const fname = (safe && safe !== 'Organization Name' ? safe + ' ' : '') + reportName;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send(pdf);
  } catch (err) {
    console.error('PDF generation failed for report', req.params.id, err);
    res.status(500).json({ error: 'Report generation failed: ' + err.message });
  }
});

module.exports = router;
