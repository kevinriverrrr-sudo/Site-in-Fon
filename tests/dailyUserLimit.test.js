const request = require('supertest');
const express = require('express');
const { requestIdMiddleware } = require('../src/requestId');
const { userDailyLimitMiddleware } = require('../src/middleware/userDailyLimit');
const { setLoggerSink } = require('../src/logger');
const { incrementDaily } = require('../src/limiter');
const { endOfDayEpochSeconds, dailyKeyForUser } = require('../src/limiter/dailyUserLimit');

describe('Per-user daily limit', () => {
  let logs = [];
  beforeAll(() => {
    setLoggerSink((level, payload) => logs.push({ level, ...payload }));
  });
  beforeEach(() => {
    logs = [];
  });

  test('enforces daily limit atomically across concurrent requests', async () => {
    const app = express();
    app.use(express.json());
    app.use(requestIdMiddleware);
    app.post('/jobs/submit', userDailyLimitMiddleware({ limit: 5, getUserId: (req) => req.headers['x-user-id'] }), (req, res) => {
      res.json({ enqueued: true });
    });

    const userId = 'u1';
    const n = 20;
    const reqs = Array.from({ length: n }).map(() => request(app).post('/jobs/submit').set('x-user-id', userId));
    const results = await Promise.all(reqs.map((r) => r.then((res) => res.status)));

    const success = results.filter((s) => s === 200).length;
    const tooMany = results.filter((s) => s === 429).length;

    expect(success).toBe(5);
    expect(tooMany).toBe(n - 5);

    // Ensure log emitted for limit hits
    const hit = logs.find((l) => l.event === 'rate_limit_hit' && l.limiter === 'user_daily_limit');
    expect(hit).toBeTruthy();
  });

  test('store atomicity: incrementDaily never exceeds limit under concurrency', async () => {
    const userId = 'u2';
    const limit = 7;
    const key = dailyKeyForUser(userId);
    const expireAtSec = endOfDayEpochSeconds();
    const n = 50;
    const calls = Array.from({ length: n }).map(() => incrementDaily(key, limit, expireAtSec));
    const results = await Promise.all(calls);
    const allowed = results.filter((r) => r.allowed).length;
    expect(allowed).toBe(limit);
  });
});
