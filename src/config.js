const config = {
  // Anonymous IP sliding window
  anonIpWindowSec: parseInt(process.env.ANON_IP_RATE_LIMIT_WINDOW_SEC || "60", 10),
  anonIpMax: parseInt(process.env.ANON_IP_RATE_LIMIT_MAX || "60", 10),

  // Per-user daily job submission limit
  dailyUserMax: parseInt(process.env.DAILY_USER_LIMIT_MAX || "1000", 10),

  // Redis configuration (optional in tests/dev)
  redisUrl: process.env.REDIS_URL || "",
};

module.exports = { config };
