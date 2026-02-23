# @0711/inject

Verified context injection for AI agents — the core GitChain innovation.

## Installation

```bash
npm install @0711/inject @0711/core
```

## Quick Start

```typescript
import { inject } from "@0711/inject";

const context = await inject({
  containers: ["0711:product:bosch:7736606982:v3"],
  verify: true,
  format: "markdown",
});

// Use in your LLM prompt
console.log(context.formatted);
// Every fact is verified and traceable to its source
```

## Why GitChain?

Traditional RAG has a trust problem. You retrieve text chunks, but:
- Where did this data come from?
- Is it current? Is it accurate?
- Can you prove it to an auditor?

GitChain solves this with **verified context injection**:

1. **Every fact has a citation** — traceable to source document, page, and quote
2. **Blockchain anchoring** — Merkle proofs on Base Mainnet
3. **Git versioning** — Full history of every change
4. **Trust hierarchy** — Manufacturer data > community contributions

## Features

- `inject()` — Load verified context into your AI workflow
- `injectBatch()` — Batch multiple containers efficiently
- `verifyContainers()` — Verify data against blockchain
- `formatContext()` — Format for OpenAI, Anthropic, or markdown

## Output Formats

```typescript
// OpenAI function calling format
const openai = await inject({ containers, format: "openai" });

// Anthropic tool use format
const anthropic = await inject({ containers, format: "anthropic" });

// Plain markdown (great for system prompts)
const md = await inject({ containers, format: "markdown" });

// Raw JSON with full citations
const json = await inject({ containers, format: "json" });
```

## Verification

```typescript
import { verifyContainers } from "@0711/inject";

const result = await verifyContainers(["0711:product:bosch:7736606982:v3"]);
console.log(result.verified); // true
console.log(result.proof);    // Merkle proof details
console.log(result.blockNumber); // Base Mainnet block
```

## Documentation

- [Getting Started](https://gitchain.0711.io/docs/getting-started)
- [Container Types](https://gitchain.0711.io/docs/container-types)
- [API Reference](https://gitchain.0711.io/docs/inject-api)

## License

Apache 2.0 — see [LICENSE](./LICENSE)
