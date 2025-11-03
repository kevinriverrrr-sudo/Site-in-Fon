const express = require('express');
const session = require('express-session');
const path = require('path');
const dayjs = require('dayjs');
const { db, run, get, all, init, setSystem, getSystem } = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: 'dev-secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use('/public', express.static(path.join(__dirname, 'public')));

// Helper: reset usage counts daily (simple check on each request)
app.use(async (req, res, next) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    await run(
      "UPDATE users SET usedToday = 0, lastUsageReset = ? WHERE lastUsageReset IS NULL OR lastUsageReset <> ?",
      [today, today]
    );
  } catch (e) {
    // ignore
  }
  next();
});

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'ADMIN') return res.status(403).send('Forbidden - Admins only');
  next();
}

function getSystemWarnings(heartbeatValue) {
  const warnings = [];
  if (!process.env.EXTERNAL_API_KEY) warnings.push('External API key is missing');
  if (heartbeatValue) {
    const last = dayjs(heartbeatValue);
    if (!last.isValid() || dayjs().diff(last, 'second') > 30) warnings.push('Queue is offline');
  } else {
    warnings.push('Queue is offline');
  }
  return warnings;
}

// Auth routes
app.get('/login', async (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.render('login', { error: 'User not found' });
    req.session.user = { id: user.id, email: user.email, role: user.role };
    res.redirect('/');
  } catch (e) {
    res.render('login', { error: 'Login failed' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/', requireAuth, async (req, res) => {
  res.redirect('/admin');
});

// Admin dashboard
app.get('/admin', requireAdmin, async (req, res) => {
  const totalUsers = (await get('SELECT COUNT(*) as c FROM users')).c;
  const jobsToday = (
    await get("SELECT COUNT(*) as c FROM image_jobs WHERE date(createdAt) = date('now')")
  ).c;
  const failedTodayRow = await get(
    "SELECT SUM(CASE WHEN status='FAILED' THEN 1 ELSE 0 END) as failed, COUNT(*) as total FROM image_jobs WHERE date(createdAt) = date('now')"
  );
  const failureRate = failedTodayRow.total ? Math.round((failedTodayRow.failed / failedTodayRow.total) * 100) : 0;
  const heartbeat = await getSystem('queue_heartbeat');
  const warnings = getSystemWarnings(heartbeat);
  res.render('admin/index', {
    user: req.session.user,
    stats: { totalUsers, jobsToday, failureRate },
    warnings,
  });
});

// Users list
app.get('/admin/users', requireAdmin, async (req, res) => {
  const { q, role, status } = req.query;
  const where = [];
  const params = [];
  if (q) {
    where.push('(email LIKE ? OR id = ?)');
    params.push(`%${q}%`, parseInt(q) || 0);
  }
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const users = await all(
    `SELECT id, email, role, status, createdAt, dailyLimit, usedToday FROM users ${whereClause} ORDER BY createdAt DESC LIMIT 200`,
    params
  );
  const heartbeat = await getSystem('queue_heartbeat');
  const warnings = getSystemWarnings(heartbeat);
  res.render('admin/users', { user: req.session.user, users, warnings, filters: { q: q || '', role: role || '', status: status || '' } });
});

// User detail
app.get('/admin/users/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const u = await get('SELECT * FROM users WHERE id = ?', [id]);
  if (!u) return res.status(404).send('User not found');
  const usageLogs = await all('SELECT * FROM usage_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT 50', [id]);
  const jobs = await all('SELECT * FROM image_jobs WHERE userId = ? ORDER BY createdAt DESC LIMIT 50', [id]);
  const heartbeat = await getSystem('queue_heartbeat');
  const warnings = getSystemWarnings(heartbeat);
  res.render('admin/user_detail', { user: req.session.user, u, usageLogs, jobs, warnings });
});

// Mutations - users
app.post('/admin/users/:id/ban', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await run("UPDATE users SET status='BANNED' WHERE id = ?", [id]);
  res.json({ ok: true, status: 'BANNED' });
});

