# @c-0711/cli

GitChain CLI — Verified context injection for AI agents.

## Installation

```bash
npm install -g @c-0711/cli --registry=https://npm.pkg.github.com
```

## Commands

### Pull a container

```bash
gitchain pull 0711:product:bosch:8738208680
```

### Inject context

```bash
# Output as markdown
gitchain inject 0711:product:bosch:8738208680 -f markdown

# Multiple containers
gitchain inject container1 container2 container3

# Save to file
gitchain inject 0711:product:bosch:8738208680 -o context.md
```

### Verify blockchain proof

```bash
gitchain verify 0711:product:bosch:8738208680
```

### Search containers

```bash
gitchain search "heat pump"
```

### Show config

```bash
gitchain config
```

## Environment Variables

- `GITCHAIN_API_URL` — API endpoint (default: https://api-gitchain.0711.io)
- `GITCHAIN_CACHE_ENABLED` — Enable caching (default: true)

## License

Apache 2.0
