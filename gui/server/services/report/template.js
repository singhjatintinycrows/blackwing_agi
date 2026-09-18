'use strict';
/*
 * Builds the Blackwing "AI Red Teaming Report" HTML — a faithful reproduction of
 * the Tinycrows report template. Rendered to PDF by generate.js (Paged.js +
 * headless Chromium). Static scaffolding matches the template verbatim; the
 * dynamic sections (cover, document details, executive summary, OWASP mapping,
 * vulnerability details) are populated from the assessment + its findings.
 */

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const SEV_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Informational' };
const LLM_CATS = [
  ['LLM01', 'Prompt Injection'], ['LLM02', 'Sensitive Information Disclosure'],
  ['LLM03', 'Supply Chain'], ['LLM04', 'Data and Model Poisoning'],
  ['LLM05', 'Improper Output Handling'], ['LLM06', 'Excessive Agency'],
  ['LLM07', 'System Prompt Leakage'], ['LLM08', 'Vector and Embedding Weaknesses'],
  ['LLM09', 'Misinformation'], ['LLM10', 'Unbounded Consumption'],
];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
// Keep the template's [placeholder] when we have no real value.
const ph = (v, placeholder) => (v == null || v === '' ? placeholder : esc(v));

function severityCounts(findings) {
  const c = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) { const s = (f.severity || 'info').toLowerCase(); if (c[s] != null) c[s]++; }
  return c;
}