app.post('/admin/users/:id/unban', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await run("UPDATE users SET status='ACTIVE' WHERE id = ?", [id]);
  res.json({ ok: true, status: 'ACTIVE' });
});

app.post('/admin/users/:id/role', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { role } = req.body;
  if (!['ADMIN','USER'].includes(role)) return res.status(400).json({ ok: false, error: 'Invalid role' });
  await run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  res.json({ ok: true, role });
});

app.post('/admin/users/:id/limit', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  let { dailyLimit } = req.body;
  dailyLimit = parseInt(dailyLimit);
  if (isNaN(dailyLimit) || dailyLimit < 0) return res.status(400).json({ ok: false, error: 'Invalid limit' });
  await run('UPDATE users SET dailyLimit = ? WHERE id = ?', [dailyLimit, id]);
  res.json({ ok: true, dailyLimit });
});

// Jobs monitor
app.get('/admin/jobs', requireAdmin, async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = '';
  if (status && ['PENDING','RUNNING','COMPLETED','FAILED'].includes(status)) {
    where = 'WHERE status = ?';
    params.push(status);
  }
  const jobs = await all(
    `SELECT image_jobs.*, users.email FROM image_jobs JOIN users ON users.id = image_jobs.userId ${where} ORDER BY createdAt DESC LIMIT 100`,
    params
  );
  const heartbeat = await getSystem('queue_heartbeat');
  const warnings = getSystemWarnings(heartbeat);
  res.render('admin/jobs', { user: req.session.user, jobs, warnings, filter: { status: status || '' } });
});

app.post('/admin/jobs/:id/retry', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const job = await get('SELECT * FROM image_jobs WHERE id = ?', [id]);
  if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
  if (job.status !== 'FAILED') return res.status(400).json({ ok: false, error: 'Only failed jobs can be retried' });
  const now = new Date().toISOString();
  await run("UPDATE image_jobs SET status='PENDING', failureReason=NULL, updatedAt=? WHERE id=?", [now, id]);
  res.json({ ok: true, status: 'PENDING' });
});

// daily reset middleware moved earlier

// Queue worker simulation
async function queueHeartbeat() {
  await setSystem('queue_heartbeat', new Date().toISOString());
}

async function processQueueOnce() {
  // update heartbeat
  await queueHeartbeat();

  // pick one pending job to work on
  const job = await get("SELECT * FROM image_jobs WHERE status='PENDING' ORDER BY createdAt ASC LIMIT 1");
  if (!job) return;

  await run("UPDATE image_jobs SET status='RUNNING', updatedAt=? WHERE id=?", [new Date().toISOString(), job.id]);

  setTimeout(async () => {
    const missingApiKey = !process.env.EXTERNAL_API_KEY;
    const failChance = 0.2;
    const shouldFail = missingApiKey || Math.random() < failChance;
    const status = shouldFail ? 'FAILED' : 'COMPLETED';
    const failureReason = missingApiKey ? 'Missing API key' : shouldFail ? 'Random processing error' : null;
    await run('UPDATE image_jobs SET status=?, updatedAt=?, failureReason=? WHERE id=?', [
      status,
      new Date().toISOString(),
      failureReason,
      job.id,
    ]);
  }, 2000 + Math.random()*3000);
}

setInterval(processQueueOnce, 4000);
setInterval(queueHeartbeat, 15000);

// Create a few endpoints to create jobs for testing
app.post('/jobs/create', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const now = new Date().toISOString();
  await run(
    `INSERT INTO image_jobs (userId, status, createdAt, updatedAt, failureReason, payload) VALUES (?,?,?,?,?,?)`,
    [userId, 'PENDING', now, now, null, JSON.stringify({ prompt: 'test prompt' })]
  );
  res.json({ ok: true });
});

// Start server
async function start() {
  await init();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log('Server running on http://localhost:' + port);
    console.log('Login as admin@example.com at /login');
  });
}

start();
