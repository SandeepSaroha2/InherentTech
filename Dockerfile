# syntax=docker/dockerfile:1.6
# Generic Dockerfile for InherentTech monorepo apps (ats / aiocrm / web / kudodoc / jobplatform).
# Build with --build-arg APP=<app-name>.
#
# Examples:
#   docker build --build-arg APP=ats     -t inherenttech/ats:staging .
#   docker build --build-arg APP=aiocrm  -t inherenttech/aiocrm:staging .
#
# Result: a slim runner image (~150-200 MB) using Next.js standalone output
# plus only the workspace deps each app actually traces.

ARG NODE_VERSION=20-alpine

# ─── Stage 1: deps ──────────────────────────────────────────────────────────
# Install ALL workspace deps once. Cached unless package-lock.json changes.
FROM node:${NODE_VERSION} AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo

# Copy ONLY the manifests so this layer caches well.
COPY package.json package-lock.json turbo.json ./
COPY packages/db/package.json       packages/db/
COPY packages/shared/package.json   packages/shared/
COPY packages/ui/package.json       packages/ui/
COPY packages/config/package.json   packages/config/
COPY apps/ats/package.json          apps/ats/
COPY apps/aiocrm/package.json       apps/aiocrm/
COPY apps/web/package.json          apps/web/
COPY apps/kudodoc/package.json      apps/kudodoc/
COPY apps/jobplatform/package.json  apps/jobplatform/

# Install with cache mount — fast rebuilds.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --no-audit --no-fund

# ─── Stage 2: builder ───────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
ARG APP
RUN test -n "$APP" || (echo "ERROR: --build-arg APP=<app-name> is required" && exit 1)
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY . .

# Generate Prisma client (every app uses @inherenttech/db)
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

# Build only the requested app (Turbo handles the dependency graph)
RUN --mount=type=cache,target=/repo/.turbo \
    npx turbo build --filter=@inherenttech/${APP}

# ─── Stage 3: runner ────────────────────────────────────────────────────────
# Minimal image: only the standalone server bundle + static + public.
FROM node:${NODE_VERSION} AS runner
ARG APP
RUN test -n "$APP" || (echo "ERROR: --build-arg APP=<app-name> is required" && exit 1)

# Run as non-root for security
RUN addgroup -S nodejs && adduser -S -G nodejs nextjs
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    APP_NAME=${APP}

# Standalone bundle (Next.js writes the entry server.js + a minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/.next/standalone ./
# Static assets aren't part of standalone — copy them separately
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/.next/static       ./apps/${APP}/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/public             ./apps/${APP}/public

USER nextjs

# Each app's runtime port comes from PORT env (default 3000). Cloudflare tunnel
# in front does TLS + routing so we don't need HTTPS in the container.
ENV PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000

# Healthcheck — Next.js doesn't ship a /health route by default. Hit / and accept any 2xx/3xx.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

CMD node apps/${APP_NAME}/server.js
