# Container Types

GitChain supports five container types, each designed for specific use cases.

## Product

Product specifications, media, and citations.

```
0711:product:{namespace}:{identifier}:{version}
```

**Example:**
```json
{
  "id": "0711:product:bosch:7736606982:v3",
  "type": "product",
  "data": {
    "supplierPid": "7736606982",
    "etimClass": "EC012034",
    "features": [
      { "code": "EF000008", "name": "Width", "value": "1122", "unit": "mm" },
      { "code": "EF010933", "name": "COP at 7°C", "value": "4.83" }
    ]
  },
  "citations": [
    { "documentId": "datasheet.pdf", "page": 3, "confidence": "confirmed" }
  ]
}
```

**Use cases:**
- E-commerce product data
- Technical specifications
- Digital Product Passports (DPP)
- PIM/DAM systems

---

## Campaign

Marketing campaigns, goals, and assets.

```
0711:campaign:{namespace}:{identifier}:{version}
```

**Example:**
```json
{
  "id": "0711:campaign:0711:q1-launch:v2",
  "type": "campaign",
  "data": {
    "name": "Q1 2026 Product Launch",
    "goals": ["awareness", "leads"],
    "budget": 50000,
    "channels": ["linkedin", "email"],
    "assets": [
      { "type": "video", "url": "..." },
      { "type": "landing", "url": "..." }
    ]
  }
}
```

**Use cases:**
- Marketing automation
- Campaign context for AI copywriters
- Cross-channel coordination

---

## Project

Project context, decisions, and artifacts.

```
0711:project:{namespace}:{identifier}:{version}
```

**Example:**
```json
{
  "id": "0711:project:acme:website-redesign:v5",
  "type": "project",
  "data": {
    "name": "Website Redesign",
    "status": "in-progress",
    "decisions": [
      { "date": "2026-01-15", "decision": "Use Next.js 14", "rationale": "..." }
    ],
    "artifacts": [
      { "type": "figma", "url": "..." },
      { "type": "repo", "url": "..." }
    ]
  }
}
```

**Use cases:**
- Project handoffs
- Decision logging
- Context for AI assistants

---

## Memory

Agent learnings, preferences, and history.

```
0711:memory:{namespace}:{identifier}:{version}
```

**Example:**
```json
{
  "id": "0711:memory:agent:user-prefs:v12",
  "type": "memory",
  "data": {
    "preferences": {
      "tone": "casual",
      "format": "bullet-points",
      "timezone": "Europe/Berlin"
    },
    "learnings": [
      { "date": "2026-02-20", "topic": "prefers German for tech terms" }
    ]
  }
}
```

**Use cases:**
- Persistent agent memory
- User preference storage
- Learning accumulation

---

## Knowledge

Domain facts, rules, and definitions.

```
0711:knowledge:{namespace}:{identifier}:{version}
```

**Example:**
```json
{
  "id": "0711:knowledge:etim:EC012034:v1",
  "type": "knowledge",
  "data": {
    "class": "EC012034",
    "name": "Heat pump",
    "definition": "Device that transfers heat from a cold area to a warm area",
    "features": [
      { "code": "EF000008", "name": "Width", "type": "numeric", "unit": "mm" },
      { "code": "EF010933", "name": "COP", "type": "numeric" }
    ]
  }
}
```

**Use cases:**
- Domain ontologies
- Classification systems
- Reference data for AI

---

## Container Relationships

Containers can reference each other:

```json
{
  "id": "0711:product:bosch:7736606982:v3",
  "data": {
    "etimClass": "0711:knowledge:etim:EC012034:v1",
    "campaign": "0711:campaign:bosch:q1-2026:v1"
  }
}
```

Use `inject()` to resolve all references:

```typescript
const context = await inject({
  containers: ["0711:product:bosch:7736606982:v3"],
  resolveReferences: true,
});
```
