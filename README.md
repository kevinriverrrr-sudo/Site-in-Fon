# Observability Sample

This repository provides a minimal Node.js application that demonstrates:

- Request/operation logging with request IDs propagated via middleware/context
- Structured API error handling with JSON responses
- Client UI error boundary with graceful fallback and retry option
- Health check endpoint covering DB, Redis, and S3 connectivity
- Worker job logging with durations, retries, and persistent failure reasons
- Sentry integration placeholders gated by environment variables

## Getting started

- Requirements: Node.js >= 18
- Install dependencies: `npm install`
- Start the server: `npm start`
- Start the demo worker (optional): `npm run worker`

The app starts on port 3000 by default and serves a static UI at `/`.

## Observability features

### Request logging + request IDs

- A middleware attaches a request ID to each request (from `x-request-id` header if present, otherwise a new UUID v4) and propagates it through an AsyncLocalStorage context.
- All logs use a structured JSON format and include the `requestId` automatically when available.
- Configure the log level via `LOG_LEVEL` (default: `info`). Set `JSON_LOGS=false` to emit human-readable logs instead.

Example logs:

```
{"level":"info","time":"...","msg":"request.start","requestId":"...","meta":{"method":"GET","path":"/healthz"}}
{"level":"info","time":"...","msg":"request.finish","requestId":"...","meta":{"method":"GET","path":"/healthz","status":200,"durationMs":3}}
```

### API error handling

- API errors are caught by a centralized error handler that logs the error, captures it to Sentry (when enabled), and returns a structured JSON response:

```
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal Server Error"
  },
  "requestId": "..."
}
```

- A sample endpoint `/api/error` intentionally throws to demonstrate the behavior.

### Client UI error boundary

- The static UI (served from `/`) includes a React-based error boundary that shows a friendly error message with a Retry button.
- You can trigger a client-side error to see the fallback, or call `/api/error` to see API error handling.

### Health check endpoint

- `GET /healthz` returns a detailed status object including DB, Redis, and S3 connectivity checks. Example response:

```
{
  "status": "degraded",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "checks": {
    "db": { "status": "skipped", "details": "DB connection not configured" },
    "redis": { "status": "skipped", "details": "Redis connection not configured" },
    "s3": { "status": "skipped", "details": "S3 bucket/region not configured" }
  },
  "requestId": "..."
}
```

- When configuration is provided, the checks perform lightweight TCP or HTTP probes.

### Worker logging and failure persistence

- The `worker/worker.js` module includes a generic `processJob(job, handler, opts)` helper that logs:
  - job start, success, and failure
  - attempts and retry delays
  - durations for attempts and total processing time
- On final failure, the failure reason and error are stored in `data/job_failures.json`.
- Run `npm run worker` to execute a small demo showing one successful and one failing job.

### Sentry placeholders

- The app exposes `src/sentry.js` with `initSentry()` and `captureException()`.
- When `SENTRY_ENABLED=true` and `SENTRY_DSN` are set, it attempts to initialize `@sentry/node` if the dependency is available.
- If the SDK is not installed or variables are missing, it falls back gracefully and logs the event only.

## Configuration (env vars)

- General
  - `PORT` (default: 3000)
  - `NODE_ENV` (default: development)
  - `LOG_LEVEL` (trace|debug|info|warn|error|fatal; default: info)
  - `JSON_LOGS` (true|false; default: true)
  - `REQUEST_ID_HEADER` (default: x-request-id)
- Sentry
  - `SENTRY_ENABLED` (true|false; default: false)
  - `SENTRY_DSN` (string; optional)
  - `SENTRY_TRACES_SAMPLE_RATE` (0..1; default: 0)
- Health checks
  - DB: set one of
    - `DB_HOST` and `DB_PORT`
    - `DATABASE_URL` (host/port will be parsed from the URL)
  - Redis: set one of
    - `REDIS_HOST` and `REDIS_PORT`
    - `REDIS_URL`
  - S3: set both
    - `AWS_S3_BUCKET`
    - `AWS_REGION`
- Data persistence
  - `DATA_DIR` (default: `./data`) — used to store `job_failures.json`

## Project structure

- `server/index.js` — Express server, middleware, routes, and error handler
- `src/logger.js` — lightweight structured logger
- `src/context.js` — AsyncLocalStorage request context (requestId)
- `src/health.js` — health check implementations for DB, Redis, S3
- `src/sentry.js` — Sentry placeholders with env-driven enablement
- `src/db.js` — simple persistence for worker failure reasons
- `worker/worker.js` — job processing helper and demo
- `public/` — static UI with a React error boundary

## Notes

- This repo avoids adding heavy SDK dependencies by using lightweight TCP/HTTP checks and optional Sentry loading. If you prefer, you can add `@sentry/node`, `ioredis`, or database client libraries and enhance the corresponding integrations.
- Logs are written to stdout/stderr in JSON format by default to facilitate ingestion by log aggregators.
