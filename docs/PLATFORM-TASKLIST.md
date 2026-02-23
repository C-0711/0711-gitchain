# 🚀 GitChain Hub — Final Platform Task List

**Goal:** GitHub-like experience for verified knowledge containers  
**Principle:** No mock data. No hardcoded values. Real API. Real database.  
**Target:** Platform-ready before Bosch migration

---

## 📊 Current State Analysis

### What EXISTS (✅)
- PostgreSQL database (port 5440) with full schema:
  - `containers`, `container_atoms`, `container_layers`, `container_commits`
  - `contributors`, `namespaces`, `namespace_members`, `users`
  - `blockchain_batches`, `container_anchors`
  - `product_identity`, `etim_features`
- API endpoints connected to database:
  - `GET/POST /api/containers` — real queries
  - `GET /api/containers/[id]` — container detail with atoms, layers, contributors
  - `POST /api/inject` — inject endpoint
  - `GET /api/verify/[id]` — verification
  - `GET /api/search` — search
  - `GET /api/batch` — batch info
- Container detail page (`/containers/[id]`) — GitHub-style with tabs (Data, History, Chain, Schema, Settings)
- Dashboard page — connected to real stats
- Basic navigation with Navbar
- Smart contract deployed: `0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7` (Base Mainnet)

### What NEEDS FIX (🔴)
- Hardcoded Bosch references in several pages
- Some pages still have mock data fallbacks
- Missing pages (namespaces/[name], explore, docs subpages)
- No auth/user system active
- No Pull Request / Updates workflow
- No diff viewer
- No real commit history from Git

---

## 🏗️ PHASE 1: Clean Foundation (2-3 days)

### T1.1 — Remove ALL Hardcoded References
```
Files to fix:
- apps/hub/src/app/containers/[id]/[...path]/page.tsx ← Bosch mock data
- apps/hub/src/app/history/page.tsx ← Bosch placeholder
```
**Action:**
- [ ] Replace all `0711:product:bosch:*` with dynamic fetching
- [ ] Replace placeholder text with generic examples: `0711:product:demo:example-001:v1`
- [ ] Use "Demo Corp" or "Acme Inc" as example namespace
- [ ] Update all code examples in docs

### T1.2 — API Error Handling & Loading States
- [ ] Add proper error boundaries to all pages
- [ ] Consistent loading skeletons (already have some)
- [ ] Empty states with CTAs ("No containers yet → Create one")
- [ ] 404 page for unknown routes

### T1.3 — Complete Missing Core Pages

**`/namespaces/[name]/page.tsx`** — Namespace Profile (like GitHub org page)
- [ ] Namespace header (name, description, member count)
- [ ] Pinned containers
- [ ] All containers list
- [ ] Members list
- [ ] Settings link (if owner)

**`/namespaces/new/page.tsx`** — Create Namespace
- [ ] Name input (slug validation)
- [ ] Display name
- [ ] Description
- [ ] Visibility (public/private)
- [ ] Avatar upload (future)

**`/explore/page.tsx`** — Browse Containers
- [ ] Filter by type (product, campaign, project, memory, knowledge)
- [ ] Filter by namespace
- [ ] Sort (recent, popular, verified)
- [ ] Search integration
- [ ] Grid/list view toggle

**`/settings/page.tsx`** — User Settings
- [ ] Profile section (name, email, avatar)
- [ ] API Keys management
- [ ] Notification preferences
- [ ] Connected accounts (future)

---

## 🎨 PHASE 2: GitHub-Style Container Page (4-5 days)

### T2.1 — Enhanced Container Header
Current header is good, but add:
- [ ] Star/Watch/Fork equivalent → **Inject / Verify / Subscribe** buttons
- [ ] Subscriber count badge
- [ ] "Used by X agents" metric
- [ ] Breadcrumb with namespace link

### T2.2 — Version Selector (Git-like)
- [ ] Dropdown showing all versions (v1, v2, v3, ..., latest)
- [ ] "Compare" link between versions
- [ ] Version badge with chain status (⛓️ anchored, ⏳ pending)
- [ ] API: `GET /api/containers/[id]/versions`

### T2.3 — Data Browser (File Tree)
Current implementation is good, enhance:
- [ ] Expand/collapse all button
- [ ] "Go to definition" for cross-references
- [ ] Copy individual atom as JSON
- [ ] Filter by trust level
- [ ] Filter by source type
- [ ] Show citation inline on hover

### T2.4 — README/Description View
Like GitHub's README.md display:
- [ ] Rich markdown rendering for container description
- [ ] "Edit" button (if authorized)
- [ ] Table of contents from schema sections
- [ ] Quick inject snippet (already in sidebar)

### T2.5 — Container Sidebar Enhancements
Current sidebar has:
- About, Trust Distribution, Layers, Contributors, Quick Inject

Add:
- [ ] "Releases" section → Version list with dates
- [ ] "Activity" section → Recent commits/changes
- [ ] "Languages" equivalent → Schema types breakdown
- [ ] "Topics/Tags" → Container tags/categories
- [ ] "License" equivalent → Citation style

