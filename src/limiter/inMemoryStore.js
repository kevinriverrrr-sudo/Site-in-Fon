const { Store } = require('./store');

class InMemoryStore extends Store {
  constructor() {
    super();
    this.zsets = new Map(); // key -> array of numbers (timestamps ms)
    this.counters = new Map(); // key -> { count, expireAtSec }
    this.locks = new Map(); // key -> promise chain for sequential ops
  }

  // Ensure sequential operations per key to emulate atomicity
  withLock(key, fn) {
    const prev = this.locks.get(key) || Promise.resolve();
    const next = prev.then(fn, fn);
    // keep chain alive, ignoring unhandled rejections
    this.locks.set(key, next.catch(() => {}));
    return next;
  }

  async slidingWindowHit(key, limit, windowMs, nowMs) {
    return this.withLock(key, async () => {
      const now = nowMs ?? Date.now();
      const arr = this.zsets.get(key) || [];
      const cutoff = now - windowMs;
      // remove timestamps older than window
      while (arr.length > 0 && arr[0] < cutoff) {
        arr.shift();
      }
      // count after cleanup
      let count = arr.length;
      if (count >= limit) {
        const earliest = arr[0];
        const retryAfterMs = Math.max(0, earliest + windowMs - now);
        const retryAfterSec = Math.ceil(retryAfterMs / 1000);
        this.zsets.set(key, arr);
        return { allowed: false, retryAfterSec, count };
      }
      // push new timestamp and keep sorted
      arr.push(now);
      // keep sorted though it's naturally ordered
      this.zsets.set(key, arr);
      count = arr.length;
      return { allowed: true, retryAfterSec: 0, count };
    });
  }

  async incrDaily(key, limit, expireAtSec) {
    return this.withLock(key, async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const cur = this.counters.get(key) || { count: 0, expireAtSec };
      // reset if expired or new expiry
      if (!cur.expireAtSec || nowSec >= cur.expireAtSec || cur.expireAtSec !== expireAtSec) {
        cur.count = 0;
        cur.expireAtSec = expireAtSec;
      }
      cur.count += 1;
      const allowed = cur.count <= limit;
      const remaining = Math.max(0, limit - cur.count);
      this.counters.set(key, cur);
      return { allowed, remaining, count: cur.count };
    });
  }
}

module.exports = { InMemoryStore };
