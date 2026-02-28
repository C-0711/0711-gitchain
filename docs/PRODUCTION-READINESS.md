# GitChain — Production Readiness Task List

**Created:** 2026-02-27
**Goal:** 100% production-ready platform
**Estimated Total Effort:** 6–8 weeks (1 developer)
**Priority Legend:** 🔴 CRITICAL (blocks launch) · 🟠 HIGH · 🟡 MEDIUM · 🟢 NICE-TO-HAVE

---

## Phase 0 — Security Hardening (Week 1)
> Without these, the platform is exploitable in production.

### 0.1 🔴 Remove All Hardcoded Secrets
- [ ] `apps/hub/src/lib/db.ts` — Remove fallback `password: "gitchain2026"`
- [ ] `apps/hub/src/app/api/auth/*/route.ts` — Remove fallback `JWT_SECRET: "gitchain-secret-key-2026"`
- [ ] `apps/api/src/services/auth.ts` — Remove `JWT_SECRET: "gitchain-dev-secret-change-in-production"`
- [ ] All services MUST throw on missing env vars — never fall back to defaults
- [ ] Create `.env.example` with all required vars documented
- [ ] Create `.env.production.example` with production-safe defaults
- [ ] Add `.env*` entries to `.gitignore` (verify no secrets in git history)
- [ ] Audit git history for leaked secrets: `git log --all -p | grep -i "password\|secret\|key"` — rotate any found

### 0.2 🔴 Fix JWT Authentication
- [ ] Replace manual base64 decode (`Buffer.from(token.split(".")[1])`) with `jwt.verify()` in ALL locations
- [ ] Hub API: `src/lib/db.ts` → `getUserIdFromToken()` — must use `jwt.verify(token, JWT_SECRET)`
- [ ] Hub API: `src/app/api/organizations/*/route.ts` — same fix
- [ ] Hub API: `src/app/api/teams/*/route.ts` — same fix
- [ ] API: Ensure `verifyToken()` in auth service uses proper verification (already does, but audit all call sites)
- [ ] Add token expiry validation in every auth check
- [ ] Return 401 with `{ error: "Token expired" }` for expired tokens

### 0.3 🔴 Session Invalidation
- [ ] On password change (`/api/user/password`): invalidate ALL existing sessions for that user
- [ ] On password change: invalidate ALL JWT tokens (add `password_changed_at` column, reject tokens issued before it)
- [ ] On account deletion: revoke all sessions, API keys, and org memberships
- [ ] Add "Log out all devices" button to `/settings/security`
- [ ] Implement token blacklist (Redis set) for immediate revocation

### 0.4 🔴 Rate Limiting
- [ ] Install `express-rate-limit` (API app) or implement Next.js middleware rate limiting (Hub)
- [ ] Auth endpoints (`/api/auth/login`, `/api/auth/register`): 5 requests/minute per IP
- [ ] API key creation (`/api/user/tokens`): 10 requests/hour per user
- [ ] Container creation (`/api/containers` POST): 30 requests/minute per user
- [ ] Search (`/api/search`): 60 requests/minute per user
- [ ] Global default: 100 requests/minute per IP
- [ ] Return `429 Too Many Requests` with `Retry-After` header
- [ ] Log rate-limit violations to audit log

### 0.5 🔴 Security Headers
- [ ] Add Next.js middleware (`apps/hub/src/middleware.ts`) with:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  ```
- [ ] Add security headers in `next.config.js` as well (for static pages)
- [ ] API app: verify Helmet is configured correctly (not just defaults)
- [ ] Disable `X-Powered-By` header

### 0.6 🔴 Token Storage (Client-Side)
- [ ] Replace `localStorage.setItem("token", data.token)` with HTTP-only secure cookie
- [ ] Set cookie attributes: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`
- [ ] Add CSRF token for cookie-based auth (double-submit pattern or signed token)
- [ ] Update all API calls to stop sending `Authorization: Bearer` header (cookies are automatic)
- [ ] OR: If keeping localStorage, implement token refresh flow with short-lived access tokens (15 min) + refresh tokens (7 days)

### 0.7 🟠 Input Validation & Sanitization
- [ ] Install Zod (already in `@0711/core`) for all API routes
- [ ] Define request schemas for EVERY API endpoint:
  - [ ] `POST /api/auth/register` — email format, password strength (min 8, 1 upper, 1 number), name length
  - [ ] `POST /api/auth/login` — email format, password presence
  - [ ] `POST /api/containers` — container type enum, namespace format, required fields
  - [ ] `PATCH /api/user` — username format (alphanumeric + dash), bio max length (500), URL validation
  - [ ] `POST /api/organizations` — slug format (lowercase, alphanumeric, dash), name max length (100)
  - [ ] All remaining endpoints
- [ ] Validate query parameters (limit: 1-100, offset: >=0, sort: allowed values)
- [ ] Strip HTML from all text inputs (prevent stored XSS)
- [ ] Validate file uploads: allowed MIME types, max file size
- [ ] Return structured validation errors: `{ errors: [{ field: "email", message: "Invalid format" }] }`

### 0.8 🟠 Invite Token Security
- [ ] Add expiry check in `/api/invites/[token]/accept` (reject expired invites)
- [ ] Rate limit invite acceptance: 5 attempts per IP per hour
- [ ] Use cryptographically secure token generation (crypto.randomBytes(32))
- [ ] Hash invite tokens in database (store hash, compare hash)
- [ ] One-time use: mark invite as consumed after acceptance

