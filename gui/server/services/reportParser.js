'use strict';

const SEVERITY_KEYWORDS = new Set(['critical', 'high', 'medium', 'low', 'info']);
// Recognise OWASP web/API, OWASP LLM Top 10, CWE and MITRE ATLAS identifiers.
const CATEGORY_RE = /^(A\d+:\d+|API\d+:\d+|LLM\d+:\d+|CWE-\d+|AML\.T\w+)/i;

function parseFinding(line) {
  const text = line.replace(/^\[FINDING\]\s*/, '').trim();
  const parts = text.split(/\.\s+/);

  let severity = 'info';
  let category = null;
  let rest = text;

  if (parts.length >= 2 && SEVERITY_KEYWORDS.has(parts[0].toLowerCase().trim())) {
    severity = parts[0].toLowerCase().trim();
    let idx = 1;
    if (parts[1] && CATEGORY_RE.test(parts[1].trim())) { category = parts[1].trim(); idx = 2; }
    rest = parts.slice(idx).join('. ').trim() || text;
  }

  // The bridge emits "<title> — <impact/remediation>"; split those apart.
  let title = rest;
  let description = rest;
  const dash = rest.split(/\s+[—–-]\s+/);
  if (dash.length >= 2) {
    title = dash[0].trim();
    description = dash.slice(1).join(' — ').trim();
  }

  return { severity, category, title, description };
}

function parseReport(rawLog) {
  const lines = rawLog.split('\n');
  const findings = [];
  let summary = '';

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith('[FINDING]')) {
      findings.push(parseFinding(trimmed));
    }
    if (trimmed.startsWith('[STATUS]') && /complete/i.test(trimmed)) {
      summary = trimmed.replace(/^\[STATUS\]\s*/, '');
    }
  }

  return { findings, summary };
}

module.exports = { parseReport };
