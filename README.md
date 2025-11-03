# Auth Implementation: NextAuth + Prisma + Credentials + Magic Links

This project implements authentication using NextAuth (Auth.js) with a Prisma adapter and a Credentials provider for email+password. It supports secure password hashing using bcrypt, email verification via magic links, password reset, and an admin seed script.

## Tech
- Next.js App Router (app/)
- NextAuth (auth.js) with Credentials provider and Prisma adapter
- Prisma ORM (SQLite by default for easy local dev)
- Nodemailer (dev transport by default; SMTP config for production)

## Environment
Create a `.env` file with at least the following variables:

```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-strong-random-string"
EMAIL_FROM="no-reply@example.com"

# Optional SMTP settings for production
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# Optional admin email for seeding
ADMIN_EMAIL=admin@example.com
```

SQLite is used by default so you can run locally without extra setup. If you switch to Postgres/MySQL, update `prisma/schema.prisma` and `DATABASE_URL` accordingly.

## Install & Setup

- Install dependencies:
  - `pnpm install`
- Initialize the database:
  - `pnpm prisma:generate`
  - `pnpm prisma:migrate --name init`

## Run Dev Server

- `pnpm dev`
- Open http://localhost:3000

## API Routes (App Router)

- `POST /api/auth/register` — body: `{ "email": string, "password": string }`
  - Creates a user (role=USER, status=PENDING, dailyLimit=30), hashes the password with bcrypt, and emails a magic link for verification.
- `GET /api/auth/verify?token=...&email=...` — verifies the magic link token and activates the account (sets emailVerified and status=ACTIVE).
- `POST /api/auth/request-reset` — body: `{ "email": string }` — emails a reset link (if user exists and not banned).
- `POST /api/auth/reset` — body: `{ "email": string, "token": string, "password": string }` — sets a new password after verifying the token.
- `GET/POST /api/auth/[...nextauth]` — NextAuth route for credential sign-in.

### Credentials Sign-in
Send a request to `/api/auth/[...nextauth]` with the Credentials provider using email+password. Unverified (no emailVerified) and banned users are blocked.

## Email Delivery
- In development, a stream transport is used and emails are logged to the terminal (no messages are actually sent).
- In production, configure SMTP via environment variables.

## Session Security
JWT and session callbacks include `role` and `status`. Banned users cannot sign in. The session contains:
- `role` — USER | ADMIN
- `status` — PENDING | ACTIVE | BANNED
- `dailyLimit` — number

## Seeding an Admin User
Run `pnpm seed` to create or update an initial ADMIN user with a secure random password:

```
pnpm seed
```

The script prints the generated password and the email. Configure `ADMIN_EMAIL` in `.env` to change the admin email.

## Notes
- Passwords are stored hashed with bcrypt in `User.hashedPassword`.
- Verification and password reset tokens are persisted in the `VerificationToken` model (with a `type` field distinguishing VERIFY_EMAIL vs PASSWORD_RESET).
- The Prisma schema includes `role`, `status`, and `dailyLimit` on the User model.

## Development Tips
If you change the Prisma schema, regenerate the client and apply a migration:

```
pnpm prisma:generate
pnpm prisma:migrate --name your-change
```
