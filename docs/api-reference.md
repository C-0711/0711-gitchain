# API Reference

Base URL: `https://api.gitchain.0711.io`

## Authentication

All authenticated endpoints require an API key:

```bash
Authorization: Bearer gc_live_xxxx
```

## Endpoints

### Inject

```
POST /api/inject
```

Inject verified context from containers.

**Request:**
```json
{
  "containers": ["0711:product:bosch:7736606982:v3"],
  "verify": true,
  "format": "markdown",
  "includeCitations": true
}
```

**Response:**
```json
{
  "success": true,
  "containers": [...],
  "formatted": "# Verified Context\n...",
  "tokenCount": 1234,
  "verified": true,
  "verifiedAt": "2026-02-22T14:00:00Z"
}
```

---

### Containers

#### List Containers
```
GET /api/containers?type=product&namespace=bosch&limit=50
```

#### Get Container
```
GET /api/containers/{id}
```

#### Create Container
```
POST /api/containers
```
```json
{
  "type": "product",
  "namespace": "mycompany",
  "identifier": "SKU-001",
  "data": { "name": "Widget", "price": 99 },
  "meta": { "name": "My Widget" }
}
```

#### Update Container
```
PUT /api/containers/{id}
```

#### Get History
```
GET /api/containers/{id}/history
```

---

### Verify

```
GET /api/verify/{containerIdOrHash}
```

**Response:**
```json
{
  "verified": true,
  "container": { "id": "...", "meta": { "name": "..." } },
  "chain": {
    "network": "base-mainnet",
    "batchId": 42,
    "txHash": "0x..."
  }
}
```

---

### Batch

```
POST /api/batch
```

Register multiple containers in one blockchain batch.

```json
{
  "containers": [
    { "type": "product", "namespace": "co", "identifier": "1", "data": {} },
    { "type": "product", "namespace": "co", "identifier": "2", "data": {} }
  ]
}
```

---

### Search

```
GET /api/search?q=heat+pump&type=product&limit=20
```

---

### Auth

```
POST /api/auth/register   # Register new user
POST /api/auth/login      # Login, get API key
POST /api/auth/api-key    # Generate new API key
GET  /api/auth/me         # Get current user
```

---

### Webhooks

```
GET    /api/webhooks      # List webhooks
POST   /api/webhooks      # Create webhook
DELETE /api/webhooks/{id} # Delete webhook
```

Events: `container.created`, `container.updated`, `batch.registered`, `namespace.created`

---

## GraphQL

```
POST /graphql
```

```graphql
query {
  inject(containers: ["0711:product:bosch:7736606982:v3"]) {
    formatted
    verified
    tokenCount
  }
}
```

## Rate Limits

- **Free:** 100 requests/minute
- **Pro:** 1,000 requests/minute
- **Enterprise:** Custom

Headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
