const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data.sqlite');

// Ensure data directory exists (here we just use project root)
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function init() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN','USER')),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE','BANNED')),
    createdAt TEXT NOT NULL,
    dailyLimit INTEGER NOT NULL DEFAULT 100,
    usedToday INTEGER NOT NULL DEFAULT 0,
    lastUsageReset TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    action TEXT,
    amount INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS image_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING','RUNNING','COMPLETED','FAILED')),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    failureReason TEXT,
    payload TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS system (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  // Seed admin and few sample users and jobs if empty
  const userCount = await get('SELECT COUNT(*) as c FROM users');
  if (!userCount || userCount.c === 0) {
    const now = new Date().toISOString();
    const admin = await run(
      `INSERT INTO users (email, role, status, createdAt, dailyLimit, usedToday, lastUsageReset)
       VALUES (?, 'ADMIN', 'ACTIVE', ?, 1000, 0, date('now'))`,
      ['admin@example.com', now]
    );

    for (let i = 1; i <= 10; i++) {
      await run(
        `INSERT INTO users (email, role, status, createdAt, dailyLimit, usedToday, lastUsageReset)
         VALUES (?, 'USER', 'ACTIVE', ?, 100, ?, date('now'))`,
        [`user${i}@example.com`, now, Math.floor(Math.random() * 50)]
      );
    }

    // Seed some usage logs and jobs
    const users = await all('SELECT id FROM users WHERE role = "USER"');
    for (const u of users) {
      for (let j = 0; j < 3; j++) {
        await run(
          `INSERT INTO usage_logs (userId, action, amount, createdAt) VALUES (?,?,?,?)`,
          [u.id, 'generate_image', 1, new Date(Date.now() - Math.random()*86400000).toISOString()]
        );
      }
      for (let j = 0; j < 5; j++) {
        const statusOptions = ['PENDING','COMPLETED','FAILED'];
        const status = statusOptions[Math.floor(Math.random()*statusOptions.length)];
        const created = new Date(Date.now() - Math.random()*86400000);
        const updated = new Date(created.getTime() + Math.floor(Math.random()*3600000));
        await run(
          `INSERT INTO image_jobs (userId, status, createdAt, updatedAt, failureReason, payload) VALUES (?,?,?,?,?,?)`,
          [u.id, status, created.toISOString(), updated.toISOString(), status==='FAILED'?'Random failure':null, JSON.stringify({prompt: 'a cat', size: '512x512'})]
        );
      }
    }
  }
}

async function setSystem(key, value) {
  await run(`INSERT INTO system(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, [key, value]);
}

async function getSystem(key) {
  const row = await get('SELECT value FROM system WHERE key=?', [key]);
  return row ? row.value : null;
}

module.exports = {
  db,
  run,
  get,
  all,
  init,
  setSystem,
  getSystem,
};
