Background removal queue (BullMQ + Upstash) with sync fallback

Overview
- Queue: background-removal using BullMQ
- Redis: Upstash REST API via @upstash/redis IORedisAdapter
- DB: SQLite (better-sqlite3)
- API: Express server
- Worker: dedicated process consuming the queue

Status lifecycle
PENDING -> PROCESSING -> DONE/FAILED
Timestamps and failureReason are stored on the image_jobs table. Attempts and logs are recorded.

Getting started
1) Copy .env.example to .env and configure your environment
2) Install dependencies
   pnpm install

3) Start API server (sync fallback works without Redis)
   pnpm start
   # POST /api/jobs/background-removal with JSON {"userId":"u1","sourceKey":"image.png"}

4) Start worker (only needed when QUEUE_MODE=redis and Upstash configured)
   pnpm worker

Environment variables
- QUEUE_MODE=redis | sync
- UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (required for redis mode)
- BACKGROUND_REMOVAL_API_KEY: required for job processing
- DAILY_JOB_LIMIT: per-user limit per day (default 25)
- DB_PATH: path to SQLite database (default ./data/db.sqlite)
- QUEUE_ATTEMPTS: default 3
- QUEUE_BACKOFF_MS: exponential backoff base delay (default 2000)

Endpoints
- GET /health
- POST /api/jobs/background-removal { userId, sourceKey }
- GET /api/jobs/:id

Notes
- When Redis is not configured or QUEUE_MODE is set to sync, the API processes jobs synchronously to maximize reliability for MVP environments.
- When Redis is configured, the API enqueues jobs and returns immediately; the worker then processes and updates status in the DB.
