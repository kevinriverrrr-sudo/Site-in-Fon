const { createJob } = require('../jobs/db.js');
const { assertProviderConfigured } = require('../provider/factory.js');
const { loadConfig } = require('../config.js');

function enqueueJob({ sourceKey }, { env = process.env, logger = console } = {}) {
  const config = loadConfig(env);
  try {
    assertProviderConfigured(config);
  } catch (e) {
    logger.error?.(`Cannot enqueue background removal job: ${e.message}`);
    throw e;
  }
  const job = createJob({ sourceKey });
  logger.info?.(`Enqueued job ${job.id} for ${sourceKey}`);
  return job;
}

module.exports = { enqueueJob };