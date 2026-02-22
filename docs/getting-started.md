# Getting Started with GitChain

GitChain provides blockchain-verified context injection for AI agents.

## Installation

```bash
# TypeScript/JavaScript
npm install @0711/sdk

# Python
pip install gitchain
```

## Quick Start

### TypeScript

```typescript
import { GitChainClient } from "@0711/sdk";

const client = new GitChainClient({
  apiUrl: "https://api.gitchain.0711.io",
  apiKey: "your-api-key",
});

// Inject verified context
const context = await client.inject({
  containers: [
    "0711:product:bosch:7736606982:v3",
    "0711:knowledge:etim:EC012034:v1",
  ],
  verify: true,
  format: "markdown",
});

// Use in your AI agent
console.log(context.formatted);
// Verified context ready for LLM consumption
```

### Python

```python
from gitchain import GitChainClient

client = GitChainClient(
    api_url="https://api.gitchain.0711.io",
    api_key="your-api-key"
)

# Inject verified context
context = client.inject(
    containers=["0711:product:bosch:7736606982:v3"],
    verify=True,
    format="markdown"
)

# Use with OpenAI
import openai

response = openai.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": f"Verified context:\n{context.formatted}"},
        {"role": "user", "content": "What is the COP of this heat pump?"}
    ]
)
```

## Container IDs

GitChain uses a structured ID format:

```
0711:{type}:{namespace}:{identifier}:{version}

Examples:
0711:product:bosch:7736606982:v3      # Specific version
0711:product:bosch:7736606982:latest  # Latest version
0711:campaign:0711:q1-launch:v2       # Campaign context
0711:knowledge:etim:EC012034:v1       # Domain knowledge
```

## Container Types

| Type | Description |
|------|-------------|
| `product` | Product specifications, media, citations |
| `campaign` | Marketing campaigns, goals, assets |
| `project` | Project context, decisions, artifacts |
| `memory` | Agent learnings, preferences |
| `knowledge` | Domain facts, rules, definitions |

## Verification

Every container is:
- **Git-versioned** — Full history of changes
- **Blockchain-anchored** — Immutable proof on Base Mainnet
- **Citation-backed** — Every fact traceable to source

```typescript
// Verify a container
const result = await client.verify("0711:product:bosch:7736606982:v3");

console.log(result.verified);  // true
console.log(result.chain.txHash);  // 0x7f3a...
```

## Next Steps

- [Container Types Reference](./container-types.md)
- [Inject API Reference](./inject-api.md)
- [Verification Guide](./verification.md)
- [Integration Examples](./examples/)
