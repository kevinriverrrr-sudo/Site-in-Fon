Deployment and Operations Guide

This repository includes a minimal Node.js app and worker, plus exhaustive deployment documentation and templates to help you wire up your own application to Vercel, Upstash Redis, Neon/Render Postgres, and S3-compatible storage (AWS S3, Cloudflare R2, MinIO for local).

Even if your app differs from this minimal example, you can adopt the .env, Dockerfile, and docker-compose patterns and follow the deployment guidance below.

Contents
- Environment variables
- Local development
  - With Docker Compose (recommended)
  - Without Docker
- Database seeding (admin user) and email verification in staging
- Deployment
  - Vercel (Web)
  - Upstash Redis (Queues/Cache)
  - Neon or Render (Postgres)
  - S3-compatible storage (AWS S3, Cloudflare R2, MinIO)
  - Background worker hosting (Render, Fly.io, Railway, etc.)
  - Monitoring and process alignment
- Docker builds and images
- Billing webhooks and feature flags

Environment variables
- Copy .env.example to .env and fill the values.
- Variables are validated at runtime using envalid in src/env.js. The .env.example is aligned with this validation and includes comments for each variable.
- Key groups:
  - App: NODE_ENV, PORT, APP_URL
  - Database: DATABASE_URL, DIRECT_URL
  - Queue/Redis: REDIS_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, QUEUE_PROVIDER, WORKER_CONCURRENCY
  - Storage: S3_PROVIDER, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET, S3_ENDPOINT, S3_FORCE_PATH_STYLE
  - Email: SMTP_* variables and optional RESEND_API_KEY
  - Auth/Security: SESSION_SECRET, JWT_SECRET
  - Billing: FEATURE_BILLING_ENABLED, BILLING_PROVIDER, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DISABLE_BILLING_WEBHOOK_PROCESSING
  - Observability: SENTRY_DSN, POSTHOG_API_KEY, POSTHOG_HOST
  - Misc: LOG_LEVEL, RATE_LIMIT_REDIS_PREFIX, CACHE_TTL_SECONDS

Local development
A. With Docker Compose (recommended)
1) Create env file
- cp .env.example .env
- Adjust values as needed. The provided docker-compose.yml will wire the app to Postgres, Redis, Mailpit (SMTP), and optional MinIO.

2) Start the stack
- docker compose up -d --build
- Services:
  - App: http://localhost:3000
  - Postgres: localhost:5432 (db container)
  - Redis: localhost:6379 (redis container)
  - Mailpit UI: http://localhost:8025 (SMTP sink at :1025)
  - MinIO: http://localhost:9001 (console), S3 API at :9000

3) Seed an admin user
- docker compose exec app sh -lc "ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=changeme pnpm seed"
- The seed script creates the users table if it does not exist and inserts an admin user.
- By default, if FEATURE_EMAIL_VERIFICATION_BYPASS=true, the admin user will be marked email_verified=true.

4) Run the background worker
- docker compose up -d worker
- The worker subscribes to a Redis pub/sub channel named jobs and logs received messages.

5) Test email in local
- Visit http://localhost:8025 to see captured emails via Mailpit.

B. Without Docker
Prerequisites
- Node.js >= 18 and pnpm >= 8
- Local Postgres and Redis, or run them with Docker:
  - Postgres: docker run --name dev-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app -p 5432:5432 -d postgres:15-alpine
  - Redis: docker run --name dev-redis -p 6379:6379 -d redis:7-alpine
  - Mailpit (optional): docker run --name mailpit -p 8025:8025 -p 1025:1025 -d axllent/mailpit

Steps
1) cp .env.example .env and set values
2) pnpm install
3) pnpm dev (starts the app on PORT)
4) pnpm worker (in another terminal) to run the worker
5) Seed admin: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=changeme pnpm seed

Endpoints
- GET /healthz -> returns "ok"
- GET / -> returns app status JSON

Database seeding and staging email verification
- Seeding admin user:
  - Use the seed script provided: pnpm seed
  - Requires DATABASE_URL and optional ADMIN_EMAIL/ADMIN_PASSWORD env variables.
