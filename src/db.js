const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./logger');

const dataDir = config.dataDir;
const failuresFile = path.join(dataDir, 'job_failures.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(failuresFile)) {
      fs.writeFileSync(failuresFile, JSON.stringify({ failures: [] }, null, 2));
    }
  } catch (e) {
    logger.warn('Failed to ensure data dir', { error: String(e && e.message || e) });
  }
}

ensureDataDir();

function readFailures() {
  try {
    const raw = fs.readFileSync(failuresFile, 'utf-8');
    return JSON.parse(raw);
  } catch (_) {
    return { failures: [] };
  }
}

function writeFailures(data) {
  try {
    fs.writeFileSync(failuresFile, JSON.stringify(data, null, 2));
  } catch (e) {
    logger.warn('Failed to write failures file', { error: String(e && e.message || e) });
  }
}

function storeJobFailure(jobId, failureReason, error) {
  const data = readFailures();
  const entry = {
    jobId,
    failureReason: failureReason || (error && error.message) || 'Unknown',
    error: error ? String(error.stack || error) : undefined,
    timestamp: new Date().toISOString()
  };
  data.failures.push(entry);
  writeFailures(data);
  return entry;
}

function listJobFailures(limit = 50) {
  const data = readFailures();
  return data.failures.slice(-limit);
}

module.exports = {
  storeJobFailure,
  listJobFailures
};
