# GitChain Skill

Inject verified context from GitChain into AI agent conversations.

## Tools

### inject

Inject verified context from containers.

```bash
gitchain inject <container-id> [container-id...]
```

Options:
- `--verify` / `--no-verify`: Verify blockchain proofs (default: true)
- `--format`: Output format: markdown, json, yaml (default: markdown)
- `--no-citations`: Exclude source citations

Example:
```bash
gitchain inject 0711:product:bosch:7736606982:v3
```

### verify

Verify a container or hash.

```bash
gitchain verify <container-id-or-hash>
```

### search

Search containers.

```bash
gitchain search <query> [--type product|campaign|...]
```

### commit

Commit container changes.

```bash
gitchain commit <type> <namespace> <identifier> --data <json-file> --message "Update"
```

## Container ID Format

```
0711:{type}:{namespace}:{identifier}:{version}

Types: product, campaign, project, memory, knowledge
Version: v1, v2, ... or "latest"
```

## Examples

### Get product specs
```bash
gitchain inject 0711:product:bosch:7736606982:v3 --format markdown
```

### Verify blockchain proof
```bash
gitchain verify 0711:product:bosch:7736606982:v3
```

### Multi-container injection
```bash
gitchain inject \
  0711:product:bosch:7736606982:v3 \
  0711:knowledge:etim:EC012034:v1
```

## API

Base URL: https://api.gitchain.0711.io

### POST /api/inject
```json
{
  "containers": ["0711:product:bosch:7736606982:v3"],
  "verify": true,
  "format": "markdown"
}
```

### GET /api/containers/:id

### GET /api/verify/:hashOrId