- Email verification in staging:
  - Configure SMTP_* variables to point at your staging SMTP provider (or Mailpit for non-production).
  - To bypass email verification flows in staging, set FEATURE_EMAIL_VERIFICATION_BYPASS=true.
  - If using a provider like Resend, set RESEND_API_KEY and leave SMTP_* unset.

Deployment
Vercel (Web)
- Recommended architecture:
  - Host the web (Next.js front-end or static) on Vercel.
  - Host long-lived background worker processes on a separate platform (Render, Fly.io, Railway, ECS, etc.). Vercel does not run persistent background processes.
  - Use managed services:
    - Upstash Redis for queue and cache
    - Neon or Render for Postgres
    - AWS S3 or Cloudflare R2 for object storage

- Vercel configuration:
  - Build Command: pnpm install && pnpm build (adjust for your framework, e.g., next build)
  - Install Command: pnpm install
  - Output: framework default (Next.js, etc.)
  - Environment Variables: add all from .env.example relevant to the web runtime (avoid worker-specific vars if not needed).

- Background tasks on Vercel:
  - Use Vercel Cron or On-Demand ISR for scheduled/short tasks, but do not rely on it for queue processing.
  - For durable queue processing, run a separate worker service using the same environment variables and Redis/DB.

Upstash Redis
- Create a Redis database in Upstash.
- If using direct Redis (TLS) URL, set REDIS_URL to the connection string provided by Upstash.
- If using the REST API, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. Match your queue library capabilities accordingly.
- Set RATE_LIMIT_REDIS_PREFIX for rate limiting if used.

Neon or Render Postgres
- Provision a database and obtain the connection string.
- Set DATABASE_URL in all environments (web, worker, migrations/seed jobs).
- For migration tools that use a separate direct connection (e.g., Prisma DIRECT_URL), set DIRECT_URL as needed.

S3-compatible storage
- AWS S3:
  - S3_PROVIDER=aws
  - Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET
- Cloudflare R2:
  - S3_PROVIDER=r2
  - Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
  - Set S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
  - S3_BUCKET=<your-bucket>, S3_FORCE_PATH_STYLE=true
- MinIO (local):
  - S3_PROVIDER=minio
  - S3_ENDPOINT=http://localhost:9000
  - S3_BUCKET=local-bucket
  - AWS_ACCESS_KEY_ID=minioadmin, AWS_SECRET_ACCESS_KEY=minioadmin, S3_FORCE_PATH_STYLE=true
  - Create a bucket via MinIO Console at http://localhost:9001

Background worker hosting
- Use any platform that supports always-on processes (Render, Fly.io, Railway, ECS, Kubernetes, etc.).
- Start command: pnpm worker
- Scale concurrency via WORKER_CONCURRENCY.
- Ensure the worker has access to the same DATABASE_URL and Redis credentials as the web.

Monitoring and process alignment
- Web:
  - Health check endpoint: /healthz
  - Logs via platform provider (Vercel/Render).
- Worker:
  - Logs via platform provider.
  - Queue visibility via Upstash dashboard.
- Observability:
  - Set SENTRY_DSN, POSTHOG_API_KEY, POSTHOG_HOST if used.

Docker builds and images
- Build locally: docker build -t app:local .
- Run: docker run -it --rm -p 3000:3000 --env-file .env app:local
- The Dockerfile uses pnpm and runs pnpm start by default.
- The docker-compose.yml defines app, worker, db, redis, mailpit, and optional minio services for a complete local stack.

Billing webhooks and feature flags
- Future billing hooks:
  - BILLING_PROVIDER (stripe|none)
  - STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be set to enable billing flows.
- Disabling processing when missing keys:
  - If FEATURE_BILLING_ENABLED=false or STRIPE_SECRET_KEY is empty, the worker will log and skip billing processing.
  - You can also force-disable via DISABLE_BILLING_WEBHOOK_PROCESSING=true.

Scripts
- pnpm start — starts the HTTP app
- pnpm worker — starts the background worker
- pnpm seed — seeds an admin user (requires DATABASE_URL); use ADMIN_EMAIL/ADMIN_PASSWORD to configure

Notes
- This repo provides a minimal runnable baseline to validate the Dockerfile and orchestration. Replace or expand the app and worker logic as needed for your actual project.
