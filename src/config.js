const fs = require('fs');
const path = require('path');
require('dotenv').config();

const rootDir = path.resolve(__dirname, '..');

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

const QUEUE_MODE = process.env.QUEUE_MODE || 'redis'; // 'redis' | 'sync'
const isSyncMode = QUEUE_MODE.toLowerCase() === 'sync';

const DB_PATH = process.env.DB_PATH
  ? path.resolve(rootDir, process.env.DB_PATH)
  : path.resolve(rootDir, 'data/db.sqlite');
ensureDir(path.dirname(DB_PATH));

const DAILY_JOB_LIMIT = parseInt(process.env.DAILY_JOB_LIMIT || '25', 10);

const QUEUE_ATTEMPTS = parseInt(process.env.QUEUE_ATTEMPTS || '3', 10);
const QUEUE_BACKOFF_MS = parseInt(process.env.QUEUE_BACKOFF_MS || '2000', 10);

const hasUpstashRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const BACKGROUND_REMOVAL_API_KEY = process.env.BACKGROUND_REMOVAL_API_KEY || '';

module.exports = {
  rootDir,
  DB_PATH,
  DAILY_JOB_LIMIT,
  isSyncMode,
  hasUpstashRedis,
  QUEUE_ATTEMPTS,
  QUEUE_BACKOFF_MS,
  BACKGROUND_REMOVAL_API_KEY,
};
