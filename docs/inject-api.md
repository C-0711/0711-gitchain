# Inject API Reference

The `inject()` function is the core of GitChain — it retrieves verified context for AI agents.

## Function Signature

```typescript
async function inject(options: InjectOptions): Promise<InjectedContext>
```

## Options

```typescript
interface InjectOptions {
  // Required: Container IDs to inject
  containers: string[];
  
  // Optional: Verify blockchain proofs (default: true)
  verify?: boolean;
  
  // Optional: Output format (default: "markdown")
  format?: "markdown" | "json" | "yaml";
  
  // Optional: Include version history
  includeHistory?: boolean;
  
  // Optional: Include source citations (default: true)
  includeCitations?: boolean;
  
  // Optional: Maximum tokens for LLM context
  maxTokens?: number;
}
```

## Response

```typescript
interface InjectedContext {
  // Resolved containers
  containers: Container[];
  
  // All source citations
  citations: Citation[];
  
  // Blockchain proofs
  proofs: ChainProof[];
  
  // LLM-ready formatted output
  formatted: string;
  
  // Estimated token count
  tokenCount: number;
  
  // Verification status
  verified: boolean;
  
  // When verified
  verifiedAt: string;
}
```

## Examples

### Basic Injection

```typescript
import { inject } from "@0711/inject";

const context = await inject({
  containers: ["0711:product:bosch:7736606982:v3"],
});

console.log(context.formatted);
```

### Multiple Containers

```typescript
const context = await inject({
  containers: [
    "0711:product:bosch:7736606982:v3",
    "0711:knowledge:etim:EC012034:v1",
    "0711:campaign:bosch:q1-2026:v2",
  ],
  verify: true,
  format: "markdown",
});
```

### With Token Limit

```typescript
const context = await inject({
  containers: ["0711:product:bosch:7736606982:v3"],
  maxTokens: 4000,  // Truncate if needed
});
```

### JSON Format for Structured Processing

```typescript
const context = await inject({
  containers: ["0711:product:bosch:7736606982:v3"],
  format: "json",
});

const data = JSON.parse(context.formatted);
```

## REST API

```bash
POST /api/inject
Content-Type: application/json

{
  "containers": ["0711:product:bosch:7736606982:v3"],
  "verify": true,
  "format": "markdown"
}
```

## GraphQL

```graphql
query {
  inject(input: {
    containers: ["0711:product:bosch:7736606982:v3"]
    verify: true
    format: "markdown"
  }) {
    containers {
      id
      meta { name }
    }
    formatted
    verified
    tokenCount
  }
}
```
