const { hasUpstashRedis } = require('../config');

let connection = null;

function getRedisConnection() {
  if (!hasUpstashRedis) return null;
  if (connection) return connection;
  const { Redis } = require('@upstash/redis');
  const { IORedisAdapter } = require('@upstash/redis/bullmq');
  const client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  connection = new IORedisAdapter(client);
  return connection;
}

module.exports = { getRedisConnection };
