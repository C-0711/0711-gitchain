# GitChain Hub - Production Dockerfile
# Next.js standalone build for minimal image size

# ===========================================
# Stage 1: Build
# ===========================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

WORKDIR /app

# Copy everything needed for build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/hub ./apps/hub
COPY packages/core ./packages/core

# Install dependencies (shamefully-hoist for flat node_modules)
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Build core package first
RUN pnpm --filter @0711/core build

# Build Next.js with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter @0711/hub build

# ===========================================
# Stage 2: Production Runner
# ===========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Security: Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy public assets
COPY --from=builder /app/apps/hub/public ./public

# Copy standalone build (monorepo-aware path)
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/hub/.next/static ./apps/hub/.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the server (monorepo standalone path)
CMD ["node", "apps/hub/server.js"]
