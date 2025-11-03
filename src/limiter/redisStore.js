const Redis = require('ioredis');
const { Store } = require('./store');

// Lua script for sliding window using sorted set
// KEYS[1] = key
// ARGV[1] = now(ms)
// ARGV[2] = window(ms)
// ARGV[3] = limit
// Returns: { allowed(1/0), retryAfterSec, count }
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local cutoff = now - window
redis.call('ZREMRANGEBYSCORE', key, 0, cutoff)
local count = redis.call('ZCARD', key)
if count >= limit then
  local earliest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local earliestScore = earliest[2] or now
  local retryAfter = math.ceil((earliestScore + window - now) / 1000)
  return {0, retryAfter, count}
else
  local member = tostring(now) .. '-' .. tostring(math.random(1000000))
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, window)
  count = count + 1
  return {1, 0, count}
end
`;

// Lua script for atomic daily increment with expiration
// KEYS[1] = key
// ARGV[1] = limit
// ARGV[2] = expireAtSec (unix seconds)
// Returns: { allowed(1/0), remaining, count }
const DAILY_INCR_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local expireAt = tonumber(ARGV[2])
local count = redis.call('INCR', key)
if count == 1 then
  redis.call('EXPIREAT', key, expireAt)
end
local allowed = 0
local remaining = 0
if count <= limit then
  allowed = 1
  remaining = limit - count
else
  allowed = 0
  remaining = 0
end
return {allowed, remaining, count}
`;

class RedisStore extends Store {
  constructor(url) {
    super();
    this.redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    this.slidingSha = null;
    this.dailySha = null;
  }

  async connect() {
    if (this.redis.status === 'end' || this.redis.status === 'wait') {
      await this.redis.connect();
    }
    if (!this.slidingSha) {
      this.slidingSha = await this.redis.script('load', SLIDING_WINDOW_LUA);
    }
    if (!this.dailySha) {
      this.dailySha = await this.redis.script('load', DAILY_INCR_LUA);
    }
  }

  async slidingWindowHit(key, limit, windowMs, nowMs) {
    await this.connect();
    const now = nowMs ?? Date.now();
    const res = await this.redis.evalsha(this.slidingSha, 1, key, now, windowMs, limit);
    return { allowed: res[0] === 1, retryAfterSec: res[1], count: res[2] };
  }

  async incrDaily(key, limit, expireAtSec) {
    await this.connect();
    const res = await this.redis.evalsha(this.dailySha, 1, key, limit, expireAtSec);
    return { allowed: res[0] === 1, remaining: res[1], count: res[2] };
  }
}

module.exports = { RedisStore };