---

## 🔄 PHASE 3: History & Diff (Git Core) (3-4 days)

### T3.1 — Commit History Page (`/containers/[id]/history`)
Like `git log`:
- [ ] List of all commits with:
  - Commit hash (short + full on hover)
  - Message
  - Author (human or agent)
  - Timestamp
  - Chain anchor status (✓ on-chain, ⏳ pending)
- [ ] Pagination for long histories
- [ ] Filter by author
- [ ] API: `GET /api/containers/[id]/commits`

### T3.2 — Diff Viewer (`/containers/[id]/compare/v1...v2`)
JSON diff between versions:
- [ ] Side-by-side view
- [ ] Unified view toggle
- [ ] Additions (green), Deletions (red), Changes (yellow)
- [ ] Expand/collapse unchanged sections
- [ ] Stats: "+X atoms, -Y atoms, ~Z changed"
- [ ] API: `GET /api/containers/[id]/diff?from=v1&to=v2`

### T3.3 — Single Commit View (`/containers/[id]/commit/[hash]`)
- [ ] Commit metadata (author, date, message)
- [ ] Parent commit link
- [ ] Diff from parent
- [ ] Chain anchor info (if anchored)
- [ ] "Browse files at this point" link

### T3.4 — Activity Feed
- [ ] Timeline view of all changes
- [ ] Filter by type (commit, anchor, verification)
- [ ] Contributor activity graph (like GitHub contributions)

---

## 📝 PHASE 4: Updates/Pull Requests (4-5 days)

### T4.1 — Updates System (GitChain PRs)
Like GitHub Pull Requests but for container data:

**Create Update (`/containers/[id]/updates/new`)**
- [ ] Fork current version
- [ ] Make changes (inline editor or upload)
- [ ] Write update message
- [ ] Submit for review
- [ ] API: `POST /api/containers/[id]/updates`

**Update Detail (`/containers/[id]/updates/[num]`)**
- [ ] Update title and description
- [ ] Diff viewer (proposed changes)
- [ ] Comments/discussion
- [ ] Review status (pending, approved, rejected)
- [ ] Merge button (if approved)

**Updates List (`/containers/[id]/updates`)**
- [ ] Open/Closed filter
- [ ] Author filter
- [ ] Sort by date/activity

### T4.2 — Issues System (Optional - Phase 5)
- [ ] Report data quality issues
- [ ] Request features/fields
- [ ] Link issues to updates

---

## ⛓️ PHASE 5: Blockchain & Verification (2-3 days)

### T5.1 — Chain Tab Enhancements
Current chain tab is basic. Enhance:
- [ ] Full transaction history
- [ ] Merkle proof visualization
- [ ] Link to Basescan for each tx
- [ ] Verification certificate (downloadable PDF)
- [ ] QR code for mobile verification

### T5.2 — Verification Portal (`/verify`)
- [ ] Input: Container ID or content hash
- [ ] Output: Full verification result
  - Container exists: ✓/✗
  - On-chain: ✓/✗ (with tx link)
  - Hash matches: ✓/✗
  - Proof valid: ✓/✗
- [ ] Batch verification (multiple containers)
- [ ] API endpoint for programmatic verification

### T5.3 — Anchor Dashboard
- [ ] Pending anchors queue
- [ ] Recent anchors with tx links
- [ ] Batch statistics
- [ ] Gas costs / economics

---

## 🎭 PHASE 6: Marketplace & Templates (3-4 days)

### T6.1 — Container Templates (`/templates`)
Per Christoph's vision: Templates with workflows + markdowns
- [ ] Template list page
- [ ] Template detail page
  - Description
  - Schema preview
  - Included markdown instructions
  - "Use this template" button
- [ ] Template types:
  - `product` — ETIM/eClass schema
  - `campaign` — Briefing workflow with questions
  - `project` — Task tracking with sub-agents
  - `memory` — Session/context storage
  - `knowledge` — Documentation/wiki

### T6.2 — Template-Driven Creation
- [ ] "Create from template" flow
- [ ] Dynamic form generation from template schema
- [ ] Markdown instructions shown during creation
- [ ] Pre-fill with template defaults
- [ ] Validation against schema

### T6.3 — Marketplace Discovery
- [ ] Featured templates
- [ ] Most used templates
- [ ] Template categories
- [ ] "Made by" attribution

---

## 🔐 PHASE 7: Auth & Permissions (2-3 days)

### T7.1 — User Authentication
- [ ] Sign up / Sign in pages
- [ ] Email + password (basic)
- [ ] OAuth (GitHub, Google) — optional
- [ ] API key generation
- [ ] Session management

### T7.2 — Authorization
- [ ] Namespace ownership
- [ ] Container permissions (owner, editor, viewer)
- [ ] Public vs private containers
- [ ] Team/group management

### T7.3 — Contributor Identity
- [ ] Human vs Agent contributors
- [ ] Verified contributor badges
- [ ] Contribution history per user

---

## 📖 PHASE 8: Documentation (2 days)

