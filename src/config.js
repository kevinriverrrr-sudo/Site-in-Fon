const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env if present
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
} catch (e) {
  // ignore
}

const env = (key, def) => (process.env[key] !== undefined ? process.env[key] : def);

const config = {
  env: env('NODE_ENV', 'development'),
  port: parseInt(env('PORT', '3000'), 10),
  logLevel: env('LOG_LEVEL', 'info'),
  jsonLogs: env('JSON_LOGS', 'true') !== 'false',
  requestIdHeader: env('REQUEST_ID_HEADER', 'x-request-id'),
  sentry: {
    enabled: env('SENTRY_ENABLED', 'false') === 'true',
    dsn: env('SENTRY_DSN', ''),
    tracesSampleRate: parseFloat(env('SENTRY_TRACES_SAMPLE_RATE', '0')) || 0
  },
  health: {
    db: {
      host: env('DB_HOST', ''),
      port: parseInt(env('DB_PORT', '0'), 10) || undefined,
      url: env('DATABASE_URL', '')
    },
    redis: {
      host: env('REDIS_HOST', ''),
      port: parseInt(env('REDIS_PORT', '0'), 10) || undefined,
      url: env('REDIS_URL', '')
    },
    s3: {
      bucket: env('AWS_S3_BUCKET', ''),
      region: env('AWS_REGION', ''),
      accessKeyId: env('AWS_ACCESS_KEY_ID', ''),
      secretAccessKey: env('AWS_SECRET_ACCESS_KEY', '')
    }
  },
  dataDir: env('DATA_DIR', path.join(process.cwd(), 'data'))
};

module.exports = config;
