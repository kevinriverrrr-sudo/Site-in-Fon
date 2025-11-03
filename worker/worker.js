const { randomUUID } = require('crypto');
const logger = require('../src/logger');
const { initSentry, captureException } = require('../src/sentry');
const db = require('../src/db');

initSentry();

async function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

async function processJob(job, handler, opts = {}) {
  const { maxRetries = 2, retryDelayMs = 250 } = opts;
  const jobId = job.id || randomUUID();
  const metadata = { jobId, type: job.type || 'unknown', attempt: 0 };

  let lastErr = null;
  const started = Date.now();

  for (let attempt = 1; attempt <= (maxRetries + 1); attempt++) {
    metadata.attempt = attempt;
    const startAttempt = Date.now();
    logger.info('worker.job.start', { ...metadata });
    try {
      const result = await handler(job, { attempt });
      const durationMs = Date.now() - started;
      logger.info('worker.job.success', { ...metadata, durationMs, result });
      return { ok: true, result };
    } catch (err) {
      lastErr = err;
      const attemptDuration = Date.now() - startAttempt;
      logger.error('worker.job.error', { ...metadata, attemptDuration, error: String(err && err.stack || err) });
      captureException(err, { jobId, type: metadata.type, attempt });
      if (attempt <= maxRetries) {
        logger.info('worker.job.retrying', { ...metadata, retryInMs: retryDelayMs });
        await sleep(retryDelayMs);
        continue;
      }
      break;
    }
  }

  // Store failureReason in DB
  const failure = db.storeJobFailure(jobId, job.failureReason || (lastErr && lastErr.message) || 'Unknown', lastErr);
  const durationMs = Date.now() - started;
  logger.error('worker.job.failed', { ...metadata, durationMs, failureReason: failure.failureReason });
  return { ok: false, error: lastErr };
}

async function demo() {
  const jobOk = { id: randomUUID(), type: 'demo-success' };
  const jobFail = { id: randomUUID(), type: 'demo-failure', failureReason: 'Demo failure' };

  await processJob(jobOk, async () => {
    await sleep(100);
    return { message: 'done' };
  });

  await processJob(jobFail, async () => {
    await sleep(50);
    throw new Error('boom');
  }, { maxRetries: 1, retryDelayMs: 100 });

  const failures = db.listJobFailures();
  logger.info('worker.failures', { count: failures.length });
}

if (require.main === module) {
  demo().catch((e) => {
    logger.fatal('worker.demo.crash', { error: String(e && e.stack || e) });
    process.exitCode = 1;
  });
}

module.exports = { processJob };
