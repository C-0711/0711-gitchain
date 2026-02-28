# GitChain API - Production Dockerfile
# Multi-stage build for minimal image size and security

# ===========================================
# Stage 1: Dependencies
# ===========================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files for dependency resolution
COPY apps/api/package.json ./apps/api/
COPY packages/chain/package.json ./packages/chain/
COPY packages/core/package.json ./packages/core/
COPY packages/git/package.json ./packages/git/
COPY packages/inject/package.json ./packages/inject/
COPY packages/ipfs/package.json ./packages/ipfs/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# ===========================================
# Stage 2: Builder
# ===========================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/chain/node_modules ./packages/chain/node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/git/node_modules ./packages/git/node_modules
COPY --from=deps /app/packages/inject/node_modules ./packages/inject/node_modules
COPY --from=deps /app/packages/ipfs/node_modules ./packages/ipfs/node_modules

# Copy source files
COPY package.json pnpm-workspace.yaml tsconfig.json ./
COPY apps/api ./apps/api
COPY packages/chain ./packages/chain
COPY packages/core ./packages/core
COPY packages/git ./packages/git
COPY packages/inject ./packages/inject
COPY packages/ipfs ./packages/ipfs

# Build all packages and API
RUN pnpm --filter @0711/core build && \
    pnpm --filter @0711/chain build && \
    pnpm --filter @0711/git build && \
    pnpm --filter @0711/inject build && \
    pnpm --filter @0711/ipfs build && \
    pnpm --filter @0711/api build

# ===========================================
# Stage 3: Production Runner
# ===========================================
FROM node:20-alpine AS runner

# Security: Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gitchain

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=builder --chown=gitchain:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=gitchain:nodejs /app/apps/api/package.json ./

# Copy workspace packages (built)
COPY --from=builder --chown=gitchain:nodejs /app/packages/core/dist ./node_modules/@0711/core/dist
COPY --from=builder --chown=gitchain:nodejs /app/packages/core/package.json ./node_modules/@0711/core/
COPY --from=builder --chown=gitchain:nodejs /app/packages/chain/dist ./node_modules/@0711/chain/dist
COPY --from=builder --chown=gitchain:nodejs /app/packages/chain/package.json ./node_modules/@0711/chain/
COPY --from=builder --chown=gitchain:nodejs /app/packages/git/dist ./node_modules/@0711/git/dist
COPY --from=builder --chown=gitchain:nodejs /app/packages/git/package.json ./node_modules/@0711/git/
COPY --from=builder --chown=gitchain:nodejs /app/packages/inject/dist ./node_modules/@0711/inject/dist
COPY --from=builder --chown=gitchain:nodejs /app/packages/inject/package.json ./node_modules/@0711/inject/
COPY --from=builder --chown=gitchain:nodejs /app/packages/ipfs/dist ./node_modules/@0711/ipfs/dist
COPY --from=builder --chown=gitchain:nodejs /app/packages/ipfs/package.json ./node_modules/@0711/ipfs/

# Install production dependencies only
COPY --from=deps /app/node_modules ./node_modules

# Switch to non-root user
USER gitchain

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the server
CMD ["node", "dist/index.js"]