### T8.1 — Docs Pages (`/docs/*`)
- [ ] Getting Started
- [ ] Container Types
- [ ] inject() API reference
- [ ] Verification guide
- [ ] TypeScript SDK
- [ ] Python SDK
- [ ] CLI reference
- [ ] Schema reference

### T8.2 — Interactive Examples
- [ ] Runnable code snippets
- [ ] "Try it" buttons → inject playground
- [ ] Copy-paste ready examples

---

## 📊 Summary: Priority Order

| Phase | Name | Days | Priority |
|-------|------|------|----------|
| 1 | Clean Foundation | 2-3 | 🔴 CRITICAL |
| 2 | Container Page | 4-5 | 🔴 CRITICAL |
| 3 | History & Diff | 3-4 | 🟡 HIGH |
| 4 | Updates/PRs | 4-5 | 🟡 HIGH |
| 5 | Blockchain | 2-3 | 🟡 HIGH |
| 6 | Templates | 3-4 | 🟢 MEDIUM |
| 7 | Auth | 2-3 | 🟢 MEDIUM |
| 8 | Docs | 2 | 🟢 MEDIUM |

**Total: ~25-32 days**

---

## 🎯 Definition of Done

Platform is ready for Bosch migration when:
1. ✅ Zero hardcoded data anywhere
2. ✅ All API endpoints return real data
3. ✅ Container detail page complete with all tabs functional
4. ✅ Version selector works with real history
5. ✅ Diff viewer shows real changes
6. ✅ Blockchain verification functional
7. ✅ Create container flow works end-to-end
8. ✅ Namespace pages work
9. ✅ Search returns real results
10. ✅ inject() API works from playground

---

## 🔧 Technical Requirements

### API Endpoints Needed

```
# Containers
GET    /api/containers                    ✅ EXISTS
POST   /api/containers                    ✅ EXISTS
GET    /api/containers/[id]               ✅ EXISTS
PATCH  /api/containers/[id]               ❌ NEEDED
DELETE /api/containers/[id]               ❌ NEEDED
GET    /api/containers/[id]/versions      ❌ NEEDED
GET    /api/containers/[id]/commits       ❌ NEEDED
GET    /api/containers/[id]/diff          ❌ NEEDED

# Updates (PRs)
GET    /api/containers/[id]/updates       ❌ NEEDED
POST   /api/containers/[id]/updates       ❌ NEEDED
GET    /api/containers/[id]/updates/[num] ❌ NEEDED
POST   /api/containers/[id]/updates/[num]/merge ❌ NEEDED

# Namespaces
GET    /api/namespaces                    ✅ EXISTS (basic)
POST   /api/namespaces                    ❌ NEEDED
GET    /api/namespaces/[name]             ❌ NEEDED
PATCH  /api/namespaces/[name]             ❌ NEEDED

# Search
GET    /api/search                        ✅ EXISTS

# Inject & Verify
POST   /api/inject                        ✅ EXISTS
GET    /api/verify/[id]                   ✅ EXISTS

# User
GET    /api/user                          ❌ NEEDED
GET    /api/user/containers               ❌ NEEDED
GET    /api/user/namespaces               ❌ NEEDED
POST   /api/user/api-keys                 ❌ NEEDED

# Templates
GET    /api/templates                     ❌ NEEDED
GET    /api/templates/[id]                ❌ NEEDED
```

### Database Tables Status

```
✅ containers           — ready
✅ container_atoms      — ready
✅ container_layers     — ready
✅ container_commits    — ready (needs population)
✅ container_anchors    — ready
✅ blockchain_batches   — ready
✅ contributors         — ready
✅ namespaces           — ready
✅ namespace_members    — ready
✅ users                — ready
✅ api_keys             — ready
✅ product_identity     — ready
✅ etim_features        — ready
❌ container_updates    — NEEDED (for PR system)
❌ update_comments      — NEEDED (for PR system)
❌ templates            — NEEDED
```

---

## 📝 First Sprint: Platform MVP

**Week 1 Goal:** Remove all mock data, complete container page

### Day 1-2
- [ ] T1.1: Remove hardcoded Bosch references
- [ ] T1.2: Add error handling
- [ ] API: `/api/containers/[id]/versions`

### Day 3-4
- [ ] T1.3: Create `/namespaces/[name]` page
- [ ] T1.3: Create `/namespaces/new` page
- [ ] T1.3: Create `/explore` page

### Day 5
- [ ] T2.2: Version selector dropdown
- [ ] T2.3: Data browser enhancements (filter by trust)

### Day 6-7
- [ ] T3.1: Commit history page
- [ ] API: `/api/containers/[id]/commits`
- [ ] T3.2: Basic diff viewer

---

## 🚀 After Platform Complete

**Bosch Migration (50 products first):**
1. Select 50 representative products across PM groups
2. Export from existing Bosch DB (features, citations, media refs)
3. Transform to GitChain container format
4. Import via API
5. Generate commits for each layer
6. Anchor batch to blockchain
7. Verify in UI

---

*Created: 2026-02-23*  
*Author: Fleet Admiral Bombas 💣*  
*For: Mastermind C*
