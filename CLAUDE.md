# GitChain — Project Instructions

## Project Overview

Blockchain-verified context injection platform for AI agents. Monorepo with pnpm + Turborepo.

## Architecture

- **apps/api** — Express REST API (port 3100), PostgreSQL + Redis
- **apps/hub** — Next.js 14 frontend (port 3001), dark "Vaultclaw" theme
- **packages/** — 10 shared packages (core, inject, chain, git, ipfs, cli, mcp-server, sdk, dpp, c2pa)
- **database/** — PostgreSQL schema and migrations

## Key Commands

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start all apps in dev mode
pnpm build                # Build all packages and apps
pnpm test                 # Run tests across all packages
```

## Conventions

- **Hub pages**: Always `"use client"`, wrapped in `<AppShell>`, inline styles only (no Tailwind)
- **Theme tokens**: Import `{ theme as t }` from `@/components/AppShell`
- **Auth**: JWT tokens stored in `localStorage` under key `"token"`
- **API responses**: Always use `sendSuccess()`, `sendPaginated()`, `sendBadRequest()` etc. from `lib/response.ts`
- **Container IDs**: Format `0711:{type}:{namespace}:{identifier}:{version}`
- **Database**: All tables use UUID primary keys, soft delete with `deleted_at`

## Environment

Requires: `DATABASE_URL`, `JWT_SECRET`, `API_KEY_SALT` (see `.env.example`)

## Do NOT

- Add Tailwind CSS (project uses inline styles)
- Use `getServerSideProps` or server components that need auth (auth is client-side via localStorage)
- Add hardcoded credentials or secrets
- Touch CTAX files, processes, or databases
