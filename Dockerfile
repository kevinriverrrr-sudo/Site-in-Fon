# Multi-stage Dockerfile for app + worker
FROM node:20-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && apk add --no-cache libc6-compat

WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN pnpm install --frozen-lockfile=false

FROM base AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["pnpm", "start"]
