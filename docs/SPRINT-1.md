# 🏃 GitChain Hub — Sprint 1 Checklist

**Sprint Goal:** Platform MVP — No mock data, complete core pages  
**Duration:** 7 days  
**Start:** 2026-02-23

---

## Day 1-2: Clean Foundation

### 🔴 Remove Hardcoded Data

- [ ] **`apps/hub/src/app/containers/[id]/[...path]/page.tsx`**
  - Remove mock Bosch data (lines 20-107)
  - Fetch real data from API
  - Handle loading/error states

- [ ] **`apps/hub/src/app/history/page.tsx`**
  - Remove placeholder `0711:product:bosch:7736606982:v3`
  - Connect to real container search/select

### ✨ Generic Examples

Replace all hardcoded examples with:
```
Container ID: 0711:product:demo:example-001:v1
Namespace: demo, acme, test
Product: "Example Widget", "Demo Sensor"
```

### 📡 API Completion

- [ ] **`GET /api/containers/[id]/versions`**
  ```typescript
  // Returns all versions of a container
  interface VersionsResponse {
    versions: {
      version: number;
      createdAt: string;
      author: string;
      message: string;
      isAnchored: boolean;
      txHash?: string;
    }[];
  }
  ```

- [ ] **`GET /api/namespaces/[name]`**
  ```typescript
  // Returns namespace detail
  interface NamespaceResponse {
    name: string;
    displayName: string;
    description: string;
    memberCount: number;
    containerCount: number;
    createdAt: string;
    containers: Container[];
    members: { userId: string; role: string }[];
  }
  ```

---

## Day 3-4: Core Pages

### 📁 `/namespaces/[name]/page.tsx`

GitHub org-style page:

```
┌─────────────────────────────────────────────────┐
│  📁 namespace-name                              │
│  Description of the namespace                   │
│  👥 3 members · 📦 12 containers               │
├─────────────────────────────────────────────────┤
│  📌 Pinned Containers                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ prod-1  │ │ prod-2  │ │ prod-3  │           │
│  └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────┤
│  📦 All Containers (12)              [Sort ▼]   │
│  ────────────────────────────────────────────── │
│  📦 namespace/container-1    v3  ⛓️  2h ago    │
│  📦 namespace/container-2    v1  ⏳  1d ago    │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

- [ ] Fetch namespace from `/api/namespaces/[name]`
- [ ] Display header with stats
- [ ] Pinned containers section
- [ ] All containers list with sorting
- [ ] Members sidebar

### ➕ `/namespaces/new/page.tsx`

```
┌─────────────────────────────────────────────────┐
│  Create a new namespace                         │
├─────────────────────────────────────────────────┤
│  Name *                                         │
│  ┌───────────────────────────────────────────┐ │
│  │ my-namespace                              │ │
│  └───────────────────────────────────────────┘ │
│  Your namespace URL: gitchain.0711.io/my-namespace │
│                                                 │
│  Display Name                                   │
│  ┌───────────────────────────────────────────┐ │
│  │ My Namespace                              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Description                                    │
│  ┌───────────────────────────────────────────┐ │
│  │                                           │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Visibility                                     │
│  ○ Public — Anyone can see containers          │
│  ○ Private — Only members can access           │
│                                                 │
│  [ Cancel ]                [ Create Namespace ] │
└─────────────────────────────────────────────────┘
```

- [ ] Form with validation
- [ ] Slug availability check
- [ ] POST to `/api/namespaces`
- [ ] Redirect to new namespace page

### 🔍 `/explore/page.tsx`

```
┌─────────────────────────────────────────────────┐
│  Explore Containers                             │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔍 Search containers...                   │ │
│  └───────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│  Type: [All ▼] [product] [campaign] [project]  │
│  Sort: [Recent ▼]                    [Grid/List]│
├─────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 📦      │ │ 📢      │ │ 📋      │           │
│  │ prod-1  │ │ camp-1  │ │ proj-1  │           │
│  │ bosch   │ │ acme    │ │ demo    │           │
│  │ v3 ⛓️   │ │ v1 ⏳   │ │ v2 ⛓️   │           │
│  └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────┘
```

- [ ] Search input with debounce
- [ ] Type filter pills
- [ ] Sort dropdown (recent, name, popular)
- [ ] Grid view with cards
- [ ] Pagination or infinite scroll

---

## Day 5: Container Page Polish

### 🏷️ Version Selector

```tsx
// In container header
<VersionSelector
  currentVersion={container.version}
  versions={versions}
  onVersionChange={handleVersionChange}
