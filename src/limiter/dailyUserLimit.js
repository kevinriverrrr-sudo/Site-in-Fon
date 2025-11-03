const { incrementDaily } = require('./index');
const { info, withRequest } = require('../logger');
const { config } = require('../config');

function endOfDayEpochSeconds(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return Math.ceil(d.getTime() / 1000);
}

function dailyKeyForUser(userId, date = new Date()) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `daily:${userId}:${yyyy}${mm}${dd}`;
}

function userDailyLimitMiddleware(opts = {}) {
  const limit = opts.limit ?? config.dailyUserMax;
  const getUserId = opts.getUserId || ((req) => req.user?.id || req.headers['x-user-id']);

  return async (req, res, next) => {
    const userId = String(getUserId(req) || '').trim();
    if (!userId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const key = dailyKeyForUser(userId);
    const expireAtSec = endOfDayEpochSeconds();
    const { allowed, remaining, count } = await incrementDaily(key, limit, expireAtSec);

    if (!allowed) {
      info(withRequest(req, {
        event: 'rate_limit_hit',
        limiter: 'user_daily_limit',
        key,
        userId,
        limit,
        count,
        remaining,
      }));
      res.status(429).json({ error: 'daily_limit_exceeded' });
      return;
    }

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    next();
  };
}

module.exports = { userDailyLimitMiddleware, endOfDayEpochSeconds, dailyKeyForUser };
