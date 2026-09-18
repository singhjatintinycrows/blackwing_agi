'use strict';
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const rawPath = process.env.DB_PATH || 'data/darkwing.db';
const DB_PATH = path.isAbsolute(rawPath)
  ? rawPath
  : path.join(__dirname, '..', '..', rawPath);

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Compatibility shim: wrap fn in BEGIN/COMMIT/ROLLBACK, matching better-sqlite3's API
db.transaction = function transaction(fn) {
  return function (...args) {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch {}
      throw e;
    }
  };
};

// Seed a default admin the first time the database is created, so the operator
// can sign in immediately. Change the password from Settings (or via env) after.
try {
  const bcrypt = require('bcryptjs');
  const adminEmail = process.env.BLACKWING_ADMIN_EMAIL || 'admin@tinycrows.com';
  const adminPass = process.env.BLACKWING_ADMIN_PASSWORD || 'blackwing';
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!exists) {
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(adminEmail, 'Administrator', hash, 'admin');
    console.log(`[blackwing] seeded default user ${adminEmail} (change the password after first login)`);
  }
} catch (e) {
  console.error('[blackwing] could not seed default user:', e.message);
}

module.exports = db;
