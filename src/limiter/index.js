const { InMemoryStore } = require('./inMemoryStore');
const { RedisStore } = require('./redisStore');
const { config } = require('../config');

let storeInstance = null;

function getStore() {
  if (storeInstance) return storeInstance;
  if (process.env.NODE_ENV === 'test') {
    storeInstance = new InMemoryStore();
    return storeInstance;
  }
  const url = config.redisUrl;
  if (url) {
    storeInstance = new RedisStore(url);
  } else {
    storeInstance = new InMemoryStore();
  }
  return storeInstance;
}

// Utilities
async function slidingWindowCheck(key, limit, windowMs, nowMs) {
  const store = getStore();
  return store.slidingWindowHit(key, limit, windowMs, nowMs);
}

async function incrementDaily(key, limit, expireAtSec) {
  const store = getStore();
  return store.incrDaily(key, limit, expireAtSec);
}

module.exports = { getStore, slidingWindowCheck, incrementDaily };
