require('dotenv').config();
const { env } = require('./env');
const Redis = require('ioredis');

async function main() {
  console.log('Worker starting...');
  if (!env.REDIS_URL && !env.UPSTASH_REDIS_REST_URL) {
    console.warn('No Redis URL provided. Worker will idle. Set REDIS_URL or UPSTASH_REDIS_REST_URL.');
  }

  if (env.BILLING_PROVIDER === 'stripe' && !env.STRIPE_SECRET_KEY) {
    console.warn('Stripe selected but STRIPE_SECRET_KEY is missing. Billing processing will be disabled.');
  }
  if (env.DISABLE_BILLING_WEBHOOK_PROCESSING) {
    console.warn('Billing webhook processing explicitly disabled via DISABLE_BILLING_WEBHOOK_PROCESSING=true');
  }

  let redis;
  if (env.REDIS_URL) {
    redis = new Redis(env.REDIS_URL, { lazyConnect: true });
    try {
      await redis.connect();
      console.log('Connected to Redis');
      const sub = new Redis(env.REDIS_URL);
      await sub.subscribe('jobs');
      console.log('Subscribed to channel: jobs');
      sub.on('message', (channel, message) => {
        console.log(`[${new Date().toISOString()}] Received on ${channel}:`, message);
        // Process message here...
      });
    } catch (e) {
      console.warn('Failed to connect to Redis. Worker will keep running without queue:', e.message);
    }
  }

  console.log(`Worker running with concurrency=${env.WORKER_CONCURRENCY}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
