const request = require('supertest');
const { app } = require('../src/index');
const { setLoggerSink } = require('../src/logger');

describe('IP sliding window rate limiter', () => {
  let logs = [];
  beforeAll(() => {
    setLoggerSink((level, payload) => {
      logs.push({ level, ...payload });
    });
  });
  beforeEach(() => {
    logs = [];
  });

  test('returns 429 with Retry-After when exceeding limit', async () => {
    const customApp = require('express')();
    const { requestIdMiddleware } = require('../src/requestId');
    const { ipRateLimiterMiddleware } = require('../src/middleware/ipRateLimiter');
    customApp.use(requestIdMiddleware);
    customApp.get('/test', ipRateLimiterMiddleware({ windowSec: 1, limit: 3 }), (req, res) => res.json({ ok: true }));

    await request(customApp).get('/test').expect(200);
    await request(customApp).get('/test').expect(200);
    await request(customApp).get('/test').expect(200);
    const res = await request(customApp).get('/test').expect(429);

    expect(res.headers['retry-after']).toBeDefined();
    const ra = parseInt(res.headers['retry-after'], 10);
    expect(Number.isNaN(ra)).toBe(false);
    expect(ra).toBeGreaterThanOrEqual(0);
    // Ensure log emitted
    const hit = logs.find((l) => l.event === 'rate_limit_hit' && l.limiter === 'ip_sliding_window');
    expect(hit).toBeTruthy();
    expect(hit.requestId).toBeTruthy();
  });
});
