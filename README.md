# Prisma + PostgreSQL initialization

This repository is configured with Prisma ORM and a PostgreSQL schema, including common auth and application models.

## What you get

- Prisma schema at `prisma/schema.prisma` with:
  - PostgreSQL datasource (`DATABASE_URL`)
  - Prisma Client generator
  - Models: `User`, `Account`, `Session`, `VerificationToken`, `UsageLog`, `ImageJob`
  - Enums for roles and statuses
  - Relations: one-to-many from `User` to `UsageLog` and `ImageJob`
  - Useful indexes and constraints (e.g., unique email, compound index on `UsageLog(userId, date)`, index on `ImageJob(status)`)
- Initial migration in `prisma/migrations/0001_init`
- Prisma Client helper at `lib/prisma.ts` (safe for Next.js hot reloads)
- Package scripts for Prisma workflows

## Prerequisites

- Node.js 18+
- pnpm (recommended): https://pnpm.io/installation

## Local database setup

You can use either Docker (recommended) or a hosted Postgres provider like Neon.

### Option A: Docker Compose (local Postgres)

1. Create a `docker-compose.yml` in the project root with the following content:

   ```yaml
   version: '3.8'
   services:
     db:
       image: postgres:16-alpine
       environment:
         POSTGRES_PASSWORD: postgres
         POSTGRES_USER: postgres
         POSTGRES_DB: appdb
       ports:
         - '5432:5432'
       volumes:
         - pgdata:/var/lib/postgresql/data
   volumes:
     pgdata:
   ```

2. Start Postgres:

   - `docker compose up -d`

3. Copy `.env.example` to `.env` and adjust if needed:

   - `cp .env.example .env`

   Default content (works with the compose file above):

   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb?schema=public`

### Option B: Neon (hosted Postgres)

1. Create a database at https://neon.tech/
2. Copy the connection string and set it as `DATABASE_URL` in your `.env`.

## Install dependencies

```bash
pnpm install
```

## Run migrations and generate Prisma Client

- Create and apply the initial migration (and any future changes):

```bash
pnpm prisma migrate dev
```

- Generate Prisma Client (also runs on postinstall):

```bash
pnpm prisma generate
```

After this, you can import the Prisma Client from the helper:

```ts
import prisma from './lib/prisma'
```

## Models overview

- User
  - role: USER | ADMIN
  - status: ACTIVE | BANNED
  - dailyLimit: number (default 0)
  - adminMetadata: JSON (optional)
  - Relations: accounts, sessions, imageJobs, usageLogs
- Account, Session, VerificationToken
  - Compatible with NextAuth.js conventions
- UsageLog
  - Tracks per-user usage by date and action
  - Indexed on (userId, date)
- ImageJob
  - status: PENDING | PROCESSING | COMPLETED | FAILED
  - sourceKey, resultKey, failureReason
  - Indexed on status for queue processing

## Scripts

- `pnpm prisma:generate` – Generate Prisma Client
- `pnpm prisma:migrate` – Run `prisma migrate dev --name init`

You can also call Prisma directly through pnpm:

- `pnpm prisma migrate dev`
- `pnpm prisma generate`

## Notes

- Ensure your `.env` is not committed. Use `.env.example` for sharing defaults.
- The migration lockfile is configured for PostgreSQL.