/>
```

- [ ] Dropdown component
- [ ] Fetch versions from `/api/containers/[id]/versions`
- [ ] Navigate to versioned URL: `/containers/[id]?v=2`
- [ ] "Compare" link: `/containers/[id]/compare/v1...v3`

### 🔍 Data Browser Filters

Add filter bar to Data tab:

```
[Trust: All ▼] [Source: All ▼] [Has Citation ☐]
```

- [ ] Filter atoms by trust level
- [ ] Filter atoms by source type
- [ ] Filter atoms with/without citations
- [ ] Persist filters in URL params

---

## Day 6-7: History & Commits

### 📜 `/containers/[id]/history/page.tsx`

```
┌─────────────────────────────────────────────────┐
│  📦 namespace/identifier                        │
│  ──────────────────────────────────────────────│
│  📊 Data  📜 History  ⛓️ Chain  📐 Schema  ⚙️   │
├─────────────────────────────────────────────────┤
│  Commits                                        │
│  ────────────────────────────────────────────── │
│  ┌────────────────────────────────────────────┐│
│  │ 🔵 Added 12 features from datasheet        ││
│  │    bombas@0711.io · abc1234 · 2 hours ago  ││
│  │    ⛓️ Anchored · View diff                 ││
│  └────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────┐│
│  │ 🔵 ETIM classification applied             ││
│  │    system · def5678 · 1 day ago            ││
│  │    ⛓️ Anchored · View diff                 ││
│  └────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────┐│
│  │ 🟢 Initial import from ARGE                ││
│  │    bosch · 90a1b2c · 3 days ago            ││
│  │    ⛓️ Anchored · View diff                 ││
│  └────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

- [ ] Fetch commits from `/api/containers/[id]/commits`
- [ ] Show commit list with author, hash, message, date
- [ ] Chain anchor badge per commit
- [ ] "View diff" link to compare page

### 🔄 `/api/containers/[id]/commits`

```typescript
// Route handler
export async function GET(req, { params }) {
  const { id } = params;
  
  const commits = await pool.query(`
    SELECT 
      cc.id,
      cc.version,
      cc.message,
      cc.commit_hash,
      cc.parent_hash,
      cc.created_at,
      c.contributor_id as author,
      ca.tx_hash,
      ca.block_number
    FROM container_commits cc
    JOIN containers cont ON cc.container_id = cont.id
    LEFT JOIN contributors c ON cc.author_id = c.id
    LEFT JOIN container_anchors ca ON cont.id = ca.container_id
    WHERE cont.container_id = $1
    ORDER BY cc.version DESC
  `, [id]);
  
  return Response.json({ commits: commits.rows });
}
```

---

## ✅ Sprint 1 Definition of Done

- [ ] Zero hardcoded Bosch references
- [ ] `/containers/[id]` works with real data
- [ ] `/namespaces/[name]` page exists and works
- [ ] `/namespaces/new` creates real namespaces
- [ ] `/explore` shows real containers with filters
- [ ] Version selector works
- [ ] History page shows real commits
- [ ] All API endpoints return real data

---

## 📊 Metrics

Track daily:
- [ ] Hardcoded refs remaining
- [ ] API endpoints working
- [ ] Pages completed
- [ ] Tests passing

---

*Sprint 1 of ~4 to platform complete*