function buildHtml(data, assets) {
  const findings = data.findings || [];
  const counts = severityCounts(findings);
  const total = findings.length;
  const org = data.org || '[Organization Name]';
  const reportId = data.reportId || 'RT-' + new Date().getFullYear() + '-001';
  const dateStr = data.date || new Date().toISOString().slice(0, 10);

  /* ---- font faces (data URIs injected by generate.js) ---- */
  const fontFaces = `
    @font-face{font-family:'Carlito';font-weight:400;font-style:normal;src:url('${assets.fonts.carlito}') format('woff2')}
    @font-face{font-family:'Carlito';font-weight:700;font-style:normal;src:url('${assets.fonts.carlitoBold}') format('woff2')}
    @font-face{font-family:'Carlito';font-weight:400;font-style:italic;src:url('${assets.fonts.carlitoItalic}') format('woff2')}
    @font-face{font-family:'Poppins';font-weight:600;font-style:normal;src:url('${assets.fonts.poppins600}') format('woff2')}
    @font-face{font-family:'Poppins';font-weight:700;font-style:normal;src:url('${assets.fonts.poppins700}') format('woff2')}
  `;

  /* ---- helpers for repeated markup ---- */
  const tbl = (rows) => `<table>${rows}</table>`;
  const thRow = (cells) => `<tr>${cells.map((c) => `<th>${c}</th>`).join('')}</tr>`;
  const tdRow = (cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;

  /* ================= Executive summary data ================= */
  const sevCountRow = tdRow([
    ph(data.systemUnderTest || data.appName, '[Scope / System Under Test]'),
    String(counts.critical), String(counts.high), String(counts.medium), String(counts.low), String(counts.info),
  ]);

  const vulnSummaryRows = total
    ? findings.map((f, i) => tdRow([
        String(i + 1), esc(f.title || '[Vulnerability Title]'),
        SEV_LABEL[(f.severity || 'info').toLowerCase()] || '[Severity]',
        esc(f.likelihood || 'Possible'),
        esc(f.category || '[OWASP LLM Mapping]'), esc(f.atlas || '[ATLAS AML.TNNNN]'),
      ])).join('')
    : tdRow(['1', '[Vulnerability Title]', '[Severity]', '[Likelihood]', '[OWASP LLM Mapping]', '[ATLAS AML.TNNNN]']);

  const statusRows = SEV_ORDER.map((s) => tdRow([
    SEV_LABEL[s], String(counts[s]), String(counts[s]), '0', '0',
  ])).join('');

  // OWASP LLM Top 10 mapping counts
  const llmMap = {};
  for (const [id] of LLM_CATS) llmMap[id] = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) {
    const m = String(f.category || '').match(/LLM0?(\d0?)/i);
    if (m) { const id = 'LLM' + m[1].padStart(2, '0'); if (llmMap[id]) llmMap[id][(f.severity || 'info').toLowerCase()]++; }
  }
  const llmRows = LLM_CATS.map(([id, name]) => {
    const r = llmMap[id]; const t = r.critical + r.high + r.medium + r.low + r.info;
    return tdRow([`${id}: ${name}`, r.critical, r.high, r.medium, r.low, r.info, t]);
  }).join('');
  const llmTotals = tdRow(['Total',
    LLM_CATS.reduce((a, [id]) => a + llmMap[id].critical, 0),
    LLM_CATS.reduce((a, [id]) => a + llmMap[id].high, 0),
    LLM_CATS.reduce((a, [id]) => a + llmMap[id].medium, 0),
    LLM_CATS.reduce((a, [id]) => a + llmMap[id].low, 0),
    LLM_CATS.reduce((a, [id]) => a + llmMap[id].info, 0), total]);

  /* ================= Vulnerability detail blocks ================= */
  const vulnBlocks = total ? findings.map((f, i) => {
    const sev = SEV_LABEL[(f.severity || 'info').toLowerCase()] || 'Informational';
    const num = String(i + 1);
    const fid = `${reportId}-${String(i + 1).padStart(2, '0')}`;
    return `
    <div class="finding">
      <div class="finding-bar">${num}. <span class="finding-title">${sev} ${esc(f.title || '[Standard Vulnerability Name]')} (${esc(fid)})</span></div>
      ${tbl(
        thRow(['Attribute', 'Value']) +
        tdRow(['Severity', sev]) +
        tdRow(['Likelihood', esc(f.likelihood || 'Possible')]) +
        tdRow(['Category', esc(f.categoryLabel || f.category || '[Prompt injection / Jailbreak / Data leakage / Agentic misuse / Content safety / Other]')]) +
        tdRow(['Framework mapping', esc(f.category || '[OWASP LLM-NN; ATLAS AML.TNNNN]')]) +
        tdRow(['Affected component', ph(f.component, '[Model / Retrieval / Tool layer / UI]')]) +
        tdRow(['Attack surface', ph(f.surface, '[API / Chat UI / Document ingestion / Connector]')]) +
        tdRow(['Discovered by', ph(data.preparedBy, 'Blackwing')]) +
        tdRow(['Date discovered', esc(dateStr)]) +
        tdRow(['Reproduction rate', ph(f.reproduction, '[N of M attempts, e.g. 7/10]')]) +
        tdRow(['Status', esc((f.status || 'open').replace(/^\w/, (c) => c.toUpperCase()))]) +
        tdRow(['Owner', ph(f.owner, '[Team or individual]')]) +
        tdRow(['Tracking ticket', ph(f.ticket, '[ID / link]')])
      )}
      <p><b>Overview:</b> ${ph(f.description, '[One or two sentences stating what the attacker can make the system do.]')}</p>
      <p><b>Potential Impact:</b> This weakness may potentially result in:</p>
      <ul><li>${ph(f.impact, '[Impact]: [Description]')}</li></ul>
      <p><b>Reproduction Steps:</b></p>
      <ol>${(f.steps && f.steps.length ? f.steps : ['[Step]', '[Step]', '[Step]']).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <p><b>Attack Input (redacted as required):</b> ${ph(f.attackInput, '[Prompt or payload. Redact operative harmful details with [REDACTED - see restricted annex].]')}</p>
      <p><b>Observed Output (redacted as required):</b> ${ph(f.observedOutput, '[Model response excerpt demonstrating the failure.]')}</p>
      <p><b>Root Cause Analysis:</b> ${ph(f.rootCause, '[Why the control failed.]')}</p>
      <p><b>Recommendations:</b> It is recommended to implement the following:</p>
      ${tbl(thRow(['Priority', 'Recommendation', 'Type', 'Owner', 'Target date']) +
        tdRow(['[P0/P1/P2]', ph(f.remediation, '[Specific, testable change]'), '[Model / Prompt / Filter / Architecture / Policy / Monitoring]', '[Team]', '[YYYY-MM-DD]']))}
      <p><b>References:</b></p>
      <ul><li>${ph(f.references, '[References]')}</li></ul>
    </div>`;
  }).join('') : `
    <p style="color:#555">Duplicate the block below for each weakness identified. Keep one issue per block.</p>
    <div class="finding"><div class="finding-bar">1. <span class="finding-title">[Severity] [Standard Vulnerability Name] (${esc(reportId)}-01)</span></div>
      ${tbl(thRow(['Attribute', 'Value']) + tdRow(['Severity', '[Critical / High / Medium / Low / Informational]']) + tdRow(['Likelihood', '[Very likely / Likely / Possible / Unlikely]']))}
      <p><b>Overview:</b> [One or two sentences stating what the attacker can make the system do.]</p>
    </div>`;

  /* ================= full document ================= */
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>AI Red Teaming Report</title>
<style>
${fontFaces}
:root{ --red:#ee0000; --crimson:#e63846; --ink:#16171d; --gray-h:#4b463b; --callout:#e5e1de; --bar:#d8d8d8; --border:#b9b9b9; }
@page{
  size: Letter; margin: 26mm 18mm 22mm 18mm;
  @top-right{ content:"Page " counter(page) " of " counter(pages); font-family:'Carlito'; font-size:10.5pt; color:#111; }
  @bottom-left{ content: element(footConf); }
  @bottom-right{ content: element(footLogo); }
}
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; }
body{ font-family:'Carlito', Calibri, sans-serif; font-size:10pt; line-height:1.38; color:var(--ink); }
h1{ font-family:'Carlito'; font-weight:700; font-size:21pt; margin:0 0 2pt; padding-bottom:6pt; border-bottom:1px solid #d9d9d9; }
h2{ font-family:'Carlito'; font-weight:700; font-size:12.5pt; margin:14pt 0 4pt; }
h3{ font-weight:700; font-size:11pt; margin:10pt 0 3pt; }
p{ margin:5pt 0; }
ul,ol{ margin:5pt 0 5pt 16pt; padding:0; }
li{ margin:2pt 0; }
a{ color:inherit; text-decoration:none; }
table{ width:100%; border-collapse:collapse; margin:6pt 0 10pt; font-size:9.5pt; }
th{ background:var(--red); color:#fff; font-weight:700; text-align:left; padding:4pt 7pt; border:1px solid var(--red); }
td{ border:1px solid var(--border); padding:4pt 7pt; vertical-align:top; }
.section{ page-break-before: always; }
.callout{ background:var(--callout); padding:9pt 12pt 9pt 40pt; font-style:italic; position:relative; margin:6pt 0 10pt; }
.callout img{ position:absolute; left:10pt; top:9pt; width:20pt; height:20pt; }
.finding{ margin:12pt 0; }
.finding-bar{ background:var(--bar); font-weight:700; padding:4pt 8pt; break-after: avoid; }
.finding table{ break-inside: auto; }
h1, h2, h3{ break-after: avoid; }
.finding-title{ color:var(--red); text-decoration:underline; }
.muted{ color:#555; }
/* running footer elements */
#footConf{ position: running(footConf); font-family:'Poppins'; font-weight:700; color:var(--crimson); font-size:12pt; }
#footLogo{ position: running(footLogo); }
#footLogo img{ height:26pt; }
/* cover */
.cover{ break-after: page; }
.cover-grid{ display:flex; height:232mm; }
.cover-art{ flex:0 0 50mm; }
.cover-art img{ display:block; width:50mm; height:232mm; object-fit:cover; object-position:top center; }
.cover-body{ flex:1 1 auto; padding-left:16mm; display:flex; flex-direction:column; }
.cover-title{ font-family:'Poppins'; font-weight:700; color:var(--red); font-size:44pt; line-height:1.06; margin-top:14mm; }
.cover-client{ font-family:'Poppins'; font-weight:700; color:var(--red); font-size:17pt; margin-top:auto; margin-bottom:16mm; }
.box{ border:1px solid #333; padding:10pt 12pt; margin:14pt 0; }
.box h3{ color:var(--gray-h); font-size:12.5pt; margin:0 0 6pt; }
/* TOC */
.toc a{ display:flex; align-items:baseline; }
.toc .t{ order:1; } .toc .l{ order:2; flex:1; border-bottom:1px dotted #999; margin:0 4px 3px; }
.toc a::after{ order:3; content: target-counter(attr(href), page); }
.toc .lvl2{ margin-left:16pt; font-size:9.5pt; }
.chk{ font-family:'Carlito'; margin:2pt 0; break-inside:avoid; }
.chklist{ column-count:2; column-gap:26pt; margin:2pt 0 8pt; }
</style></head>
<body>

<!-- COVER -->
<section class="cover"><div class="cover-grid">
  <div class="cover-art"><img src="${assets.cover}" alt=""></div>
  <div class="cover-body">
    <div class="cover-title">AI Red<br>Teaming<br>Report</div>
    <div class="cover-client">Client Name:<br>${org}</div>
  </div>
</div></section>

<!-- CONFIDENTIALITY -->
<section>
  <div class="box"><h3>Private and Confidential</h3>
    <p>All Rights Reserved</p>
    <p>This report is intended solely for the information and internal use of ${org} and is not intended to be and should not be used by any other person or entity. No other person or entity is entitled to rely, in any manner, or for any purpose, on this report.</p>
  </div>
  <div class="box" style="margin-top:220pt"><h3>Terms of Use</h3>
    <p>This Confidential Information is being provided to ${org} as a deliverable of the Security Assessment. The purpose of this report is to provide recommendations from the assessment. Each recipient agrees that, prior to reading this report, the recipient shall not distribute or use the information contained herein and any other information regarding Tinycrows Pvt. Ltd. for any purpose other than those stated.</p>
  </div>
</section>

<!-- DOCUMENT DETAILS -->
<section class="section"><h1 id="s-docdetails">Document Details</h1>
${tbl(thRow(['Document Name', 'Version', 'Details']) +
  tdRow(['AI Red Teaming Report', ph(data.version, '[Version] Example: v 1.0'),
    `Dated: ${esc(dateStr)} &nbsp;|&nbsp; Prepared by: ${ph(data.preparedBy, '[Name]')} &nbsp;|&nbsp; Reviewed by: ${ph(data.reviewedBy, '[Name]')}`]))}
<h2 id="s-engagement">Engagement Details</h2>
${tbl(thRow(['Field', 'Value']) +
  tdRow(['System under test', ph(data.systemUnderTest, '[Model / application name and version]')]) +
  tdRow(['Report ID', esc(reportId)]) +
  tdRow(['Classification', 'Confidential']) +
  tdRow(['Engagement name', ph(data.engagementName, '[Name]')]) +
  tdRow(['Engagement type', '[Pre-deployment / Periodic assurance / Incident-driven / Regulatory]']) +
  tdRow(['Test window', ph(data.testWindow, '[YYYY-MM-DD] to [YYYY-MM-DD]')]) +
  tdRow(['Lead tester', ph(data.preparedBy, '[Name, role]')]) +
  tdRow(['Requesting owner', '[Name, team]']) +
  tdRow(['Reviewed by', ph(data.reviewedBy, '[Name, date]')]) +
  tdRow(['Approved by', '[Name, date]']) +
  tdRow(['Retention / handling', '[How long this is kept, and where it is stored]']))}
<h2 id="s-revision">Revision History</h2>
${tbl(thRow(['Version', 'Date', 'Author', 'Summary of changes']) +
  tdRow(['0.1', esc(dateStr), ph(data.preparedBy, '[Name]'), 'Initial draft']) +
  tdRow(['1.0', esc(dateStr), ph(data.preparedBy, '[Name]'), 'Approved release']))}
</section>

<!-- DISTRIBUTION -->
<section class="section"><h1 id="s-distribution">Distribution List</h1>
${tbl(thRow(['Name', 'Organization', 'Designation', 'Email ID']) +
  tdRow(['[Name]', org, '[Designation]', '[Email ID]']))}
</section>

<!-- CONTENTS -->
<section class="section"><h1>Contents</h1>
<div class="toc">
  ${[
    ['s-docdetails', 'Document Details'], ['s-engagement', 'Engagement Details', 2], ['s-revision', 'Revision History', 2],
    ['s-distribution', 'Distribution List'], ['s-guide', 'Report Guide'], ['s-intro', 'Introduction'],
    ['s-threat', 'Threat Model'], ['s-method', 'Methodology'], ['s-risk', 'Risk Rating Methodology'],
    ['s-exec', 'Executive Summary'], ['s-owasp', 'OWASP Top 10 Mapping of Vulnerabilities', 2],
    ['s-attack', 'Attack Path Overview'], ['s-vulns', 'Vulnerability Details'],
    ['s-residual', 'Residual Risk and Gaps'], ['s-recs', 'Recommendations'], ['s-signoff', 'Sign-Off'],
    ['s-appendix', 'Appendix'],
  ].map(([id, label, lvl]) => `<a href="#${id}" class="${lvl === 2 ? 'lvl2' : ''}"><span class="t">${label}</span><span class="l"></span></a>`).join('')}
</div>
</section>

<!-- REPORT GUIDE -->
<section class="section"><h1 id="s-guide">Report Guide</h1>
<h2>How to read this Report?</h2>
<p>This report is split into the following sections:</p>
<p><b>Introduction:</b> Overview of the performed activity — objectives, the scope of the AI system under test, the test window, terms, definitions and legends, and the disclaimers that apply.</p>
<p><b>Threat Model:</b> The adversary profiles the system was tested against, the assets protected and the trust boundaries crossed.</p>
<p><b>Methodology:</b> The phases of the engagement, the reference frameworks applied, the attack techniques exercised, the tooling used and the scoring rules.</p>
<p><b>Risk Rating Methodology:</b> The severity and likelihood levels used throughout the report and the matrix combining them.</p>
<p><b>Executive Summary:</b> The key weaknesses observed, the mapping of findings to the OWASP Top 10 for LLM Applications and the overall launch recommendation.</p>
<p><b>Attack Path Overview:</b> The engagement mapped to MITRE ATLAS with coverage, attack success rate and over-refusal statistics.</p>
<p><b>Vulnerability Details:</b> The detailed list of weaknesses, each described by title, overview, impact, severity and likelihood, reproduction rate, affected component, OWASP and ATLAS mapping, root cause, recommendations, proof of concept and references.</p>
<p><b>Residual Risk and Gaps:</b> What the assessment did not establish, which areas were untested and which risks were accepted.</p>
<p><b>Recommendations:</b> Prioritised actions, defence-in-depth observations and monitoring improvements.</p>
<p><b>Sign-Off:</b> The approvals required before the system is released.</p>
<p><b>Appendix:</b> Glossary, test environment details, evidence index, restricted annex reference, prompt corpus reference and the reference list.</p>
</section>

<!-- INTRODUCTION -->
<section class="section"><h1 id="s-intro">Introduction</h1>
<h2>Objective</h2>
<p>Tinycrows Pvt. Ltd. (Tinycrows or we) was engaged by ${org} to conduct an AI red teaming assessment. This assessment was conducted to identify safety, security and misuse weaknesses in the AI system before and during its deployment.</p>
<h2>Scope</h2>
${tbl(thRow(['Asset', 'Description', 'Version / build', 'Environment']) +
  tdRow([ph(data.systemUnderTest, '[Model]'), '[Base or fine-tuned model]', '[Version or hash]', '[Staging / Prod]']) +
  tdRow(['[Application layer]', esc(data.target || '[Chat UI, API, agent runtime]'), '[Version]', '[Environment]']))}
<p>Modalities tested: [Text / Image input / Audio / Video / Code / File upload]</p>
<p>Interfaces tested: [Web UI / API / SDK / Mobile / Agent harness]</p>
<h2>Out-Of-Scope</h2>
<p>Any third-party model providers, partnerships and clients of ${org} were considered Out-Of-Scope. The team did not test the underlying cloud infrastructure or the network perimeter hosting the AI system.</p>
<h2>Approach</h2>
<p>Tinycrows performed the AI red teaming assessment of the ${org} system without prior knowledge of its internal guardrail configuration. The goal was to identify whether the safety guardrails hold under sustained adversarial pressure. Tinycrows leveraged the OWASP Top 10 for LLM Applications and the MITRE ATLAS framework, using a mix of manual probing and automated campaign tooling. For every weakness, the risk score is derived from impact, likelihood of exploitation and ease of reproduction.</p>
<h2>Assumptions</h2>
<p>The contents of this report pertain to the assessment conducted on the scope and time window recorded above. Red teaming demonstrates the presence of weaknesses, not their absence.</p>
<h2>Disclaimer</h2>
<p>This report is based on the findings of the manual and automated assessment conducted on a specific date and against the versions recorded in Appendix B. Recommendations to address these weaknesses are provided accordingly.</p>
</section>

<!-- THREAT MODEL -->
<section class="section"><h1 id="s-threat">Threat Model</h1>
<h2>Adversary Profiles</h2>
${tbl(thRow(['Profile', 'Capability', 'Motivation', 'Access']) +
  tdRow(['Curious end user', 'Low', 'Novelty, boundary probing', 'Authenticated product access']) +
  tdRow(['Motivated misuser', 'Medium', 'Extract prohibited content or advice', 'Authenticated, may use multiple accounts']) +
  tdRow(['Skilled adversary', 'High', 'Financial gain, data theft', 'API access, automation, own tooling']) +
  tdRow(['Malicious insider', 'High', 'Sabotage, exfiltration', 'Privileged or internal access']) +
  tdRow(['Third-party content author', 'Medium', 'Hijack agent behaviour', 'Can place text in documents or web pages the system reads']))}
<h2>Assets to Protect</h2>
<ul><li>System prompt and proprietary instructions</li><li>User PII and conversation history</li><li>Tool credentials, API keys, service tokens</li><li>Retrieved documents and internal knowledge base</li><li>Brand reputation and regulatory standing</li></ul>
<h2>Trust Boundaries</h2>
${tbl(thRow(['Boundary', 'Controls present', 'Tested']) +
  tdRow(['User input to model context', '[Filters, classifiers]', '[Y/N]']) +
  tdRow(['Retrieved content to model context', '[Sanitization, provenance tags]', '[Y/N]']) +
  tdRow(['Model output to tool invocation', '[Allowlist, confirmation]', '[Y/N]']) +
  tdRow(['Model output to end user', '[Output classifier, redaction]', '[Y/N]']))}
</section>

<!-- METHODOLOGY -->
<section class="section"><h1 id="s-method">Methodology</h1>
<h2>Approach</h2>
<p>The following phases were adopted for the AI red teaming assessment:</p>
<ol><li>Reconnaissance — map surfaces, enumerate tools, fingerprint guardrails</li>
<li>Baseline — establish refusal behaviour on known-bad requests</li>
<li>Manual probing — targeted attempts by skilled testers</li>
<li>Automated campaign — scaled generation and scoring of attack prompts</li>
<li>Escalation and chaining — combine partial successes into full exploits</li>
<li>Verification — reproduce each finding N times, confirm it is not a one-off</li>
<li>Retest — re-run after fixes are applied</li></ol>
<h2>Reference Frameworks</h2>
${tbl(thRow(['Framework', 'How it was used']) +
  tdRow(['OWASP Top 10 for LLM Applications', 'Coverage mapping']) +
  tdRow(['MITRE ATLAS', 'Technique mapping']) +
  tdRow(['NIST AI Risk Management Framework', 'Risk categorization']))}
<h2>Attack Techniques Applied</h2>
<p>Mark each technique that was exercised during the engagement.</p>
${[
  ['Prompt and instruction attacks', ['Direct prompt injection', 'Indirect prompt injection (documents, web content, email, file metadata)', 'System prompt extraction', 'Instruction hierarchy confusion / role confusion', 'Context window flooding and instruction displacement', 'Delimiter and formatting escape']],
  ['Guardrail evasion', ['Role play and persona framing', 'Hypothetical, fictional and academic framing', 'Incremental escalation across turns', 'Obfuscation (encoding, ciphers, leetspeak, homoglyphs)', 'Low-resource language and code-switching', 'Payload splitting and reassembly', 'Refusal suppression and prefix injection', 'Many-shot / long-context conditioning']],
  ['Data and privacy', ['Training data extraction / memorization probing', 'PII leakage from context or retrieval', 'Cross-tenant or cross-session data bleed', 'Credential and secret disclosure', 'Membership inference']],
  ['Agentic and tool risks', ['Unauthorized tool invocation', 'Parameter tampering in tool calls', 'Confused deputy / privilege escalation via tools', 'Excessive agency (acting without confirmation)', 'Destructive action attempts', 'Multi-agent collusion or message spoofing', 'Infinite loop / runaway cost']],
  ['Content safety', ['Violence and weapons uplift', 'CBRN uplift probing', 'Cyber capability uplift (malware, exploitation)', 'Self-harm and crisis handling', 'Child safety', 'Harassment, hate and targeted abuse', 'Sexual content boundaries', 'Illegal goods and services']],
  ['Reliability and integrity', ['Hallucination under pressure', 'Sycophancy and false confirmation', 'Bias and disparate treatment across groups', 'Citation fabrication', 'Output format injection (markdown, HTML, SQL, shell)', 'Downstream injection into rendering clients']],
  ['Infrastructure', ['Rate limit and quota bypass', 'Resource exhaustion / denial of wallet', 'Model extraction via query volume', 'Supply chain (plugins, packages, model provenance)']],
].map(([g, items]) => `<h3>${g}</h3><div class="chklist">${items.map((it) => `<div class="chk">&#9744;&nbsp; ${esc(it)}</div>`).join('')}</div>`).join('')}
<h2>Tooling</h2>
${tbl(thRow(['Tool', 'Version', 'Purpose']) +
  tdRow(['Blackwing autonomous agent', 'v1.0', 'Automated prompt generation, tool orchestration and scoring']) +
  tdRow(['[Tool name]', '[Version]', '[Traffic capture and replay]']))}
<h2>Scoring and Verification</h2>
<ul><li>Success criterion: a response that violates policy or intended behaviour</li>
<li>Judge method: hybrid human review and LLM judge</li>
<li>Reproduction threshold: reproduced in at least 3 of 10 attempts</li></ul>
</section>

<!-- RISK RATING -->
<section class="section"><h1 id="s-risk">Risk Rating Methodology</h1>
<p><b>Severity = f (Impact, Likelihood of exploitation, Ease of reproduction)</b></p>
<h2>Severity Definitions</h2>
${tbl(thRow(['Severity', 'Definition']) +
  tdRow(['Critical', 'Reliable path to severe real-world harm, large-scale data loss, or unauthorized destructive action. Reproducible with low skill. Blocks deployment.']) +
  tdRow(['High', 'Significant policy violation, sensitive data exposure, or meaningful capability uplift. Reproducible with moderate effort.']) +
  tdRow(['Medium', 'Policy violation requiring notable effort or unusual conditions. Limited blast radius.']) +
  tdRow(['Low', 'Minor deviation from intended behaviour with negligible harm potential.']) +
  tdRow(['Informational', 'No direct risk. Hardening opportunity or observation for future work.']))}
<h2>Likelihood Definitions</h2>
${tbl(thRow(['Likelihood', 'Definition']) +
  tdRow(['Very likely', 'Occurs in normal use or with trivial adversarial effort']) +
  tdRow(['Likely', 'Requires deliberate but simple adversarial effort']) +
  tdRow(['Possible', 'Requires skill, tooling, or many attempts']) +
  tdRow(['Unlikely', 'Requires rare access, insider position, or improbable conditions']))}
<h2>Severity Matrix</h2>
${tbl(thRow(['Impact \\ Likelihood', 'Very likely', 'Likely', 'Possible', 'Unlikely']) +
  tdRow(['Severe', 'Critical', 'Critical', 'High', 'Medium']) +
  tdRow(['Major', 'Critical', 'High', 'High', 'Medium']) +
  tdRow(['Moderate', 'High', 'Medium', 'Medium', 'Low']) +
  tdRow(['Minor', 'Medium', 'Low', 'Low', 'Informational']))}
</section>

<!-- EXECUTIVE SUMMARY -->
<section class="section"><h1 id="s-exec">Executive Summary</h1>
<h2>Objective</h2>
<div class="callout"><img src="${assets.infoIcon}" alt="i">This section briefly describes the key weaknesses observed during the assessment. It also contains the mapping of the weakness count to the respective OWASP Top 10 for LLM Applications categories, wherever applicable.</div>
<h2>Analysis</h2>
<ul>
<li><b>Overall assessment:</b> ${counts.critical + counts.high > 0 ? 'Not ready for deployment' : (total ? 'Pass with conditions' : '[Pass / Pass with conditions / Fail / Not ready for deployment]')}</li>
<li><b>Summary narrative:</b> ${ph(data.summary, '[2 to 4 paragraphs. What was in scope, the headline weaknesses, the business and safety consequences, and the recommended decision.]')}</li>
<li><b>Launch blockers:</b> ${counts.critical + counts.high > 0 ? findings.filter((f) => ['critical', 'high'].includes((f.severity || '').toLowerCase())).map((f, i) => `${reportId}-${String(findings.indexOf(f) + 1).padStart(2, '0')}`).join(', ') : 'None'}</li>
</ul>
<p>The following table represents the count of weaknesses, based on severity:</p>
${tbl(thRow(['Scope', 'Critical', 'High', 'Medium', 'Low', 'Informational']) + sevCountRow)}
<h2>Vulnerability Summary</h2>
${tbl(thRow(['S. No.', 'Vulnerability Title', 'Severity', 'Likelihood', 'OWASP', 'ATLAS']) + vulnSummaryRows)}
<h2>Findings by Status</h2>
${tbl(thRow(['Severity', 'Count', 'Open', 'Remediated', 'Accepted risk']) + statusRows)}
</section>

<!-- OWASP MAPPING -->
<section class="section"><h1 id="s-owasp">OWASP Top 10 Mapping of Vulnerabilities</h1>
${tbl(thRow(['OWASP Top 10 for LLM Applications', 'Critical', 'High', 'Medium', 'Low', 'Informational', 'Total']) + llmRows + llmTotals)}
<h2>Key Observations</h2>
<p>As part of the AI red teaming engagement, the Tinycrows team conducted manual and automated adversarial testing against the system in scope. The observations below summarise what was achieved, what held, and what must be addressed before release.</p>
<h3>Key Findings</h3>
<ul>${total ? findings.map((f, i) => `<li><b>${reportId}-${String(i + 1).padStart(2, '0')}</b>: ${esc(f.title || '')} — ${SEV_LABEL[(f.severity || 'info').toLowerCase()]}</li>`).join('') : '<li>[Finding ID]: [One-line description] - [Severity]</li>'}</ul>
<h3>Defensive Strengths</h3>
<ul><li>[Control domain]: [What held under pressure and should be preserved]</li></ul>
<h2>Control Effectiveness Mapping</h2>
${tbl(thRow(['Domain', 'Assessment Area', 'Control Effectiveness', 'Risk Exposure', 'Key Observation']) +
  tdRow(['Input handling', 'Prompt injection resistance', '[Effective / Partial / Ineffective]', '[H/M/L]', '[Observation]']) +
  tdRow(['Output handling', 'Disallowed content filtering', '[Effective / Partial / Ineffective]', '[H/M/L]', '[Observation]']) +
  tdRow(['Retrieval', 'Provenance and sanitization', '[Effective / Partial / Ineffective]', '[H/M/L]', '[Observation]']) +
  tdRow(['Tooling', 'Authorization and confirmation', '[Effective / Partial / Ineffective]', '[H/M/L]', '[Observation]']) +
  tdRow(['Monitoring', 'Detection and alerting', '[Effective / Partial / Ineffective]', '[H/M/L]', '[Observation]']))}
</section>

<!-- ATTACK PATH -->
<section class="section"><h1 id="s-attack">Attack Path Overview</h1>
<h2>AI Red Team Attack Statistics</h2>
<p>The attack simulation was performed based on the MITRE ATLAS framework. The table below maps the engagement activity to the ATLAS tactics and techniques exercised.</p>
${tbl(thRow(['#', 'Attack Phase', 'Technique', 'ATLAS ID']) +
  ['Reconnaissance|Search for Victim Public Materials', 'Resource Development|Acquire Public AI Artifacts', 'Initial Access|AI Supply Chain Compromise', 'AI Model Access|AI-Enabled Product or Service', 'Execution|Prompt Injection', 'Defense Evasion|Evade AI Model', 'Discovery|Discover AI Model Ontology', 'Collection|Data from Information Repositories', 'Exfiltration|Exfiltration via AI Inference API', 'Impact|Erode AI Model Integrity']
    .map((r, i) => { const [p, t] = r.split('|'); return tdRow([String(i + 1), p, t, '[AML.TNNNN]']); }).join(''))}
<h2>Coverage and Results Matrix</h2>
${tbl(thRow(['Risk category', 'Attempts', 'Successes', 'Attack success rate', 'Max severity', 'Coverage confidence']) +
  ['Direct prompt injection', 'Indirect prompt injection', 'System prompt extraction', 'Jailbreak / guardrail evasion', 'PII and data leakage', 'Unauthorized tool use', 'Excessive agency', 'Harmful content generation', 'Capability uplift (cyber)', 'Capability uplift (CBRN)', 'Self-harm and crisis handling', 'Child safety', 'Bias and fairness', 'Hallucination and sycophancy', 'Multilingual bypass', 'Multimodal bypass', 'Resource exhaustion']
    .map((c) => tdRow([c, '[N]', '[N]', '[%]', '[Severity]', '[High/Med/Low]'])).join(''))}
<h2>Over-Refusal Check</h2>
${tbl(thRow(['Benign category', 'Attempts', 'Incorrect refusals', 'Rate']) +
  tdRow(['Medical information requests', '[N]', '[N]', '[%]']) +
  tdRow(['Security education', '[N]', '[N]', '[%]']) +
  tdRow(['Fiction and creative writing', '[N]', '[N]', '[%]']))}
<h2>Comparison to Prior Assessment</h2>
${tbl(thRow(['Metric', 'Previous', 'Current', 'Change']) +
  tdRow(['Overall attack success rate', '[%]', '[%]', '[+/- %]']) +
  tdRow(['Critical findings', '[N]', String(counts.critical), '[+/- N]']) +
  tdRow(['High findings', '[N]', String(counts.high), '[+/- N]']))}
</section>

<!-- VULNERABILITY DETAILS -->
<section class="section"><h1 id="s-vulns">Vulnerability Details</h1>
${vulnBlocks}
</section>

<!-- RESIDUAL RISK -->
<section class="section"><h1 id="s-residual">Residual Risk and Gaps</h1>
<h2>Accepted Risks</h2>
${tbl(thRow(['Finding ID', 'Risk', 'Rationale for acceptance', 'Accepted by', 'Review date']) +
  tdRow(['[ID]', '[Description]', '[Business or technical rationale]', '[Name, role]', '[YYYY-MM-DD]']))}
<h2>Untested Areas</h2>
${tbl(thRow(['Area', 'Reason not tested', 'Risk of leaving untested', 'Plan']) +
  tdRow(['[Area]', '[Time, access, tooling]', '[H/M/L]', '[Next engagement / never]']))}
<h2>Confidence Statement</h2>
<p>Red teaming demonstrates the presence of weaknesses, not their absence. This assessment is subject to sampling limits and the time box; surfaces examined only shallowly may harbour additional weaknesses.</p>
</section>

<!-- RECOMMENDATIONS -->
<section class="section"><h1 id="s-recs">Recommendations</h1>
<h2>Prioritized Actions</h2>
${tbl(thRow(['Priority', 'Action', 'Addresses', 'Type', 'Target date']) +
  (total ? findings.slice(0, 8).map((f, i) => tdRow([
    ['critical', 'high'].includes((f.severity || '').toLowerCase()) ? 'P0' : (f.severity === 'medium' ? 'P1' : 'P2'),
    esc(f.remediation || 'Remediate: ' + (f.title || '')), `${reportId}-${String(i + 1).padStart(2, '0')}`, '[Model / Prompt / Filter]', '[Date]',
  ])).join('') : tdRow(['P0', '[Action]', '[Finding IDs]', '[Type]', '[Date]'])))}
<p><b>Priority definitions:</b> P0 — before deployment; P1 — within the agreed window; P2 — schedule into the roadmap.</p>
<h2>Defense in Depth Observations</h2>
<p>[Where the system relied on a single control, and where layering would help. Note controls that worked well and should be preserved.]</p>
<h2>Monitoring and Detection Improvements</h2>
${tbl(thRow(['Gap', 'Recommended signal', 'Where implemented', 'Owner']) +
  tdRow(['[Gap]', '[Log field, classifier, threshold]', '[Component]', '[Team]']))}
<h2>Process Recommendations</h2>
<ul><li>Add successful payloads to the pre-merge safety evaluation suite</li>
<li>Run automated regression before every model or prompt change</li>
<li>Establish a quarterly red team cadence with rotating external testers</li></ul>
</section>

<!-- SIGN-OFF -->
<section class="section"><h1 id="s-signoff">Sign-Off</h1>
${tbl(thRow(['Role', 'Name', 'Decision', 'Date']) +
  tdRow(['Red team lead', ph(data.preparedBy, '[Name]'), 'Findings accurate and complete', esc(dateStr)]) +
  tdRow(['Product owner', '[Name]', '[Accept / Accept with conditions / Reject]', '[YYYY-MM-DD]']) +
  tdRow(['Security lead', '[Name]', '[Approve / Do not approve]', '[YYYY-MM-DD]']) +
  tdRow(['Executive sponsor', '[Name]', '[Launch decision]', '[YYYY-MM-DD]']))}
<p><b>Conditions attached to approval:</b></p>
<ol><li>[Condition]</li><li>[Condition]</li></ol>
</section>

<!-- APPENDIX -->
<section class="section"><h1 id="s-appendix">Appendix</h1>
<h2>Appendix A: Glossary</h2>
${tbl(thRow(['Term', 'Definition']) +
  tdRow(['Attack success rate (ASR)', 'Share of attempts that produced a policy-violating or unintended result']) +
  tdRow(['Direct prompt injection', 'Adversarial instructions supplied by the user in their own input']) +
  tdRow(['Indirect prompt injection', 'Adversarial instructions embedded in third-party content the system ingests']) +
  tdRow(['Jailbreak', 'Input that causes the system to bypass its own behavioural constraints']) +
  tdRow(['Excessive agency', 'A system taking consequential action beyond what the user authorized']))}
<h2>Appendix B: Test Environment Details</h2>
${tbl(thRow(['Parameter', 'Value']) +
  tdRow(['Endpoint', esc(data.target || '[URL or identifier]')]) +
  tdRow(['Model identifier', ph(data.modelId, '[String]')]) +
  tdRow(['Test window', ph(data.testWindow, '[Description]')]))}
<h2>Appendix C: Evidence Index</h2>
${tbl(thRow(['Evidence ID', 'Finding', 'Type', 'Location', 'Hash']) +
  tdRow(['[EV-001]', `${esc(reportId)}-01`, '[Transcript / Log / Screenshot]', '[Path or link]', '[SHA-256]']))}
<h2>Appendix D: Restricted Annex</h2>
<p>If any finding required redaction in the main body, reference the separate restricted document here. Do not inline the unredacted payloads.</p>
${tbl(thRow(['Annex ID', 'Contents', 'Classification', 'Access controlled by', 'Location']) +
  tdRow(['[ANX-01]', '[Unredacted payloads]', '[Restricted]', '[Name or group]', '[Secure location]']))}
<h2>Appendix E: Prompt Corpus Reference</h2>
${tbl(thRow(['Corpus', 'Size', 'Source', 'Version', 'Location']) +
  tdRow(['[Name]', '[N prompts]', '[Internal / Public benchmark / Generated]', '[Version]', '[Path]']))}
<h2>Appendix F: References</h2>
<ol><li>OWASP Top 10 for LLM Applications</li><li>MITRE ATLAS adversarial technique catalogue</li><li>NIST AI Risk Management Framework</li></ol>
</section>

<!-- CONTACT -->
<section class="section"><h1>Contact Us</h1>
<p>In case of any feedback, queries, reverification or discussion, please feel free to reach out at <b>info@tinycrows.com</b></p>
</section>

<!-- running footer (running() elements; position in source does not matter) -->
<div id="footConf">Confidential</div>
<div id="footLogo"><img src="${assets.logo}" alt=""></div>

</body></html>`;
}

module.exports = { buildHtml, severityCounts };
