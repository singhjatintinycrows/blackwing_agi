'use strict';
const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// The assessment engine adapter. Defaults to the bundled Blackwing→PentAGI
// bridge (a Node script). BLACKWING_AGENT_CMD/DARKWING_CMD can override it.
const AGENT_CMD = process.env.BLACKWING_AGENT_CMD || process.env.DARKWING_CMD
  || path.join(__dirname, '..', 'bin', 'blackwing-agent.js');
const MAX_CONCURRENT_RUNS = parseInt(process.env.MAX_CONCURRENT_RUNS || '5', 10);
const DARKWING_TIMEOUT_MS = parseInt(process.env.BLACKWING_TIMEOUT_MS || process.env.DARKWING_TIMEOUT_MS || '5400000', 10);

// Map<runId, { proc, clients: Set, timer, credValues, credPath, logLines: string[] }>
const runs = new Map();

const agentEmitter = new EventEmitter();

function broadcast(clients, eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try { client.write(payload); } catch {}
  });
}

function redact(line, credValues) {
  let out = line;
  credValues.forEach(val => {
    if (val.length > 2) out = out.split(val).join('[REDACTED]');
  });
  return out;
}

function classifyLine(line) {
  if (line.startsWith('[FINDING]')) return 'fd';
  if (line.startsWith('[STATUS]'))  return 'ok';
  if (line.startsWith('[THINK]'))   return 'th';
  return '';
}

function startRun(runId, { target, method, strategy, accounts, spec, restrictedPaths,
  activeStandards, selectedScope, intrusive, findingValidation, appName, devContact }) {
  if (runs.size >= MAX_CONCURRENT_RUNS) {
    throw new Error('Maximum concurrent assessments reached. Try again later.');
  }

  const credValues = [];
  if (Array.isArray(accounts)) {
    accounts.forEach(a => {
      ['pass', 'token', 'key', 'cert'].forEach(field => {
        if (a[field] && String(a[field]).trim()) credValues.push(String(a[field]));
      });
    });
  }

  const credPath = path.join(os.tmpdir(), `darkwing-creds-${runId}.json`);
  const credData = JSON.stringify({ method, strategy, accounts: accounts || [] });
  fs.writeFileSync(credPath, credData, { mode: 0o600 });

  const authStr = method + (strategy ? ':' + strategy : '');
  const standardStr = Array.isArray(activeStandards) ? activeStandards.join(',') : '';
  const scopeStr = Array.isArray(selectedScope) ? selectedScope.join(',') : '';

  const safeArgs = [
    '--target', target,
    '--auth', authStr,
    '--standard', standardStr,
    '--scope', scopeStr,
    '--run-id', runId,
    '--config', credPath,
    '--restricted', restrictedPaths || '',
  ];

  if (spec) safeArgs.push('--spec', spec);
  if (Array.isArray(accounts)) {
    accounts.forEach(a => {
      if (a.ref) safeArgs.push('--account', `${a.role}:${a.ref}`);
    });
  }
  if (intrusive) safeArgs.push('--intrusive');
  if (findingValidation) safeArgs.push('--validate-findings');

  const env = {
    ...process.env,
    DARKWING_RUN_ID: runId,
    DARKWING_APP: appName || '',
    DARKWING_CONTACT: devContact || '',
  };

  // Run a .js adapter through the current Node; otherwise exec the binary directly.
  const isJs = AGENT_CMD.endsWith('.js');
  const cmd = isJs ? process.execPath : AGENT_CMD;
  const cmdArgs = isJs ? [AGENT_CMD, 'assess', ...safeArgs] : ['assess', ...safeArgs];

  const proc = spawn(cmd, cmdArgs, {
    shell: false,
    detached: true,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const clients = new Set();
  const logLines = [];

  const timer = setTimeout(() => {
    try { proc.kill('SIGTERM'); } catch {}
  }, DARKWING_TIMEOUT_MS);

  const state = { proc, clients, timer, credValues, credPath, logLines };
  runs.set(runId, state);

  let lineBuffer = '';
  function processChunk(chunk) {
    lineBuffer += chunk.toString();
    const parts = lineBuffer.split('\n');
    lineBuffer = parts.pop();
    parts.forEach(line => {
      const safe = redact(line.trimEnd(), credValues);
      if (!safe) return;
      logLines.push(safe);
      const cls = classifyLine(safe);
      broadcast(clients, 'log', { cls, text: safe });
    });
  }

  proc.stdout.on('data', processChunk);
  proc.stderr.on('data', processChunk);

  proc.on('close', (code) => {
    if (lineBuffer.trim()) {
      const safe = redact(lineBuffer.trimEnd(), credValues);
      logLines.push(safe);
      broadcast(clients, 'log', { cls: classifyLine(safe), text: safe });
    }
    broadcast(clients, 'done', {});
    clients.forEach(client => { try { client.end(); } catch {} });
    clearTimeout(timer);
    try { fs.unlinkSync(credPath); } catch {}

    const rawLog = logLines.join('\n');
    const status = code === 0 ? 'complete' : 'error';
    agentEmitter.emit('complete', { runId, rawLog, status });
    runs.delete(runId);
  });

  proc.on('error', err => {
    broadcast(clients, 'log', { cls: '', text: 'Process error: ' + err.message });
    broadcast(clients, 'error', {});
    clients.forEach(client => { try { client.end(); } catch {} });
    clearTimeout(timer);
    try { fs.unlinkSync(credPath); } catch {}

    agentEmitter.emit('complete', { runId, rawLog: logLines.join('\n'), status: 'error' });
    runs.delete(runId);
  });
}

function abortRun(runId) {
  const state = runs.get(runId);
  if (!state) return false;
  try { state.proc.kill('SIGTERM'); } catch {}
  return true;
}

function addClient(runId, res) {
  const state = runs.get(runId);
  if (!state) return false;
  state.clients.add(res);
  return true;
}

function removeClient(runId, res) {
  const state = runs.get(runId);
  if (state) state.clients.delete(res);
}

function hasRun(runId) {
  return runs.has(runId);
}

function shutdown() {
  runs.forEach(({ proc, timer, credPath }) => {
    clearTimeout(timer);
    try { proc.kill('SIGTERM'); } catch {}
    try { fs.unlinkSync(credPath); } catch {}
  });
}

module.exports = { startRun, abortRun, addClient, removeClient, hasRun, agentEmitter, shutdown };
