const Database = require('better-sqlite3');
const { DB_PATH, DAILY_JOB_LIMIT } = require('./config');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    migrate();
  }
  return db;
}

function migrate() {
  const d = db;
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      verified INTEGER NOT NULL DEFAULT 0,
      banned INTEGER NOT NULL DEFAULT 0,
      daily_count INTEGER NOT NULL DEFAULT 0,
      daily_reset_at TEXT
    );

    CREATE TABLE IF NOT EXISTS image_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_key TEXT NOT NULL,
      status TEXT NOT NULL,
      attempt INTEGER NOT NULL DEFAULT 0,
      failure_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS job_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY(job_id) REFERENCES image_jobs(id)
    );
  `);
}

function nowIso() {
  return new Date().toISOString();
}

function getUser(userId) {
  const d = getDb();
  const row = d.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return row || null;
}

function ensureUser(userId) {
  const d = getDb();
  let user = getUser(userId);
  if (!user) {
    d.prepare(
      'INSERT INTO users (id, verified, banned, daily_count, daily_reset_at) VALUES (?, 1, 0, 0, ?)'
    ).run(userId, nowIso());
    user = getUser(userId);
  }
  return user;
}

function resetDailyIfNeeded(user) {
  const today = new Date();
  const lastReset = user.daily_reset_at ? new Date(user.daily_reset_at) : null;
  const isDifferentDay = !lastReset ||
    today.getUTCFullYear() !== lastReset.getUTCFullYear() ||
    today.getUTCMonth() !== lastReset.getUTCMonth() ||
    today.getUTCDate() !== lastReset.getUTCDate();

  if (isDifferentDay) {
    const d = getDb();
    d.prepare('UPDATE users SET daily_count = 0, daily_reset_at = ? WHERE id = ?')
      .run(nowIso(), user.id);
    return { ...user, daily_count: 0, daily_reset_at: nowIso() };
  }
  return user;
}

function checkUserPrerequisites(userId, { requireApiKey = true, apiKeyPresent = false } = {}) {
  const d = getDb();
  let user = ensureUser(userId);
  user = resetDailyIfNeeded(user);
  if (!user.verified) return { ok: false, reason: 'USER_NOT_VERIFIED' };
  if (user.banned) return { ok: false, reason: 'USER_BANNED' };
  if (user.daily_count >= DAILY_JOB_LIMIT) return { ok: false, reason: 'DAILY_LIMIT_EXCEEDED' };
  if (requireApiKey && !apiKeyPresent) return { ok: false, reason: 'API_KEY_NOT_CONFIGURED' };
  return { ok: true };
}

function incrementDailyCount(userId) {
  const d = getDb();
  const tx = d.transaction((uid) => {
    const user = ensureUser(uid);
    const updated = resetDailyIfNeeded(user);
    d.prepare('UPDATE users SET daily_count = daily_count + 1 WHERE id = ?').run(uid);
    return { ...updated, daily_count: updated.daily_count + 1 };
  });
  return tx(userId);
}

function createJob({ id, userId, sourceKey }) {
  const d = getDb();
  const ts = nowIso();
  const tx = d.transaction(() => {
    ensureUser(userId);
    d.prepare(
      `INSERT INTO image_jobs (id, user_id, source_key, status, created_at, updated_at)
       VALUES (?, ?, ?, 'PENDING', ?, ?)`
    ).run(id, userId, sourceKey, ts, ts);
  });
  tx();
}

const AllowedTransitions = {
  PENDING: new Set(['PROCESSING']),
  PROCESSING: new Set(['DONE', 'FAILED']),
  DONE: new Set([]),
  FAILED: new Set([]),
};

function updateJobStatus(jobId, nextStatus, {
  failureReason = null,
  startedAt = null,
  finishedAt = null,
  attempt = null,
} = {}) {
  const d = getDb();
  const tx = d.transaction(() => {
    const job = d.prepare('SELECT * FROM image_jobs WHERE id = ?').get(jobId);
    if (!job) throw new Error('JOB_NOT_FOUND');
    if (!AllowedTransitions[job.status] || !AllowedTransitions[job.status].has(nextStatus)) {
      throw new Error(`INVALID_STATUS_TRANSITION:${job.status}->${nextStatus}`);
    }
    const ts = nowIso();
    const stmt = d.prepare(`
      UPDATE image_jobs
      SET status = ?, updated_at = ?,
          failure_reason = COALESCE(?, failure_reason),
          started_at = COALESCE(?, started_at),
          finished_at = COALESCE(?, finished_at),
          attempt = COALESCE(?, attempt)
      WHERE id = ?
    `);
    stmt.run(nextStatus, ts, failureReason, startedAt, finishedAt, attempt, jobId);
  });
  tx();
}

function getJob(jobId) {
  const d = getDb();
  return d.prepare('SELECT * FROM image_jobs WHERE id = ?').get(jobId);
}

function logJob(jobId, level, message) {
  const d = getDb();
  d.prepare('INSERT INTO job_logs (job_id, level, message, timestamp) VALUES (?, ?, ?, ?)')
    .run(jobId, level, message, nowIso());
}

module.exports = {
  getDb,
  ensureUser,
  getUser,
  checkUserPrerequisites,
  incrementDailyCount,
  createJob,
  updateJobStatus,
  getJob,
  logJob,
};
