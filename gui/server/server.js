'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const agent = require('./services/agent');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth',                 require('./routes/auth'));
app.use('/api/assessments',          require('./routes/assessments'));
app.use('/api/validate-credentials', require('./routes/credentials'));
app.use('/api/reports',              require('./routes/reports'));
app.use('/api/vulns',                require('./routes/vulns'));
app.use('/api/tools',                require('./routes/tools'));

// Serve built React SPA in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

function shutdown() {
  agent.shutdown();
  try { require('./services/report/generate').closeBrowser(); } catch {}
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(PORT, () => {
  console.log(`Blackwing GUI server listening on http://localhost:${PORT}`);
});
