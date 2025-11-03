#!/usr/bin/env node
require('dotenv').config();
const { Worker, QueueEvents } = require('bullmq');
const { getRedisConnection } = require('../src/queue/connection');
const { QUEUE_NAME } = require('../src/queue/backgroundRemovalQueue');
const { updateJobStatus, logJob } = require('../src/db');
const { removeBackground } = require('../src/services/backgroundRemovalService');

async function main() {
  const connection = getRedisConnection();
  if (!connection) {
    console.warn('[worker] No Redis connection configured. Exiting. Use sync mode on the API instead.');
    process.exit(0);
    return;
  }

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { jobId, sourceKey, userId } = job.data || {};
      try {
        updateJobStatus(jobId, 'PROCESSING', { startedAt: new Date().toISOString(), attempt: job.attemptsMade + 1 });
        const result = await removeBackground({ jobId, sourceKey, userId });
        updateJobStatus(jobId, 'DONE', { finishedAt: new Date().toISOString() });
        return result;
      } catch (err) {
        const failureReason = err && err.message ? String(err.message) : 'UNKNOWN_ERROR';
        logJob(jobId, 'error', `Job failed (attempt ${job.attemptsMade + 1}): ${failureReason}`);
        if (job.attemptsMade + 1 >= (job.opts.attempts || 1)) {
          updateJobStatus(jobId, 'FAILED', {
            finishedAt: new Date().toISOString(),
            failureReason,
            attempt: job.attemptsMade + 1,
          });
        }
        throw err; // allow BullMQ to handle retries
      }
    },
    {
      connection,
    }
  );

  const events = new QueueEvents(QUEUE_NAME, { connection });
  events.on('completed', ({ jobId, returnvalue }) => {
    console.log(`[worker] Job ${jobId} completed`);
  });
  events.on('failed', ({ jobId, failedReason, retriesLeft }) => {
    console.warn(`[worker] Job ${jobId} failed: ${failedReason} (retries left: ${retriesLeft})`);
  });

  worker.on('error', (err) => {
    console.error('[worker] error', err);
  });

  console.log(`[worker] Listening on queue "${QUEUE_NAME}"`);
}

main().catch((err) => {
  console.error('[worker] Fatal error', err);
  process.exit(1);
});
