require('dotenv').config();
const express = require('express');

const { isSyncMode, hasUpstashRedis, BACKGROUND_REMOVAL_API_KEY } = require('./config');
const {
  createJob,
  updateJobStatus,
  checkUserPrerequisites,
  incrementDailyCount,
  getJob,
  logJob,
} = require('./db');
const { removeBackground } = require('./services/backgroundRemovalService');
const { enqueueBackgroundRemovalJob, generateJobId } = require('./queue/backgroundRemovalQueue');

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/jobs/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ job });
});

app.post('/api/jobs/background-removal', async (req, res) => {
  try {
    const { userId, sourceKey } = req.body || {};
    if (!userId || !sourceKey) return res.status(400).json({ error: 'MISSING_PARAMS' });

    const prereq = checkUserPrerequisites(userId, {
      requireApiKey: true,
      apiKeyPresent: !!BACKGROUND_REMOVAL_API_KEY,
    });
    if (!prereq.ok) return res.status(403).json({ error: prereq.reason });

    const jobId = generateJobId();
    createJob({ id: jobId, userId, sourceKey });

    const usingQueue = !isSyncMode && hasUpstashRedis;
    if (usingQueue) {
      await enqueueBackgroundRemovalJob({ jobId, userId, sourceKey });
      incrementDailyCount(userId);
      return res.status(202).json({ enqueued: true, jobId, mode: 'queue' });
    }

    updateJobStatus(jobId, 'PROCESSING', { startedAt: new Date().toISOString(), attempt: 1 });
    try {
      const result = await removeBackground({ jobId, sourceKey, userId });
      updateJobStatus(jobId, 'DONE', { finishedAt: new Date().toISOString() });
      incrementDailyCount(userId);
      return res.json({ enqueued: false, jobId, mode: 'sync', result });
    } catch (err) {
      const failureReason = err && err.message ? String(err.message) : 'UNKNOWN_ERROR';
      logJob(jobId, 'error', `Sync job failed: ${failureReason}`);
      updateJobStatus(jobId, 'FAILED', {
        finishedAt: new Date().toISOString(),
        failureReason,
        attempt: 1,
      });
      return res.status(500).json({ error: 'PROCESSING_FAILED', jobId, failureReason });
    }
  } catch (err) {
    console.error('[server] Failed to enqueue job', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT} (mode=${isSyncMode ? 'sync' : 'queue'})`);
});
