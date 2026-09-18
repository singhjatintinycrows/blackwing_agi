'use strict';
/*
 * Builds the Blackwing "Website Assessment — Internal Grey Box Pentesting Report"
 * HTML — a faithful reproduction of the Tinycrows web-app pentest report. Used
 * for web-application targets (the AI Red Teaming template is used for AI/LLM
 * targets). Rendered to PDF by generate.js.
 */

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const SEV_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Informational' };
// Approximate CVSS base score by severity when the finding has no explicit score.
const SEV_CVSS = { critical: '9.1', high: '7.5', medium: '5.3', low: '3.1', info: '0.0' };
const WEB_TOP10 = [
  ['A01:2025', 'Broken Access Control'], ['A02:2025', 'Security Misconfiguration'],
  ['A03:2025', 'Software Supply Chain Failures'], ['A04:2025', 'Cryptographic Failures'],
  ['A05:2025', 'Injection'], ['A06:2025', 'Insecure Design'],
  ['A07:2025', 'Authentication Failures'], ['A08:2025', 'Software or Data Integrity Failures'],
  ['A09:2025', 'Security Logging and Alerting Failures'], ['A10:2025', 'Mishandling of Exceptional Conditions'],
];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const ph = (v, placeholder) => (v == null || v === '' ? placeholder : esc(v));

function severityCounts(findings) {
  const c = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) { const s = (f.severity || 'info').toLowerCase(); if (c[s] != null) c[s]++; }
  return c;
}

