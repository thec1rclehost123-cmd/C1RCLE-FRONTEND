# syntax=docker/dockerfile:1
#
# C1RCLE Guest Portal — self-contained production image.
#
# Built from the repository root so the workspace and lockfile are in context:
#   docker build -f apps/guest-portal/Dockerfile -t c1rcle/guest-portal .
#
# The three applications produce three separate images and deploy separately.

FROM node:22.22.2-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

# ---- Prune the workspace down to this app and its real dependencies --------
FROM base AS pruner
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@2.10.8 prune @c1rcle/app-guest-portal --docker

# ---- Install and build -----------------------------------------------------
FROM base AS builder
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .

# NEXT_PUBLIC_* values are inlined at build time, so they must be present here.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_ENVIRONMENT
ARG SITE_URL=https://thec1rcle.com
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT \
    SITE_URL=$SITE_URL

RUN pnpm turbo run build --filter=@c1rcle/app-guest-portal

# ---- Runtime ---------------------------------------------------------------
FROM node:22.22.2-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000

# Never run the server as root.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/guest-portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/guest-portal/.next/static ./apps/guest-portal/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/guest-portal/public ./apps/guest-portal/public

EXPOSE 3000
CMD ["node", "apps/guest-portal/server.js"]
