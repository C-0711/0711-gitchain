# API Reference

Base URL: `https://api.gitchain.0711.io`

All endpoints are available with and without the `/v1` prefix. Versioned endpoints are recommended.

## Authentication

```bash
# JWT Token (from login)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Key
Authorization: Bearer gc_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Response Format

**Success:**

```json
{
  "data": { ... }
}
```

**Paginated:**

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "hasMore": true,
    "totalPages": 2
  }
}
```

**Error:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Container not found"
  }
}
```

## Headers

All responses include:

- `X-Request-Id` — Unique request identifier
- `X-Api-Version` — Current API version
- `X-RateLimit-Limit` — Requests per minute
- `X-RateLimit-Remaining` — Remaining requests
- `X-RateLimit-Reset` — Reset timestamp (Unix seconds)

---

## Auth

### Register

```
POST /v1/auth/register
```

```json
{
  "email": "user@example.com",
  "password": "min8chars",
  "name": "Jane Doe"
}
```

### Login

```
POST /v1/auth/login
```

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Returns: `{ user, token, expiresAt }`

### Get Current User

```
GET /v1/auth/me
```

### Logout

```
POST /v1/auth/logout
```

### API Keys

```
POST   /v1/auth/api-keys          # Create (returns key once)
GET    /v1/auth/api-keys          # List
DELETE /v1/auth/api-keys/:id      # Revoke
```

---

## User Profile

### Get Profile

```
GET /v1/user
```

### Update Profile

```
PATCH /v1/user
```

```json
{
  "name": "Jane Doe",
  "bio": "Software engineer",
  "company": "Acme",
  "location": "Berlin",
  "website": "https://jane.dev"
}
```

### Change Username

```
PATCH /v1/user/username
```

```json
{ "username": "janedoe" }
```

### Change Password

```
POST /v1/user/password
```

```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

### Sessions

```
GET    /v1/user/sessions          # List active sessions
DELETE /v1/user/sessions          # Revoke all sessions
```

### Delete Account

```
DELETE /v1/user
```

```json
{ "confirmUsername": "janedoe" }
```

### Public User Profile

```
GET /v1/users/:username
```

Returns user profile and their public containers.

---

## Containers

### List Containers

```
GET /v1/containers?type=product&namespace=bosch&limit=50&page=1&orderBy=created_at&orderDir=desc
```

Respects visibility and access control. Anonymous users see only public containers.

### Get My Containers

```
GET /v1/containers/mine
```

Requires authentication. Returns owned and collaborated containers.

### Get Container

```
GET /v1/containers/:id
```

Accepts both UUID and container_id format (`0711:product:bosch:id:v1`).

### Create Container

```
POST /v1/containers
```

```json
{
  "type": "product",
  "namespace": "mycompany",
  "identifier": "SKU-001",
  "data": { "name": "Widget", "specs": { "weight": "1.2kg" } },
  "meta": { "name": "My Widget" },
  "description": "A great widget",
  "visibility": "public"
}
```

Types: `product`, `campaign`, `project`, `memory`, `knowledge`
Visibility: `public`, `private`, `internal`

### Update Container

```
PUT /v1/containers/:id
```

```json
{
  "data": { "price": 99 },
  "message": "Updated price",
  "visibility": "private"
}
```

### Delete Container

```
DELETE /v1/containers/:id
```

Requires owner or admin access. Soft delete.

### Version History

```
GET /v1/containers/:id/history
```

Returns commit history with hash, author, message, timestamp.

### Files

```
GET /v1/containers/:id/files
```

### Collaborators

```
GET    /v1/containers/:id/collaborators
POST   /v1/containers/:id/collaborators    # { userId, role }
DELETE /v1/containers/:id/collaborators/:userId
```

Roles: `admin`, `write`, `read`

### Stars

```
PUT    /v1/containers/:id/star
DELETE /v1/containers/:id/star
```

---

## Search

```
GET /v1/search?q=heat+pump&type=product&limit=20&page=1
```

### Suggestions

```
GET /v1/search/suggest?q=bos&limit=10
```

---

## Inject

```
POST /v1/inject
```

```json
{
  "containers": ["0711:product:bosch:7736606982:v3"],
  "verify": true,
  "format": "markdown"
}
```

Formats: `markdown`, `json`

---

## Organizations

### List

```
GET /v1/organizations
```

### Create

```
POST /v1/organizations
```

```json
{
  "slug": "my-org",
  "name": "My Organization",
  "description": "Building great things"
}
```

### Get

```
GET /v1/organizations/:slug
```

### Update

```
PUT /v1/organizations/:id
```

### Delete

```
DELETE /v1/organizations/:id
```

### Members

```
GET    /v1/organizations/:id/members
POST   /v1/organizations/:id/members      # { userId, role }
PUT    /v1/organizations/:id/members/:userId  # { role }
DELETE /v1/organizations/:id/members/:userId
```

### Invites

```
POST   /v1/organizations/:id/invites      # { email, role }
GET    /v1/organizations/:id/invites       # Pending invites
POST   /v1/organizations/invites/accept    # { token }
DELETE /v1/organizations/:id/invites/:id
```

---

## Namespaces

```
GET /v1/namespaces
GET /v1/namespaces/:name
```

---

## Chain (Blockchain)

```
GET /v1/chain/status              # Blockchain connection status
GET /v1/chain/verify/:hash        # Verify content hash
GET /v1/chain/batch/:id           # Get batch info
```

---

## Admin

```
GET /v1/admin/stats               # Platform statistics
```

Requires admin privileges.

---

## Health

```
GET /health                       # Health check
GET /ready                        # Readiness check (includes DB)
GET /versions                     # Supported API versions
```

---

## Rate Limits

- Auth endpoints: 10 requests/minute
- General API: 60 requests/minute
- Enterprise: Custom limits

## Error Codes

| Code                  | Description                     |
| --------------------- | ------------------------------- |
| `AUTH_REQUIRED`       | Authentication required         |
| `AUTH_EXPIRED`        | Token has expired               |
| `FORBIDDEN`           | Access denied                   |
| `NOT_FOUND`           | Resource not found              |
| `ALREADY_EXISTS`      | Resource already exists         |
| `VALIDATION_ERROR`    | Input validation failed         |
| `RATE_LIMITED`        | Rate limit exceeded             |
| `INTERNAL_ERROR`      | Server error                    |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |
