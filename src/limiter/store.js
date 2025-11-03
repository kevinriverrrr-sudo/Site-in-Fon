// Abstraction over backing store used by limiters
// Implementations: in-memory (default for tests/dev), Redis (for production)

class Store {
  // Sliding window rate limit for a given key
  // Returns: { allowed: boolean, retryAfterSec: number, count: number }
  async slidingWindowHit(key, limit, windowMs, nowMs) {
    throw new Error('Not implemented');
  }

  // Atomic daily increment with limit for a given key
  // expireAtSec is a unix epoch seconds indicating when the counter should expire
  // Returns: { allowed: boolean, remaining: number, count: number }
  async incrDaily(key, limit, expireAtSec) {
    throw new Error('Not implemented');
  }
}

module.exports = { Store };
