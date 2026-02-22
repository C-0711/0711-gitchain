# 0711-GitChain

**Blockchain-verified context injection for AI agents.**

No hallucination. Full audit trail. Every fact traceable to its source and verified on blockchain.

## What is GitChain?

GitChain provides a universal knowledge layer for AI agents with three core principles:

1. **Git Versioning** — Every container has complete version history
2. **Blockchain Anchoring** — All data is anchored to Base Mainnet via Merkle proofs  
3. **Source Citations** — Every fact traces back to its source document

## Quick Start

```typescript
import { inject } from "@0711/inject";

const context = await inject({
  containers: ["0711:product:bosch:7736606982:v3"],
  verify: true,
  format: "markdown",
});

// Use verified context in your LLM
console.log(context.formatted);
console.log(context.verified);  // true
```

## Container ID Format

```
0711:{type}:{namespace}:{identifier}:{version}

Examples:
0711:product:bosch:7736606982:v3      # Product specification
0711:campaign:0711:q1-launch:v2       # Marketing campaign
0711:knowledge:etim:EC012034:v1       # Domain knowledge
0711:project:acme:redesign:latest     # Project context
0711:memory:agent:preferences:v1      # Agent memory
```

## Packages

| Package | Description |
|---------|-------------|
| `@0711/core` | Container schema, validation, types |
| `@0711/git` | Git versioning layer (isomorphic-git) |
| `@0711/chain` | Blockchain anchoring (Base Mainnet) |
| `@0711/inject` | Context injection API |
| `@0711/ipfs` | IPFS storage integration |
| `@0711/dpp` | Digital Product Passport |
| `@0711/c2pa` | Content authenticity signing |
| `@0711/sdk` | Client SDK |

## Apps

| App | Description |
|-----|-------------|
| `api` | GraphQL + REST API server |
| `hub` | Container browser UI |
| `verify` | Public verification portal |
| `landing` | Marketing landing page |

## Installation

```bash
# TypeScript/JavaScript
npm install @0711/sdk

# Python
pip install gitchain

# CLI
npm install -g @0711/gitchain-cli
```

## Smart Contract

Deployed on Base Mainnet:
- **Address:** `0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7`
- **Network:** Base Mainnet (Chain ID: 8453)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Development mode
pnpm dev
```

## License

MIT

## Links

- **Website:** https://gitchain.0711.io
- **Docs:** https://gitchain.0711.io/docs
- **GitHub:** https://github.com/C-0711/0711-gitchain
- **Smart Contract:** [Base Mainnet](https://basescan.org/address/0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7)

---

Built by [0711 Intelligence](https://0711.io)
