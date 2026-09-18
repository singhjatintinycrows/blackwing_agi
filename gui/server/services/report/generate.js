'use strict';
/*
 * Renders the Blackwing AI Red Teaming Report to a PDF buffer.
 * Pipeline: template.js -> HTML -> Paged.js (CSS Paged Media: page numbers,
 * running Confidential+logo footer, TOC leaders) -> headless Chromium -> PDF.
 */
const fs = require('fs');
const path = require('path');
const { buildHtml } = require('./template');

const ASSETS = path.join(__dirname, 'assets');
const dataUri = (file, mime) =>
  `data:${mime};base64,` + fs.readFileSync(path.join(ASSETS, file)).toString('base64');

function loadAssets() {
  return {
    cover: dataUri('cover-art.png', 'image/png'),
    logo: dataUri('tinycrows-logo.png', 'image/png'),
    infoIcon: dataUri('info-icon.png', 'image/png'),
    fonts: {
      carlito: dataUri('fonts/carlito-latin-400-normal.woff2', 'font/woff2'),
      carlitoBold: dataUri('fonts/carlito-latin-700-normal.woff2', 'font/woff2'),
      carlitoItalic: dataUri('fonts/carlito-latin-400-italic.woff2', 'font/woff2'),
      poppins600: dataUri('fonts/poppins-latin-600-normal.woff2', 'font/woff2'),
      poppins700: dataUri('fonts/poppins-latin-700-normal.woff2', 'font/woff2'),
    },
  };
}

let _browser = null;
async function getBrowser() {
  if (_browser && _browser.isConnected()) return _browser;
  const puppeteer = require('puppeteer');
  _browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  return _browser;
}

/**
 * @param {object} data  report data (org, findings, summary, …)
 * @returns {Promise<Buffer>} the PDF
 */
async function generateReportPdf(data) {
  const assets = loadAssets();
  let html = buildHtml(data, assets);
  // Load Paged.js in manual mode so we can await pagination before printing.
  const pagedSrc = fs.readFileSync(path.join(ASSETS, 'paged.polyfill.min.js'), 'utf8');
  html = html.replace('</head>', '<script>window.PagedConfig={auto:false};</script></head>');

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.addScriptTag({ content: pagedSrc });
    await page.evaluate(async () => {
      // Paginate; resolves once all pages (and TOC target-counters) are laid out.
      await window.PagedPolyfill.preview();
    });
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    // Puppeteer v24 returns a Uint8Array; wrap so express res.send() streams it
    // as binary rather than JSON-serialising it.
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}

async function closeBrowser() { if (_browser) { await _browser.close().catch(() => {}); _browser = null; } }

module.exports = { generateReportPdf, loadAssets, closeBrowser };
