Rate limiting utilities (Redis sliding window + per-user daily limit)

Overview
- Anonymous endpoints (e.g., auth, upload presign) are protected by a Redis-style sliding window limiter keyed by IP address.
- Job submission endpoints enforce a per-user daily limit using an atomic counter.
- Middleware and helpers are provided to make reuse easy across routes and server actions.
- Structured logs include the request ID when limits are triggered.

Quick start
1) Install dependencies: npm install
2) Run tests: npm test
3) Optionally start the demo server: npm start (endpoints: POST /auth/login, GET /uploads/presign, POST /jobs/submit)

Environment variables
- REDIS_URL: Redis connection URL (e.g., redis://localhost:6379). If omitted, an in-memory store is used (suitable for tests and local dev only).
- ANON_IP_RATE_LIMIT_WINDOW_SEC: Sliding window size in seconds for anonymous IP limiting. Default: 60
- ANON_IP_RATE_LIMIT_MAX: Max requests allowed per IP address within the window. Default: 60
- DAILY_USER_LIMIT_MAX: Max number of job submissions per user per day. Default: 1000

Endpoints usage (Express)
- Anonymous endpoints: app.post('/auth/login', ipRateLimiterMiddleware(), handler)
- User daily limit: app.post('/jobs/submit', userDailyLimitMiddleware(), handler) where a user id is expected in req.user.id or x-user-id header.

Middleware behavior
- IP sliding window: Exceeding the limit returns HTTP 429 with a Retry-After header (seconds until the oldest request exits the window). A structured log entry is emitted: { event: "rate_limit_hit", limiter: "ip_sliding_window", key, ip, limit, windowSec, count, retryAfterSec, requestId }.
- User daily limit: Exceeding the limit returns HTTP 429 and emits a structured log entry: { event: "rate_limit_hit", limiter: "user_daily_limit", key, userId, limit, count, remaining, requestId }.

Atomicity and data stores
- Sliding window: Implemented using a sorted set algorithm. With Redis enabled, a Lua script performs the cleanup, count, and insert atomically. In tests/local when Redis is not configured, an in-memory store uses per-key locks to serialize operations and emulate atomic behavior.
- Per-user daily limit: With Redis enabled, atomicity is guaranteed via a Lua script that performs INCR and EXPIREAT in one operation. Without Redis, the in-memory store uses per-key locks and wall-clock expiry to prevent race conditions.

Required Redis commands (if REDIS_URL is provided)
- EVALSHA (Lua scripts), ZREMRANGEBYSCORE, ZCARD, ZADD, PEXPIRE for sliding window
- INCR, EXPIREAT for daily counters

Monitoring and observability
- Logs: Structured JSON logs include requestId and details when a limiter is triggered.
- Redis keys:
  - rate:ip:<ip>     // sliding window sorted sets
  - daily:<userId>:YYYYMMDD  // daily counters
- Sample Redis commands:
  - List top IP keys: SCAN 0 MATCH rate:ip:* COUNT 100
  - Inspect a specific IP window: ZRANGE rate:ip:1.2.3.4 0 -1 WITHSCORES
  - Check daily count: GET daily:123:20250101; TTL daily:123:20250101
  - Memory and stats: INFO memory; INFO stats

Configuration tips
- To tighten or loosen the anonymous IP rate limit, set ANON_IP_RATE_LIMIT_WINDOW_SEC and ANON_IP_RATE_LIMIT_MAX.
- To change the per-user daily limit, set DAILY_USER_LIMIT_MAX.
- Behind proxies, ensure x-forwarded-for is populated or configure Express trust proxy so req.ip reflects the client IP.

Testing
- Unit tests cover:
  - IP sliding window behavior and Retry-After header
  - Per-user daily limit atomicity under concurrent requests
  - Structured logging on limit hits
- Run with: npm test

Notes
- The in-memory store is intended only for tests and local development. Use Redis in production to ensure process-wide and multi-instance consistency and durability.