---

## Phase 1 — Infrastructure & Deployment (Week 1–2)
> Fix the broken Docker setup and create production-grade deployment.

### 1.1 🔴 Fix Dockerfile (API)
- [ ] Multi-stage build:
  - Stage 1 (builder): `FROM node:20-alpine`, install pnpm, copy workspace, build TypeScript
  - Stage 2 (runtime): `FROM node:20-alpine`, copy only `dist/` and `node_modules` (production)
- [ ] Include ALL dependencies from package.json (pg, bcryptjs, jsonwebtoken, helmet, cors, etc.)
- [ ] Do NOT use `tsx` in production — compile to JavaScript
- [ ] Add health check: `HEALTHCHECK --interval=30s CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok || process.exit(1))"`
- [ ] Set `NODE_ENV=production`
- [ ] Run as non-root user: `USER node`
- [ ] Pin base image version: `FROM node:20.11-alpine`

### 1.2 🔴 Fix Dockerfile (Hub)
- [ ] Create `apps/hub/Dockerfile` with multi-stage Next.js build
- [ ] Stage 1: Build with `next build` (standalone output)
- [ ] Stage 2: Copy `.next/standalone` and `.next/static`
- [ ] Health check on `/api/health` (create this endpoint)
- [ ] Run as non-root user