function buildWebHtml(data, assets) {
  const findings = data.findings || [];
  const counts = severityCounts(findings);
  const total = findings.length;
  const org = data.org || '[Organization Name]';
  const site = data.target || '[website]';
  const dateStr = data.date || new Date().toISOString().slice(0, 10);

  const fontFaces = `
    @font-face{font-family:'Carlito';font-weight:400;font-style:normal;src:url('${assets.fonts.carlito}') format('woff2')}
    @font-face{font-family:'Carlito';font-weight:700;font-style:normal;src:url('${assets.fonts.carlitoBold}') format('woff2')}
    @font-face{font-family:'Carlito';font-weight:400;font-style:italic;src:url('${assets.fonts.carlitoItalic}') format('woff2')}
    @font-face{font-family:'Poppins';font-weight:600;font-style:normal;src:url('${assets.fonts.poppins600}') format('woff2')}
    @font-face{font-family:'Poppins';font-weight:700;font-style:normal;src:url('${assets.fonts.poppins700}') format('woff2')}
  `;

  const tbl = (rows) => `<table>${rows}</table>`;
  const thRow = (cells) => `<tr>${cells.map((c) => `<th>${c}</th>`).join('')}</tr>`;
  const tdRow = (cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;

  const cvssOf = (f) => f.cvss || SEV_CVSS[(f.severity || 'info').toLowerCase()] || '0.0';

  // Executive summary tables
  const sevCountRow = tdRow([esc(site),
    String(counts.critical), String(counts.high), String(counts.medium), String(counts.low), String(counts.info)]);
  const vulnSummaryRows = total
    ? findings.map((f, i) => tdRow([
        String(i + 1), esc(f.title || '[Vulnerability Title]'), cvssOf(f),
        SEV_LABEL[(f.severity || 'info').toLowerCase()] || '[Severity]',
        esc(f.owasp || f.category || '—'), esc(f.cwe || (String(f.category || '').startsWith('CWE') ? f.category : '—')),
      ])).join('')
    : tdRow(['1', '[Vulnerability Title]', '[Score]', '[Severity]', '[OWASP]', '[CWE]']);

  // OWASP web Top 10 mapping counts
  const map = {};
  for (const [id] of WEB_TOP10) map[id] = 0;
  for (const f of findings) {
    const m = String(f.owasp || f.category || '').match(/A0?(\d0?):20\d\d/i);
    if (m) { const id = 'A' + m[1].padStart(2, '0') + ':2025'; if (map[id] != null) map[id]++; }
  }
  const owaspRows = WEB_TOP10.map(([id, name]) => tdRow([`${id} — ${name}`, String(map[id] || 0)])).join('');

  // Vulnerability detail blocks
  const vulnBlocks = total ? findings.map((f, i) => {
    const sev = SEV_LABEL[(f.severity || 'info').toLowerCase()] || 'Informational';
    return `
    <div class="finding">
      <div class="finding-bar">${i + 1}.&nbsp; <span class="finding-title">[${sev}] ${esc(f.title || '[Vulnerability Title]')}</span></div>
      <p><b>Overview:</b> ${ph(f.description, '[Description of the weakness observed during the assessment.]')}</p>
      <p><b>Potential Impact:</b> This vulnerability can potentially lead to:</p>
      <ul>${(f.impacts && f.impacts.length ? f.impacts : [f.impact || '[Impact]']).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p><b>CVSS Score:</b> ${cvssOf(f)} (${sev})</p>
      <p><b>CVSS Vector:</b> ${ph(f.cvssVector, '[AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N]')}</p>
      <p><b>Affected Location(s):</b> ${ph(f.component || f.location, esc(site))}</p>
      <p><b>OWASP Mapping:</b> ${ph(f.owasp || (String(f.category || '').match(/A|API/i) ? f.category : ''), '[OWASP Top 10 mapping]')}</p>
      <p><b>CWE Mapping:</b> ${ph(f.cwe || (String(f.category || '').startsWith('CWE') ? f.category : ''), '[CWE-NNN]')}</p>
      <p><b>Steps to Reproduce (with PoC):</b></p>
      <ol>${(f.steps && f.steps.length ? f.steps : ['[Step]', '[Step]', '[Step]']).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <p><b>Recommendations:</b> It is recommended to implement the following:</p>
      <ul>${(f.recommendations && f.recommendations.length ? f.recommendations : [f.remediation || '[Specific, testable remediation]']).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <p><b>References:</b> ${ph(f.references, '[Relevant references]')}</p>
    </div>`;
  }).join('') : `<p class="muted">No vulnerabilities were recorded for this assessment.</p>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Website Assessment Report</title>
<style>
${fontFaces}
:root{ --red:#e63947; --crimson:#e63947; --ink:#16171d; --gray-h:#4c483d; --bar:#d8d8d8; --border:#b9b9b9; }
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; }
body{ font-family:'Carlito', Calibri, sans-serif; font-size:10.5pt; line-height:1.4; color:var(--ink); }
@page{
  size: Letter; margin: 24mm 18mm 20mm 18mm;
  @top-left{ content: element(hdrConf); }
  @top-right{ content:"Page " counter(page) " of " counter(pages); font-family:'Carlito'; font-size:9.5pt; color:#333; }
  @bottom-left{ content: element(footConf); }
  @bottom-right{ content: element(footLogo); }
}
h1{ font-family:'Carlito'; font-weight:700; font-size:21pt; margin:0 0 3pt; padding-bottom:6pt; border-bottom:1px solid #d9d9d9; }
h2{ font-family:'Carlito'; font-weight:700; font-size:12.5pt; margin:13pt 0 4pt; }
h3{ font-weight:700; font-size:11pt; margin:9pt 0 3pt; }
p{ margin:5pt 0; } ul,ol{ margin:5pt 0 6pt 16pt; padding:0; } li{ margin:2pt 0; }
table{ width:100%; border-collapse:collapse; margin:6pt 0 10pt; font-size:9.5pt; }
th{ background:var(--red); color:#fff; font-weight:700; text-align:left; padding:4pt 7pt; border:1px solid var(--red); }
td{ border:1px solid var(--border); padding:4pt 7pt; vertical-align:top; }
.section{ page-break-before: always; }
.finding{ margin:12pt 0; }
.finding-bar{ background:var(--bar); font-weight:700; padding:4pt 8pt; break-after: avoid; }
.finding-title{ color:#111; }
.muted{ color:#555; }
h1,h2,h3{ break-after: avoid; }
#hdrConf{ position: running(hdrConf); font-family:'Carlito'; font-size:9.5pt; color:var(--red); font-weight:700; letter-spacing:.5px; }
#footConf{ position: running(footConf); font-family:'Poppins'; font-weight:700; color:var(--crimson); font-size:11pt; }
#footLogo{ position: running(footLogo); } #footLogo img{ height:24pt; }
.cover{ break-after: page; }
.cover-grid{ display:flex; height:236mm; }
.cover-art{ flex:0 0 48mm; } .cover-art img{ display:block; width:48mm; height:236mm; object-fit:cover; object-position:top center; }
.cover-body{ flex:1 1 auto; padding-left:14mm; }
.cover-title{ font-family:'Carlito'; font-weight:700; color:var(--red); font-size:40pt; line-height:1.12; margin-top:8mm; }
.box{ border:1px solid #333; padding:10pt 12pt; margin:14pt 0; }
.box h3{ color:var(--gray-h); font-size:12.5pt; margin:0 0 6pt; }
.toc a{ display:flex; align-items:baseline; color:inherit; text-decoration:none; }
.toc .t{ order:1; } .toc .l{ order:2; flex:1; border-bottom:1px dotted #999; margin:0 4px 3px; }
.toc a::after{ order:3; content: target-counter(attr(href), page); }
.toc .lvl2{ margin-left:16pt; font-size:9.5pt; }
</style></head>
<body>

<div id="hdrConf">CONFIDENTIAL</div>
<div id="footConf">CONFIDENTIAL</div>
<div id="footLogo"><img src="${assets.logo}" alt=""></div>

<section class="cover"><div class="cover-grid">
  <div class="cover-art"><img src="${assets.cover}" alt=""></div>
  <div class="cover-body">
    <div class="cover-title">${esc(org)}<br>Website Assessment<br>Internal Grey Box<br>Pentesting Report</div>
  </div>
</div></section>

<section>
  <div class="box"><h3>Private and Confidential</h3>
    <p>All Rights Reserved</p>
    <p>This report is intended solely for the information and internal use of ${esc(org)} and is not intended to be and should not be used by any other person or entity. No other person or entity is entitled to rely, in any manner, or for any purpose, on this report.</p></div>
  <div class="box" style="margin-top:200pt"><h3>Terms of Use</h3>
    <p>This Confidential Information is being provided to ${esc(org)} as a deliverable of the Security Assessment. The purpose of this report is to provide recommendations from the assessment. Each recipient agrees that, prior to reading this report, the recipient shall not distribute or use the information contained herein and any other information regarding Tinycrows Pvt. Ltd. for any purpose other than those stated.</p></div>
</section>

<section class="section"><h1 id="s-doc">Document Details</h1>
${tbl(thRow(['Document Name', 'Version', 'Date', 'Prepared By', 'Reviewed By']) +
  tdRow([`${esc(org)} Website Assessment Report`, ph(data.version, '1.0'), esc(dateStr), ph(data.preparedBy, 'Blackwing'), ph(data.reviewedBy, '[Name]')]))}
<h2 id="s-dist">Distribution List</h2>
${tbl(thRow(['Name', 'Organization', 'Designation', 'Email ID']) +
  tdRow(['[Name]', esc(org), '[Designation]', ph(data.reviewedBy, '[Email ID]')]))}
</section>

<section class="section"><h1>Contents</h1>
<div class="toc">
${[['s-doc', 'Document Details'], ['s-dist', 'Distribution List', 2], ['s-guide', 'Report Guide'], ['s-intro', 'Introduction'], ['s-method', 'Methodology'], ['s-exec', 'Executive Summary'], ['s-owasp', 'OWASP Top 10 Mapping', 2], ['s-vulns', 'Vulnerability Details'], ['s-concl', 'Conclusion']]
  .map(([id, label, lvl]) => `<a href="#${id}" class="${lvl === 2 ? 'lvl2' : ''}"><span class="t">${label}</span><span class="l"></span></a>`).join('')}
</div></section>

<section class="section"><h1 id="s-guide">Report Guide</h1>
<h2>How to read this Report?</h2>
<p>This report is split into the following sections:</p>
<p><b>Introduction:</b> Overview of the performed activity — objectives, scope, approach, assumptions, time window, terms, definitions, legends and disclaimers.</p>
<p><b>Executive Summary:</b> The key vulnerabilities observed and the mapping of vulnerability counts to the OWASP Top 10 Web Application Security Risks – 2025.</p>
<p><b>Methodology:</b> The phases employed to evaluate the security posture during the grey-box penetration test.</p>
<p><b>Vulnerability Details:</b> The detailed list of vulnerabilities found. Each is described by Vulnerability Title, Overview, Potential Impact, CVSS Score, CVSS Vector, Affected Asset(s), OWASP Rating, CWE Mapping, Recommendations, Proof of Concept and References.</p>
</section>

<section class="section"><h1 id="s-intro">Introduction</h1>
<h2>Objective</h2>
<p>${esc(org)} conducted an internal grey-box penetration test of the website (${esc(site)}) to identify security vulnerabilities, misconfigurations and weaknesses in the application's overall security posture.</p>
<h2>Scope</h2>
${tbl(thRow(['S. No', 'Application', 'URL', 'Type']) + tdRow(['1', ph(data.appName, esc(org) + ' Website'), esc(site), 'Grey Box Web Application']))}
<h2>Approach</h2>
<p>Automated and manual security testing was performed to identify vulnerabilities in the application, APIs and supporting components, in accordance with the OWASP Web Security Testing Guide (WSTG) and OWASP Top 10. All identified vulnerabilities were validated, assigned risk ratings, and accompanied by remediation recommendations.</p>
<h2>Assumptions &amp; Disclaimer</h2>
<p>This report is based on the findings of the assessment conducted on ${esc(dateStr)} against the scope above. Penetration testing demonstrates the presence of vulnerabilities, not their absence.</p>
</section>

<section class="section"><h1 id="s-method">Methodology</h1>
<h2>Approach</h2>
<p>The following approach was adopted for conducting the internal grey-box penetration test: automated and manual security testing across the application, APIs and supporting components; assessment of access control, redirect handling and clickjacking/UI protections; evaluation of rate limiting, abuse controls, bot/CAPTCHA validation and input validation; review of email authentication (SPF/DMARC), CSRF protections and information disclosure — all in accordance with the OWASP WSTG and OWASP Top 10.</p>
<h2>Reconnaissance</h2>
<p>Reconnaissance activities were conducted to understand the architecture and attack surface of the website, identifying in-scope public-facing pages, forms, APIs and exposed endpoints using automated and manual techniques.</p>
<h2>Enumeration</h2>
<p>Based on the reconnaissance results, the application's components — public-facing functionality, forms, APIs and configuration — were analysed to identify potential vulnerabilities, misconfigurations and exploitable weaknesses within the defined scope.</p>
<h2>Exploitation</h2>
<p>Identified vulnerabilities were validated through controlled exploitation, where applicable, to assess their potential impact — performed within the agreed scope in a safe and non-disruptive manner, referencing the OWASP WSTG and MITRE ATT&amp;CK framework where applicable.</p>
</section>

<section class="section"><h1 id="s-exec">Executive Summary</h1>
<h2>Objective</h2>
<p>This section briefly describes the key vulnerabilities observed during the assessment, including the mapping of vulnerability counts to the respective OWASP Top 10 Web Application Security Risks – 2025, wherever applicable.</p>
<h2>Analysis</h2>
<p>${ph(data.summary, esc(org) + ' Pvt. Ltd. has mutually agreed with the defined internal assessment scope, and the engagement is conducted under a mutual understanding within the organization.')}</p>
<p>The following table represents the count of vulnerabilities, based on severity:</p>
${tbl(thRow(['Scope', 'Critical', 'High', 'Medium', 'Low', 'Informational']) + sevCountRow)}
<h2>Vulnerability Summary</h2>
${tbl(thRow(['S. No.', 'Vulnerability Title', 'CVSS Score', 'Severity', 'OWASP', 'CWE']) + vulnSummaryRows)}
<h2 id="s-owasp">OWASP Top 10 Mapping</h2>
${tbl(thRow(['OWASP Top 10 (2025) — Web Application Security Risks', 'Count']) + owaspRows)}
</section>

<section class="section"><h1 id="s-vulns">Vulnerability Details</h1>
${vulnBlocks}
</section>

<section class="section"><h1 id="s-concl">Conclusion</h1>
<p>The assessment identified ${total} finding${total === 1 ? '' : 's'} across the in-scope web application. Prioritise remediation of the higher-severity items, then re-test to confirm closure. Penetration testing demonstrates the presence of vulnerabilities, not their absence; areas not covered in this time-boxed engagement may harbour additional weaknesses.</p>
</section>

</body></html>`;
}

module.exports = { buildWebHtml, severityCounts };
