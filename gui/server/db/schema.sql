-- Users
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'analyst',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id           INTEGER PRIMARY KEY,
  run_id       TEXT UNIQUE NOT NULL,
  user_id      INTEGER REFERENCES users(id),
  app_name     TEXT,
  target       TEXT NOT NULL,
  config_json  TEXT,
  status       TEXT NOT NULL DEFAULT 'running',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id            INTEGER PRIMARY KEY,
  assessment_id INTEGER REFERENCES assessments(id),
  title         TEXT,
  summary       TEXT,
  raw_log       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Findings
CREATE TABLE IF NOT EXISTS findings (
  id            INTEGER PRIMARY KEY,
  report_id     INTEGER REFERENCES reports(id),
  assessment_id INTEGER REFERENCES assessments(id),
  severity      TEXT,
  category      TEXT,
  title         TEXT,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'open',
  remediation   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tools
CREATE TABLE IF NOT EXISTS tools (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT,
  description TEXT,
  config_json TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