### 1.3 🔴 Production Docker Compose
- [ ] Rewrite `docker-compose.prod.yml`:
  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      volumes: [gitchain-pgdata:/var/lib/postgresql/data]
      environment: [from .env]
      healthcheck: pg_isready
      restart: unless-stopped
      deploy:
        resources:
          limits: { memory: 2G }

    redis:
      image: redis:7-alpine
      volumes: [gitchain-redis:/data]
      healthcheck: redis-cli ping
      restart: unless-stopped

    api:
      build: {context: ., dockerfile: apps/api/Dockerfile}
      depends_on: {postgres: {condition: service_healthy}, redis: {condition: service_healthy}}
      healthcheck: /health endpoint
      restart: unless-stopped
      deploy:
        resources:
          limits: { memory: 1G }

    hub:
      build: {context: ., dockerfile: apps/hub/Dockerfile}
      depends_on: {api: {condition: service_healthy}}
      healthcheck: /api/health endpoint
      restart: unless-stopped

    landing:
      build: {context: ., dockerfile: apps/landing/Dockerfile}
      restart: unless-stopped
  ```
- [ ] Add resource limits for all services
- [ ] Add logging driver configuration (`json-file` with max-size and max-file)
- [ ] Network isolation: internal network for db/redis, external for web-facing services
- [ ] Use `.env` file for all configuration (not hardcoded in compose)

### 1.4 🔴 Database Migration System
- [ ] Create migration runner script: `database/migrate.sh`
- [ ] Add version tracking table: `schema_migrations (version, applied_at)`
- [ ] Run migrations in order, skip already-applied
- [ ] Support rollback with `down` migration files
- [ ] Add to Docker Compose: init container or startup script that runs migrations
- [ ] Create seed script for development: `database/seed.sql` (demo users, namespaces, example containers)
- [ ] Document migration process in README

### 1.5 🔴 Database Backup Strategy
- [ ] Create backup script: `scripts/backup-db.sh` (pg_dump with timestamp)
- [ ] Add cron job for daily automated backups
- [ ] Backup retention: 7 daily, 4 weekly, 12 monthly
- [ ] Store backups in separate location (not same disk)
- [ ] Create restore script: `scripts/restore-db.sh`
- [ ] Test backup/restore cycle and document

### 1.6 🟠 Health Checks & Readiness
- [ ] API: `GET /health` → `{ status: "ok", db: "connected", redis: "connected", uptime: 12345 }`
- [ ] API: `GET /ready` → Only returns 200 when DB pool is ready and migrations are current
- [ ] Hub: `GET /api/health` → `{ status: "ok", api: "reachable" }`
- [ ] Each service checks its dependencies before reporting healthy
- [ ] Docker Compose uses health checks for dependency ordering

### 1.7 🟠 Environment Configuration
- [ ] Document ALL environment variables in `.env.example`:
  ```
  # Required
  DATABASE_URL=postgresql://gitchain:CHANGE_ME@postgres:5432/gitchain
  JWT_SECRET=CHANGE_ME_64_CHAR_RANDOM
  API_KEY_SALT=CHANGE_ME_32_CHAR_RANDOM

  # Optional
  REDIS_URL=redis://redis:6379
  BASE_RPC_URL=https://mainnet.base.org
  BLOCKCHAIN_PRIVATE_KEY=  # Only for anchoring service
  IPFS_GATEWAY=https://gateway.pinata.cloud

  # Deployment
  HUB_URL=https://app.gitchain.dev
  API_URL=https://api.gitchain.dev
  LANDING_URL=https://gitchain.dev
  ```
- [ ] Validate ALL required env vars on startup (fail fast with clear error messages)
- [ ] Never log secret values (mask in logs)

### 1.8 🟠 Reverse Proxy / TLS
- [ ] Add nginx or Caddy to Docker Compose as reverse proxy
- [ ] TLS termination with Let's Encrypt (auto-renewal)
- [ ] Route: `gitchain.dev` → landing, `app.gitchain.dev` → hub, `api.gitchain.dev` → api, `verify.gitchain.dev` → verify
- [ ] Websocket support (for future real-time features)
- [ ] Gzip compression
- [ ] Static asset caching headers (1 year for hashed assets)

---

## Phase 2 — Core Feature Completion (Week 2–3)
> Complete the scaffolded but unimplemented packages.

### 2.1 🔴 Blockchain Verification (End-to-End)
- [ ] `packages/chain/src/merkle.ts`:
  - [ ] Implement `buildMerkleTree(contentHashes: string[])` → returns root + proofs
  - [ ] Implement `verifyMerkleProof(root, leaf, proof)` → boolean
  - [ ] Use `@openzeppelin/merkle-tree` or `merkletreejs` library
  - [ ] Unit tests for tree construction and proof verification
- [ ] `packages/chain/src/service.ts`:
  - [ ] Implement `createBatch(containers: Container[])`:
    1. Compute content hash for each container
    2. Build Merkle tree from hashes
    3. Submit `certifyBatch()` to smart contract
    4. Store batch + proofs in `blockchain_batches` / `container_anchors` tables
    5. Update container `is_verified` flag
  - [ ] Implement `verifyContainer(containerId: string)`:
    1. Look up container's anchor (batch_id, merkle_proof, proof_index)
    2. Call `verifyCertification()` on smart contract
    3. Return verification result with tx hash, block number, timestamp
  - [ ] Implement batch scheduling: collect unanchored containers, batch every N minutes or N containers
- [ ] `packages/inject/src/verifier.ts`:
  - [ ] Replace mock `verifyOnChain()` with real chain package integration
  - [ ] Return actual blockchain proof data (tx hash, block, network)
- [ ] Hub UI:
  - [ ] Container detail "Chain" tab: show real verification status, tx link to BaseScan
  - [ ] "Verify" button: trigger on-demand verification
  - [ ] Verification badge (green checkmark with "Verified on Base" text)
- [ ] Verify App (`apps/verify/`):
  - [ ] Public verification page: enter container ID or content hash
  - [ ] Show Merkle proof, tx hash, block number, timestamp
  - [ ] QR code linking to verification page
  - [ ] No auth required — fully public

### 2.2 🟠 Git Versioning Package
- [ ] `packages/git/src/repository.ts`:
  - [ ] `initRepo(containerId)` — create bare repo in `GITCHAIN_DATA_DIR`
  - [ ] `commitData(containerId, data, message, author)` — serialize container data to files, git add, git commit
  - [ ] `getHistory(containerId, limit, offset)` — return commit list
  - [ ] `getDiff(containerId, commitA, commitB)` — return structured diff
  - [ ] `getFileAtCommit(containerId, commitHash, path)` — read file at specific version
- [ ] Use `isomorphic-git` (already a dependency)
- [ ] Store repos at: `{GITCHAIN_DATA_DIR}/{namespace}/{identifier}/`
- [ ] Wire into container creation/update flow:
  - [ ] On `POST /api/containers` → `initRepo()` + `commitData()`
  - [ ] On `PATCH /api/containers/:id` → `commitData()` with diff message
- [ ] Sync git commits with `container_commits` table
- [ ] Unit tests for init, commit, history, diff operations

### 2.3 🟠 IPFS Storage Package
- [ ] `packages/ipfs/src/client.ts`:
  - [ ] Configure Pinata or Infura IPFS provider
  - [ ] `uploadJSON(data)` → returns CID
  - [ ] `uploadFile(buffer, filename)` → returns CID
  - [ ] `fetch(cid)` → returns data
  - [ ] `pin(cid)` → ensure persistence
  - [ ] `unpin(cid)` → allow garbage collection
- [ ] Use for:
  - [ ] Blockchain batch `metadataUri` → IPFS CID pointing to batch metadata
  - [ ] Large container files (PDFs, images, CAD files)
  - [ ] Container snapshots for permanent archival
- [ ] Fallback: if IPFS unavailable, store locally and queue for upload
- [ ] Unit tests with mock IPFS provider

### 2.4 🟡 Digital Product Passport (DPP)
- [ ] `packages/dpp/src/generator.ts`:
  - [ ] Generate EU ESPR 2024/1781 compliant DPP from product container
  - [ ] Required fields: product identity, manufacturer, materials, sustainability, recyclability
  - [ ] Output formats: JSON-LD, PDF
- [ ] `packages/dpp/src/validator.ts`:
  - [ ] Validate DPP against EU schema
  - [ ] Return compliance report with missing/invalid fields
- [ ] Wire into product container creation: auto-generate DPP if container type = "product"
- [ ] Hub UI: DPP tab on product containers showing compliance status

### 2.5 🟡 C2PA Content Authenticity
- [ ] `packages/c2pa/src/signer.ts`:
  - [ ] Sign container data with C2PA manifest
  - [ ] Embed provenance information (creator, timestamp, tool, actions)
  - [ ] Support for image/PDF signing
- [ ] `packages/c2pa/src/verifier.ts`:
  - [ ] Verify C2PA manifest on container/file
  - [ ] Return chain of provenance
- [ ] Integration: add C2PA manifest to every container commit

### 2.6 🟡 SDK Package (`@0711/sdk`)
- [ ] `packages/sdk/src/client.ts`:
  ```typescript
  class GitChainClient {
    constructor(apiUrl: string, apiKey: string)
    // Containers
    async listContainers(options?: ListOptions): Promise<Container[]>
    async getContainer(id: string): Promise<Container>
    async createContainer(input: CreateInput): Promise<Container>
    async updateContainer(id: string, input: UpdateInput): Promise<Container>
    async deleteContainer(id: string): Promise<void>
    // Injection
    async inject(containerIds: string[], options?: InjectOptions): Promise<InjectedContext>
    // Verification
    async verify(containerId: string): Promise<VerificationResult>
    // Search
    async search(query: string, options?: SearchOptions): Promise<SearchResult>
    // Organizations
    async listOrgs(): Promise<Organization[]>
    async getOrg(slug: string): Promise<Organization>
  }
  ```
- [ ] Automatic retry with exponential backoff
- [ ] Request/response logging (optional, via config)
- [ ] TypeScript types exported
- [ ] Published to npm / GitHub Packages
- [ ] README with usage examples

### 2.7 🟡 CLI Tool (`@c-0711/cli`)
- [ ] `packages/cli/src/commands/`:
  - [ ] `login` — authenticate with API key or username/password
  - [ ] `containers list` — list containers with filters
  - [ ] `containers get <id>` — show container details
  - [ ] `containers create` — interactive container creation
  - [ ] `containers push <file>` — upload container from JSON/YAML file
  - [ ] `containers pull <id>` — download container to local file
  - [ ] `containers diff <id> <v1> <v2>` — show diff between versions
  - [ ] `inject <id1> <id2> ...` — inject containers, output to stdout
  - [ ] `verify <id>` — verify container on blockchain
  - [ ] `search <query>` — search containers
  - [ ] `config set <key> <value>` — set configuration (API URL, default namespace)
- [ ] Config stored in `~/.gitchain/config.json`
- [ ] Colored output with chalk, spinners with ora
- [ ] `--json` flag for machine-readable output
- [ ] `--quiet` flag for scripts
- [ ] Published to npm as `@c-0711/cli` with `gitchain` bin name

### 2.8 🟡 Python SDK
- [ ] `sdks/python/gitchain/client.py`:
  - [ ] Mirror TypeScript SDK functionality
  - [ ] `GitChainClient(api_url, api_key)`
  - [ ] All CRUD + inject + verify + search methods
  - [ ] Async support (httpx or aiohttp)
- [ ] Publish to PyPI as `gitchain`
- [ ] README with pip install instructions and usage examples

---

## Phase 3 — Hub UI Completion (Week 3–4)
> Polish the UI to production quality.

### 3.1 🔴 Error Handling UI
- [ ] Create `apps/hub/src/app/error.tsx` — global error boundary with "Something went wrong" page + retry button
- [ ] Create `apps/hub/src/app/not-found.tsx` — custom 404 page with search suggestion
- [ ] Create `apps/hub/src/app/loading.tsx` — global loading spinner/skeleton
- [ ] Add error boundaries to each major section (containers, orgs, settings)
- [ ] Show toast notifications for API errors (non-fatal)
- [ ] Show inline validation errors on forms

### 3.2 🔴 Auth Middleware (Next.js)
- [ ] Create `apps/hub/src/middleware.ts`:
  - [ ] Check for auth token on protected routes
  - [ ] Redirect to `/auth/login` if unauthenticated
  - [ ] Allow public routes: `/`, `/auth/*`, `/verify/*`, `/pricing`, `/docs/*`, `/api-reference`
  - [ ] Set security headers on all responses
  - [ ] Log request method + path + duration

### 3.3 🟠 Loading States & Skeletons
- [ ] Container list: skeleton cards while loading
- [ ] Container detail: skeleton layout (header, tabs, content area)
- [ ] Organization page: skeleton for member list, stats
- [ ] Settings pages: skeleton for form fields
- [ ] Use React Suspense + `loading.tsx` files in each route group
- [ ] Add optimistic updates for: member add/remove, container star/unstar

### 3.4 🟠 Pagination
- [ ] Container list (`/containers`): proper pagination with page numbers, prev/next
- [ ] Organization members: paginated member list
- [ ] Commit history: "Load more" or infinite scroll
- [ ] Search results: paginated with result count
- [ ] URL-synced pagination (e.g., `?page=2&limit=20`)

### 3.5 🟠 Search & Filtering
- [ ] Global search (Cmd+K): search containers, namespaces, organizations, users
- [ ] Container list: filter by type, namespace, visibility, verified status
- [ ] Container list: sort by name, created date, updated date, star count
- [ ] Debounce search inputs (300ms)
- [ ] URL-synced filters (e.g., `?type=product&namespace=bosch&sort=updated`)

### 3.6 🟠 Responsive Design
- [ ] Audit all pages on mobile (375px), tablet (768px), desktop (1280px)
- [ ] Fix AppShell sidebar: collapsible on mobile, hamburger menu
- [ ] Container detail: stack tabs vertically on mobile
- [ ] Tables: horizontal scroll on mobile or switch to card layout
- [ ] Forms: full-width inputs on mobile
- [ ] Navigation: mobile-first bottom nav or slide-out menu

### 3.7 🟡 Dark Mode
- [ ] Implement theme toggle (light/dark/system)
- [ ] Store preference in user settings (DB) and localStorage (guest)
- [ ] Convert all hardcoded hex colors to CSS variables / Tailwind dark: variants
- [ ] Test all pages in both themes
- [ ] Respect `prefers-color-scheme` media query

### 3.8 🟡 Accessibility (a11y)
- [ ] Add `aria-label` to all icon-only buttons
- [ ] Ensure all forms have proper `<label>` elements
- [ ] Keyboard navigation: tab order, focus rings, escape to close modals
- [ ] Screen reader testing (VoiceOver / NVDA)
- [ ] Color contrast: ensure 4.5:1 ratio for text, 3:1 for large text
- [ ] Add skip-to-content link

### 3.9 🟡 Profile & Settings Completion
- [ ] `/profile` page: wire "Save" button to `PATCH /api/user` (currently has `TODO: Save to API`)
- [ ] Avatar upload: file input → upload to storage → update user record
- [ ] Email verification flow: send verification email on register, show banner until verified
- [ ] 2FA setup: TOTP (Google Authenticator) — generate secret, show QR, verify code
- [ ] Account deletion: confirmation dialog, soft delete, 30-day grace period
- [ ] Export data: download all user's containers as JSON archive

### 3.10 🟡 Notification System
- [ ] In-app notifications bell (top nav)
- [ ] Notification types: org invite, container update, verification complete, new team member
- [ ] Database table: `notifications (id, user_id, type, title, body, read_at, created_at)`
- [ ] Mark as read / mark all as read
- [ ] Optional: email notifications (configurable per type in settings)

---

## Phase 4 — API Hardening (Week 3–4)
> Make the API robust and well-documented.

### 4.1 🔴 Consistent API Response Format
- [ ] Define standard response envelope:
  ```typescript
  // Success
  { data: T, meta?: { total, page, limit } }
  // Error
  { error: { code: string, message: string, details?: any } }
  ```
- [ ] Refactor ALL endpoints to use this format
- [ ] Error codes: `AUTH_REQUIRED`, `AUTH_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`
- [ ] Proper HTTP status codes everywhere (no 200 for errors)

### 4.2 🔴 API Versioning
- [ ] Prefix all API routes with `/v1/`
- [ ] Hub internal API: `/api/v1/containers`, `/api/v1/auth`, etc.
- [ ] External API: `api.gitchain.dev/v1/containers`
- [ ] Document versioning policy (semantic versioning, deprecation notice)
- [ ] `Api-Version` response header

### 4.3 🟠 OpenAPI / Swagger Documentation
- [ ] Generate OpenAPI 3.1 spec from API routes
- [ ] Include: all endpoints, request/response schemas, auth methods, error codes
- [ ] Serve Swagger UI at `/docs` on API app
- [ ] Generate TypeScript types from OpenAPI spec (for SDK)
- [ ] Generate Python types from OpenAPI spec (for Python SDK)
- [ ] Keep spec in sync with code (automated or manual review)

### 4.4 🟠 Structured Logging
- [ ] Install `pino` (fast, JSON-structured logging)
- [ ] Log format:
  ```json
  {"level":"info","time":1234567890,"msg":"Request","method":"GET","path":"/api/containers","status":200,"duration_ms":45,"user_id":"...","ip":"..."}
  ```
- [ ] Log levels: `error` (5xx), `warn` (4xx client errors), `info` (requests), `debug` (query details)
- [ ] Correlation ID: generate UUID per request, include in all logs and response headers (`X-Request-Id`)
- [ ] Never log: passwords, tokens, API keys (mask with `***`)
- [ ] In production: output to stdout (Docker captures), structured JSON format

### 4.5 🟠 Request Logging & Audit Trail
- [ ] Log ALL API requests to `access_log` table (already exists in schema)
- [ ] Fields: user_id, api_key_id, method, path, status, duration_ms, ip, user_agent
- [ ] Sensitive operations: also log request body (sanitized) to `organization_audit_log`
- [ ] Admin API: `GET /api/admin/audit?user_id=&action=&from=&to=` for querying audit logs

### 4.6 🟠 GraphQL Completion
- [ ] Complete GraphQL schema in API app:
  ```graphql
  type Query {
    container(id: ID!): Container
    containers(filter: ContainerFilter, pagination: Pagination): ContainerConnection
    namespace(name: String!): Namespace
    organization(slug: String!): Organization
    me: User
    search(query: String!, filter: SearchFilter): SearchResult
  }
  type Mutation {
    createContainer(input: CreateContainerInput!): Container
    updateContainer(id: ID!, input: UpdateContainerInput!): Container
    deleteContainer(id: ID!): Boolean
    inject(containerIds: [String!]!, options: InjectOptions): InjectedContext
    verify(containerId: String!): VerificationResult
  }
  ```
- [ ] Implement resolvers for all types
- [ ] Add DataLoader for N+1 query prevention
- [ ] Add query complexity analysis (prevent expensive queries)
- [ ] Add authentication to GraphQL context

### 4.7 🟡 Webhooks
- [ ] Database table: `webhooks (id, org_id, url, secret, events, active, created_at)`
- [ ] Events: `container.created`, `container.updated`, `container.verified`, `member.added`, `member.removed`
- [ ] Webhook delivery: POST to URL with HMAC-SHA256 signature in `X-GitChain-Signature` header
- [ ] Retry failed deliveries: 3 attempts with exponential backoff
- [ ] Webhook management UI in org settings
- [ ] Webhook logs: show delivery attempts, status codes, response times

### 4.8 🟡 File Upload & Storage
- [ ] Implement file upload endpoint: `POST /api/containers/:id/files`
- [ ] Support: images (jpg, png, webp), PDFs, JSON, CSV, CAD files (dwg, step, ifc)
- [ ] Max file size: 100MB (configurable)
- [ ] Storage backends: local filesystem (default), S3 (production), IPFS (archival)
- [ ] Generate thumbnails for images
- [ ] Virus scanning (ClamAV) for uploaded files
- [ ] Signed download URLs (expire after 1 hour)

---

## Phase 5 — Testing (Week 4–5)
> Zero tests = zero confidence. Build comprehensive test coverage.

### 5.1 🔴 Testing Infrastructure
- [ ] Configure Jest for all packages (already has `jest.config.js`)
- [ ] Configure Jest for Hub app (with Next.js `@testing-library/react`)
- [ ] Configure Supertest for API app (integration testing)
- [ ] Create test database: `gitchain_test` with fresh schema per test run
- [ ] Create test utilities:
  - [ ] `createTestUser()` — register + return token
  - [ ] `createTestContainer()` — create container + return ID
  - [ ] `createTestOrg()` — create org + return slug
  - [ ] `cleanupTestData()` — truncate all tables
- [ ] Add test scripts to root `package.json`: `test`, `test:unit`, `test:integration`, `test:e2e`, `test:coverage`
- [ ] Coverage threshold: 80% for core packages, 60% for apps

### 5.2 🔴 Unit Tests — Core Packages
- [ ] `@0711/core` (extend existing tests):
  - [ ] Container validation (valid/invalid schemas)
  - [ ] ID parsing edge cases (missing parts, invalid format, special chars)
  - [ ] Trust level hierarchy comparisons
  - [ ] Config loading with missing/invalid files
- [ ] `@0711/chain`:
  - [ ] Merkle tree: build tree, generate proof, verify proof (various sizes)
  - [ ] Content hash computation
  - [ ] Batch creation logic (without network calls)
- [ ] `@0711/inject`:
  - [ ] Injector: format output, token counting, citation collection
  - [ ] Formatter: markdown/json/yaml output (extend existing tests)
  - [ ] Cache: set/get/delete/invalidate operations (with mock Redis)
- [ ] `@0711/git`:
  - [ ] Repository: init, commit, history, diff (with temp directories)

### 5.3 🔴 Integration Tests — API
- [ ] Auth flow:
  - [ ] Register → login → get profile → change password → login with new password
  - [ ] Register with duplicate email → 409
  - [ ] Login with wrong password → 401
  - [ ] Access protected route without token → 401
  - [ ] Access protected route with expired token → 401
- [ ] Container CRUD:
  - [ ] Create → get → update → get (verify update) → delete → get (verify 404)
  - [ ] Create private container → access as owner (200) → access as stranger (403)
  - [ ] Create container → add collaborator → access as collaborator (200)
  - [ ] List containers with pagination, filtering, sorting
  - [ ] Search containers by text
- [ ] Organizations:
  - [ ] Create org → invite member → accept invite → verify membership
  - [ ] Role hierarchy: viewer can read, maintainer can write, admin can manage, owner can delete
  - [ ] Non-member cannot access private org resources
- [ ] Blockchain:
  - [ ] Create container → create batch → verify container
  - [ ] Verify with invalid proof → false

### 5.4 🟠 End-to-End Tests (Playwright)
- [ ] Install Playwright test runner: `@playwright/test`
- [ ] Critical user flows:
  - [ ] Register → Login → Create Namespace → Create Container → View Container
  - [ ] Login → Settings → Change Password → Logout → Login with new password
  - [ ] Login → Create Org → Invite Member → (accept as member) → View Org
  - [ ] Public verification: visit `/verify/<id>` → see verification result
  - [ ] Search: enter query → see results → click result → view container
- [ ] Visual regression tests (screenshot comparison) for key pages
- [ ] Run on CI with headless Chromium

### 5.5 🟡 Load Testing
- [ ] Install k6 or Artillery
- [ ] Scenarios:
  - [ ] 100 concurrent users browsing containers
  - [ ] 50 concurrent inject requests
  - [ ] 20 concurrent container creates
  - [ ] 10 concurrent search queries
- [ ] Target: p95 latency < 500ms, 0% error rate under load
- [ ] Identify bottlenecks (DB queries, memory, CPU)
- [ ] Document performance baselines

---

## Phase 6 — Monitoring & Observability (Week 5)
> Know what's happening in production before users tell you.

### 6.1 🔴 Application Monitoring
- [ ] Integrate error tracking (Sentry, or self-hosted GlitchTip):
  - [ ] Capture unhandled exceptions in API app
  - [ ] Capture unhandled exceptions in Hub app (client + server)
  - [ ] Include user context (user ID, email) in error reports
  - [ ] Source maps for production stack traces
- [ ] Alert on: error rate spike, 5xx rate > 1%, response time p95 > 2s

### 6.2 🟠 Metrics (Prometheus + Grafana)
- [ ] Expose `/metrics` endpoint on API app with:
  - [ ] `http_requests_total{method, path, status}` — request count
  - [ ] `http_request_duration_seconds{method, path}` — latency histogram
  - [ ] `db_query_duration_seconds{query}` — DB query latency
  - [ ] `db_pool_size` / `db_pool_available` — connection pool stats
  - [ ] `containers_total{type, namespace}` — container count
  - [ ] `blockchain_batches_total{status}` — batch counts
  - [ ] `inject_requests_total` — injection count
  - [ ] `active_users` — DAU/WAU/MAU
- [ ] Grafana dashboards (already running on port 3000):
  - [ ] Service health overview
  - [ ] Request rate & latency
  - [ ] Error rate
  - [ ] Database performance
  - [ ] Blockchain anchoring status
  - [ ] User activity

### 6.3 🟠 Uptime Monitoring
- [ ] External health check (UptimeRobot, Healthchecks.io, or self-hosted):
  - [ ] Check Hub: `https://app.gitchain.dev/api/health` every 60s
  - [ ] Check API: `https://api.gitchain.dev/health` every 60s
  - [ ] Check Verify: `https://verify.gitchain.dev` every 60s
  - [ ] Check DB connectivity (via health endpoint)
- [ ] Alert channels: email, Mattermost (port 8065)
- [ ] Status page (public): `status.gitchain.dev`

### 6.4 🟡 Log Aggregation
- [ ] Configure Docker log driver to forward to central location
- [ ] Option A: Grafana Loki + Promtail (lightweight, pairs with existing Grafana)
- [ ] Option B: ELK stack (heavier but more powerful)
- [ ] Log retention: 30 days hot, 90 days cold
- [ ] Log-based alerts: 5xx errors, auth failures, rate limit violations

---

## Phase 7 — CI/CD Pipeline (Week 5–6)
> Automate everything. No manual deployments.

### 7.1 🔴 GitHub Actions — CI
- [ ] `.github/workflows/ci.yml`:
  ```yaml
  on: [push, pull_request]
  jobs:
    lint:
      - pnpm install
      - pnpm lint (add ESLint to all packages)
    typecheck:
      - pnpm tsc --noEmit (all packages)
    test:
      - Start PostgreSQL service container
      - Run migrations
      - pnpm test (all packages)
      - Upload coverage report
    build:
      - pnpm build (all packages + apps)
      - Verify Docker images build successfully
  ```
- [ ] Branch protection: require CI pass + 1 review before merge to main
- [ ] Run on every PR and push to main

### 7.2 🟠 GitHub Actions — CD
- [ ] `.github/workflows/deploy.yml`:
  ```yaml
  on:
    push:
      branches: [main]
  jobs:
    deploy:
      - Build Docker images
      - Push to GitHub Container Registry (ghcr.io)
      - SSH to H200V server
      - Pull new images
      - Run migrations
      - docker compose up -d
      - Health check verification
      - Rollback on failure
  ```
- [ ] Zero-downtime deployment (rolling update)
- [ ] Deployment notifications to Mattermost

### 7.3 🟠 Code Quality
- [ ] Add ESLint to all packages:
  - [ ] TypeScript strict rules
  - [ ] No unused variables
  - [ ] No `any` types (warning)
  - [ ] Import ordering
  - [ ] React hooks rules (hub app)
- [ ] Add Prettier for consistent formatting
- [ ] Add pre-commit hooks (husky + lint-staged):
  - [ ] Run ESLint on staged files
  - [ ] Run Prettier on staged files
  - [ ] Run TypeScript check
- [ ] Add commitlint for conventional commits: `feat:`, `fix:`, `docs:`, `chore:`

### 7.4 🟡 Dependency Management
- [ ] Add Renovate or Dependabot for automated dependency updates
- [ ] Pin all production dependencies (exact versions)
- [ ] Weekly security audit: `pnpm audit`
- [ ] License compliance check: ensure all deps are Apache-2.0 / MIT compatible

---

## Phase 8 — Landing Page & Marketing (Week 6)
> First impression matters.

### 8.1 🟠 Landing Page Polish
- [ ] Hero section: clear value prop, animated demo/screenshot
- [ ] Features section: inject, verify, version, collaborate
- [ ] How it works: 3-step visual flow
- [ ] Use cases: manufacturers, AI agents, compliance, marketplaces
- [ ] Social proof: logos, testimonials (even if placeholder)
- [ ] CTA: "Get Started Free" → registration
- [ ] Footer: links to docs, API reference, GitHub, status page, legal

### 8.2 🟠 Documentation Site
- [ ] Convert existing `/docs` pages to comprehensive guides:
  - [ ] Getting Started (5 min quick start)
  - [ ] Concepts: containers, atoms, trust levels, namespaces, organizations
  - [ ] Guides: create first container, inject into LLM, verify on blockchain
  - [ ] TypeScript SDK reference (auto-generated from JSDoc)
  - [ ] Python SDK reference
  - [ ] CLI reference
  - [ ] API reference (from OpenAPI spec)
  - [ ] Deployment guide (self-hosted)
- [ ] Search within docs
- [ ] Code examples with copy button
- [ ] Interactive API playground (try requests from docs)

### 8.3 🟡 SEO & Performance
- [ ] Lighthouse audit: target score 90+ on all metrics
- [ ] Next.js Image optimization for all images
- [ ] Bundle analysis: identify and remove unused dependencies
- [ ] Lazy load heavy components (code editor, diff viewer)
- [ ] Preload critical resources
- [ ] Sitemap generation (`next-sitemap`)
- [ ] robots.txt
- [ ] Structured data (JSON-LD) for rich search results

---

## Phase 9 — Connector System (Week 6–7)
> Pluggable backends as documented in CONNECTOR-ARCHITECTURE.md.

### 9.1 🟡 Storage Connector Interface
- [ ] Implement interface: `put`, `get`, `delete`, `list`, `presignedUrl`, `stats`
- [ ] Backend: Local filesystem (default, for development)
- [ ] Backend: S3-compatible (MinIO / AWS S3) for production
- [ ] Backend: IPFS (for archival / permanent storage)
- [ ] Configuration via `gitchain.config.yaml` or environment variables
- [ ] Unit tests with mock storage backend

### 9.2 🟡 MCP Server Mode
- [ ] GitChain exposes itself as MCP server for AI agents
- [ ] Tools exposed:
  - [ ] `inject` — inject containers into agent context
  - [ ] `search` — search containers
  - [ ] `verify` — verify container on blockchain
  - [ ] `get_container` — retrieve single container
  - [ ] `list_containers` — list containers with filters
- [ ] Resources exposed:
  - [ ] Container data as MCP resources
  - [ ] Namespace listings
- [ ] Stdio and HTTP transport
- [ ] Authentication via API key
- [ ] Register as MCP server in Claude Code, LangChain, etc.

### 9.3 🟡 MCP Client Mode
- [ ] GitChain connects to external MCP servers
- [ ] Auto-sync: pull data from manufacturer MCP servers into containers
- [ ] Configure sync schedule (hourly, daily, on-demand)
- [ ] Conflict resolution: trust-level based (manufacturer data wins)
- [ ] Sync status dashboard in Hub UI

---

## Phase 10 — Production Launch Checklist (Week 7–8)
> Final verification before go-live.

### 10.1 🔴 Security Audit
- [ ] Run `pnpm audit` — zero critical/high vulnerabilities
- [ ] Run OWASP ZAP scan against staging environment
- [ ] Manual penetration testing: auth bypass, injection, IDOR, privilege escalation
- [ ] Review all API endpoints for authorization checks
- [ ] Verify rate limiting works under load
- [ ] Test CORS configuration (only allow expected origins)
- [ ] Verify no secrets in Docker images: `docker history --no-trunc <image>`

### 10.2 🔴 Performance Verification
- [ ] Database query audit: no N+1 queries, all slow queries optimized
- [ ] Add database indexes for any missing query patterns
- [ ] Connection pooling: verify pool size is appropriate (min 5, max 20)
- [ ] Redis caching: cache hot containers, search results, user profiles
- [ ] CDN for static assets (if applicable)
- [ ] Load test results: p95 < 500ms at 100 concurrent users

### 10.3 🔴 Data Integrity
- [ ] Verify all foreign key constraints are enforced
- [ ] Verify all unique constraints are correct
- [ ] Test soft delete: deleted records don't appear in queries
- [ ] Verify cascade deletes work correctly (org delete → members removed, etc.)
- [ ] Test backup and restore procedure
- [ ] Verify blockchain anchoring produces valid, verifiable proofs

### 10.4 🟠 Legal & Compliance
- [ ] Terms of Service — reviewed by legal
- [ ] Privacy Policy — GDPR compliant (data processing, right to erasure, data export)
- [ ] Cookie consent (if using cookies for auth)
- [ ] DSGVO: personal data handling documentation
- [ ] License headers in all source files
- [ ] Third-party license compliance (bundle licenses)

### 10.5 🟠 Operational Readiness
- [ ] Runbooks documented:
  - [ ] How to deploy a new version
  - [ ] How to rollback a deployment
  - [ ] How to restore database from backup
  - [ ] How to investigate a production incident
  - [ ] How to add a new namespace/organization
  - [ ] How to rotate secrets (JWT, DB password, API salt)
- [ ] On-call setup: who gets paged, escalation path
- [ ] Incident response plan: detection → triage → fix → postmortem
- [ ] Disaster recovery: RPO (Recovery Point Objective) < 1 hour, RTO (Recovery Time Objective) < 4 hours

### 10.6 🟠 User Acceptance Testing
- [ ] Onboard 1–2 pilot manufacturers (e.g., demo namespace)
- [ ] Test full workflow: register → create org → create namespace → import containers → verify → inject
- [ ] Collect feedback on UX, performance, missing features
- [ ] Fix all P0/P1 issues from pilot testing

### 10.7 🟡 Feature Flags
- [ ] Implement simple feature flag system:
  ```typescript
  const flags = {
    ENABLE_BLOCKCHAIN: process.env.FEATURE_BLOCKCHAIN !== "false",
    ENABLE_IPFS: process.env.FEATURE_IPFS === "true",
    ENABLE_DPP: process.env.FEATURE_DPP === "true",
    ENABLE_MCP_SERVER: process.env.FEATURE_MCP === "true",
    MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE || "100"),
  }
  ```
- [ ] Toggle features without redeployment
- [ ] Gradual rollout capability (percentage-based or user-based)

---

## Summary

| Phase | Focus | Duration | Priority |
|-------|-------|----------|----------|
| **Phase 0** | Security Hardening | Week 1 | 🔴 CRITICAL |
| **Phase 1** | Infrastructure & Deployment | Week 1–2 | 🔴 CRITICAL |
| **Phase 2** | Core Feature Completion | Week 2–3 | 🟠 HIGH |
| **Phase 3** | Hub UI Completion | Week 3–4 | 🟠 HIGH |
| **Phase 4** | API Hardening | Week 3–4 | 🟠 HIGH |
| **Phase 5** | Testing | Week 4–5 | 🔴 CRITICAL |
| **Phase 6** | Monitoring & Observability | Week 5 | 🔴 CRITICAL |
| **Phase 7** | CI/CD Pipeline | Week 5–6 | 🟠 HIGH |
| **Phase 8** | Landing Page & Marketing | Week 6 | 🟡 MEDIUM |
| **Phase 9** | Connector System | Week 6–7 | 🟡 MEDIUM |
| **Phase 10** | Launch Checklist | Week 7–8 | 🔴 CRITICAL |

**Total items:** ~200 tasks
**Critical path:** Phase 0 → Phase 1 → Phase 5 → Phase 6 → Phase 10
**Parallel work:** Phase 2+3+4 can run concurrently after Phase 0+1

---

*Generated 2026-02-27 from full codebase audit of 0711-GitChain*
