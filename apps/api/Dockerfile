# GitChain API - Production Dockerfile
# Multi-stage build for minimal image size and security

# ===========================================
# Stage 1: Build
# ===========================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

WORKDIR /app

# Copy everything needed for build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/api ./apps/api
COPY packages/chain ./packages/chain
COPY packages/core ./packages/core
COPY packages/git ./packages/git
COPY packages/inject ./packages/inject
COPY packages/ipfs ./packages/ipfs

# Install dependencies (shamefully-hoist creates flat node_modules without symlinks)
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Build all packages and API
RUN pnpm --filter @0711/core build && \
    pnpm --filter @0711/chain build && \
    pnpm --filter @0711/git build && \
    pnpm --filter @0711/inject build && \
    pnpm --filter @0711/ipfs build && \
    pnpm --filter @0711/api build

# Dereference symlinks and bake workspace packages into node_modules
RUN cp -rL /app/node_modules /app/flat_modules 2>/dev/null || true && \
    mkdir -p /app/flat_modules/@0711 && \
    cp -r /app/packages/core /app/flat_modules/@0711/core && \
    cp -r /app/packages/chain /app/flat_modules/@0711/chain && \
    cp -r /app/packages/git /app/flat_modules/@0711/git && \
    cp -r /app/packages/inject /app/flat_modules/@0711/inject && \
    cp -r /app/packages/ipfs /app/flat_modules/@0711/ipfs

# ===========================================
# Stage 2: Production Runner
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

# Copy dereferenced node_modules with workspace packages baked in
COPY --from=builder --chown=gitchain:nodejs /app/flat_modules ./node_modules

# Switch to non-root user
USER gitchain

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the server
CMD ["node", "dist/index.js"]
