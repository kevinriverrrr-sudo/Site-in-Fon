let _id = 1;
const jobs = new Map();

const JobStatus = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

function createJob({ sourceKey }) {
  const id = String(_id++);
  const job = { id, sourceKey, status: JobStatus.QUEUED, resultKey: null, errorReason: null, metadata: null };
  jobs.set(id, job);
  return job;
}

function getJob(id) { return jobs.get(id); }
function saveJob(job) { jobs.set(job.id, job); return job; }
function allJobs() { return Array.from(jobs.values()); }
function clearJobs() { jobs.clear(); _id = 1; }

module.exports = { JobStatus, createJob, getJob, saveJob, allJobs, clearJobs };