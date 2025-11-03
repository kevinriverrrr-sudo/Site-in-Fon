const { JobStatus, getJob, saveJob } = require('../jobs/db.js');

class Worker {
  constructor({ provider, s3Storage, bucket, logger = console } = {}) {
    this.provider = provider;
    this.s3 = s3Storage;
    this.bucket = bucket || this.s3?.bucket;
    this.logger = logger;
  }

  async process(jobId) {
    const job = getJob(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    if (job.status !== JobStatus.QUEUED) return job;

    job.status = JobStatus.PROCESSING;
    saveJob(job);
    try {
      const { bytes, metadata } = await this.provider.process({ sourceKey: job.sourceKey });
      const resultKey = `results/${job.id}.png`;
      await this.s3.putObject({ key: resultKey, body: bytes, contentType: 'image/png' });
      job.status = JobStatus.COMPLETED;
      job.resultKey = resultKey;
      job.metadata = metadata;
      saveJob(job);
      this.logger.info?.(`Job ${job.id} completed -> ${resultKey}`);
      return job;
    } catch (e) {
      job.status = JobStatus.FAILED;
      job.errorReason = e?.message || String(e);
      saveJob(job);
      this.logger.error?.(`Job ${job.id} failed: ${job.errorReason}`);
      return job;
    }
  }
}

module.exports = { Worker };