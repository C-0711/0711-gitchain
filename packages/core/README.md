# @0711/core

GitChain core types, schemas, and validation utilities.

## Installation

```bash
npm install @0711/core
```

## Usage

```typescript
import { 
  Container, 
  ContainerSchema, 
  validateContainer,
  parseContainerId 
} from "@0711/core";

// Type-safe container
const container: Container = {
  id: "0711:product:bosch:7736606982:v3",
  type: "product",
  namespace: "bosch",
  // ...
};

// Validate with Zod
const result = ContainerSchema.safeParse(container);

// Parse container IDs
const parsed = parseContainerId("0711:product:bosch:7736606982:v3");
// { prefix: "0711", type: "product", namespace: "bosch", identifier: "7736606982", version: "v3" }
```

## Container Types

- `product` — Product specifications (ETIM, DPP)
- `campaign` — Marketing campaigns
- `knowledge` — Domain knowledge bases
- `project` — Project context
- `memory` — Agent memory/preferences

## Documentation

- [Container Types](https://gitchain.0711.io/docs/container-types)
- [Full Documentation](https://gitchain.0711.io/docs)

## License

Apache 2.0
