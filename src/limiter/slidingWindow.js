const { slidingWindowCheck } = require('./index');
const { info, withRequest } = require('../logger');
const { config } = require('../config');

function ipKey(ip) {
  return `rate:ip:${ip}`;
}

function getClientIp(req) {
  // honor x-forwarded-for if any; pick first
  const xf = req.headers['x-forwarded-for'];
  if (xf) {
    const first = String(xf).split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

function ipRateLimiterMiddleware(opts = {}) {
  const windowSec = opts.windowSec ?? config.anonIpWindowSec;
  const limit = opts.limit ?? config.anonIpMax;

  return async (req, res, next) => {
    const ip = getClientIp(req);
    const key = ipKey(ip);
    const { allowed, retryAfterSec, count } = await slidingWindowCheck(
      key,
      limit,
      windowSec * 1000,
      Date.now()
    );

    if (!allowed) {
      res.setHeader('Retry-After', String(retryAfterSec));
      info(withRequest(req, {
        event: 'rate_limit_hit',
        limiter: 'ip_sliding_window',
        key,
        ip,
        limit,
        windowSec,
        count,
        retryAfterSec,
      }));
      res.status(429).json({ error: 'rate_limit_exceeded', retryAfterSec });
      return;
    }
    next();
  };
}

module.exports = { ipRateLimiterMiddleware, getClientIp, ipKey };
