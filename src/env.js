const { cleanEnv, str, num, port, bool, url, makeValidator } = require('envalid');

// Optional URL that may be empty
const emptyableUrl = makeValidator((x) => (x === '' ? '' : url()(x)));

function getEnv() {
  const env = cleanEnv(process.env, {
    // App
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    PORT: port({ default: 3000 }),
    APP_URL: str({ default: 'http://localhost:3000' }),

    // Database (Postgres)
    DATABASE_URL: str({ default: '' }),
    DIRECT_URL: str({ default: '' }),

    // Redis / Queue
    REDIS_URL: str({ default: '' }),
    UPSTASH_REDIS_REST_URL: str({ default: '' }),
    UPSTASH_REDIS_REST_TOKEN: str({ default: '' }),
    QUEUE_PROVIDER: str({ choices: ['redis'], default: 'redis' }),
    WORKER_CONCURRENCY: num({ default: 5 }),

    // Storage (S3/R2/MinIO)
    S3_PROVIDER: str({ choices: ['aws', 'r2', 'minio'], default: 'aws' }),
    AWS_ACCESS_KEY_ID: str({ default: '' }),
    AWS_SECRET_ACCESS_KEY: str({ default: '' }),
    AWS_REGION: str({ default: 'us-east-1' }),
    S3_BUCKET: str({ default: '' }),
    S3_ENDPOINT: str({ default: '' }),
    S3_FORCE_PATH_STYLE: bool({ default: true }),

    // Email / SMTP
    SMTP_HOST: str({ default: '' }),
    SMTP_PORT: num({ default: 1025 }),
    SMTP_USER: str({ default: '' }),
    SMTP_PASSWORD: str({ default: '' }),
    SMTP_SECURE: bool({ default: false }),
    SMTP_FROM: str({ default: 'Dev <dev@example.com>' }),
    RESEND_API_KEY: str({ default: '' }),

    // Auth/Security
    SESSION_SECRET: str({ default: '' }),
    JWT_SECRET: str({ default: '' }),

    // Billing / Webhooks
    FEATURE_BILLING_ENABLED: bool({ default: false }),
    BILLING_PROVIDER: str({ choices: ['stripe', 'none'], default: 'none' }),
    STRIPE_SECRET_KEY: str({ default: '' }),
    STRIPE_WEBHOOK_SECRET: str({ default: '' }),
    DISABLE_BILLING_WEBHOOK_PROCESSING: bool({ default: false }),

    // Feature flags
    FEATURE_EMAIL_VERIFICATION_BYPASS: bool({ default: false }),

    // Observability
    SENTRY_DSN: str({ default: '' }),
    POSTHOG_API_KEY: str({ default: '' }),
    POSTHOG_HOST: str({ default: '' }),

    // Misc
    LOG_LEVEL: str({ choices: ['debug', 'info', 'warn', 'error'], default: 'info' }),
    RATE_LIMIT_REDIS_PREFIX: str({ default: 'ratelimit:' }),
    CACHE_TTL_SECONDS: num({ default: 300 })
  });

  return env;
}

const env = getEnv();

module.exports = { env, getEnv };
