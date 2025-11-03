const { Queue } = require('bullmq');
const crypto = require('crypto');
const { getRedisConnection } = require('./connection');
const { QUEUE_ATTEMPTS, QUEUE_BACKOFF_MS } = require('../config');

const QUEUE_NAME = 'background-removal';

let queueInstance = null;

function getQueue() {
  if (queueInstance) return queueInstance;
  const connection = getRedisConnection();
  if (!connection) return null;
  queueInstance = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: QUEUE_ATTEMPTS,
      backoff: { type: 'exponential', delay: QUEUE_BACKOFF_MS },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
  return queueInstance;
}

async function enqueueBackgroundRemovalJob({ jobId, userId, sourceKey }) {
  const q = getQueue();
  if (!q) return null; // caller should handle sync fallback
  const job = await q.add('process', { jobId, userId, sourceKey }, {
    jobId,
  });
  return job;
}

function generateJobId() {
  return crypto.randomUUID();
}

module.exports = { QUEUE_NAME, getQueue, enqueueBackgroundRemovalJob, generateJobId };
