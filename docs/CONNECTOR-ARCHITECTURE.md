# GitChain Connector Architecture

## Konzept

GitChain wird **headless** — alle Backends sind austauschbar über Konnektoren:

```
┌─────────────────────────────────────────────────────────────┐
│                      GitChain Core                          │
├─────────────────────────────────────────────────────────────┤
│  inject() │ verify() │ containers.* │ namespaces.* │ chain │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Connector Layer  │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────┴────┐          ┌─────┴─────┐         ┌────┴────┐
   │ Storage │          │    MCP    │         │  Chain  │
   │Connector│          │ Connector │         │Connector│
   └────┬────┘          └─────┬─────┘         └────┬────┘
        │                     │                    │
   ┌────┴────┐          ┌─────┴─────┐         ┌────┴────┐
   │0711-S3  │          │Claude MCP │         │  Base   │
   │MinIO    │          │OpenAI MCP │         │Ethereum │
   │AWS S3   │          │Custom MCP │         │Polygon  │
   │Local FS │          │           │         │Solana   │
   └─────────┘          └───────────┘         └─────────┘
```

## Config Format (gitchain.config.yaml)

```yaml
# GitChain Configuration
version: "1.0"

# Storage Connector — Where container files are stored
storage:
  type: "0711-storage"  # 0711-storage | s3 | minio | local | ipfs
  endpoint: "http://vault-storage:9510"
  bucket: "gitchain-containers"
  # Optional auth
  accessKey: "${STORAGE_ACCESS_KEY}"
  secretKey: "${STORAGE_SECRET_KEY}"
  # Options
  presign: true
  presignExpiry: 3600
  dedup: true

# Database Connector — Container metadata
database:
  type: "postgresql"  # postgresql | sqlite | mongodb
  url: "${DATABASE_URL}"
  pool:
    min: 5
    max: 20

# Chain Connector — Blockchain anchoring
chain:
  type: "base"  # base | ethereum | polygon | solana | none
  network: "mainnet"  # mainnet | testnet | local
  rpc: "https://mainnet.base.org"
  contract: "0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7"
  # Wallet for write operations
  privateKey: "${CHAIN_PRIVATE_KEY}"
  # Batching
  batchSize: 100
  batchIntervalMs: 60000

# MCP Connectors — AI Agent Integration
mcp:
  # Server mode: GitChain exposes MCP server
  server:
    enabled: true
    transport: "stdio"  # stdio | http | ws
    port: 3200
    tools:
      - inject
      - verify
      - containers.get
      - containers.list
      - containers.create
      - search

  # Client mode: GitChain connects to external MCPs
  clients:
    - name: "bosch-products"
      type: "http"
      url: "http://localhost:3333/mcp"
      # Auto-sync containers from MCP
      sync:
        enabled: true
        interval: "1h"
        containerType: "product"
        namespace: "bosch"
    
    - name: "vault-knowledge"
      type: "stdio"
      command: ["node", "/path/to/vault-mcp.js"]
      sync:
        enabled: false

# Content Processing
processing:
  # PDF extraction
  pdf:
    enabled: true
    ocr: true
    provider: "pixtral"  # pixtral | tesseract | none
  
  # Image processing
  images:
    thumbnails: true
    sizes: [128, 256, 512]
    formats: ["webp", "jpg"]
  
  # Embeddings
  embeddings:
    enabled: true
    provider: "openai"  # openai | ollama | none
    model: "text-embedding-3-small"
    dimensions: 1536

# Caching
cache:
  type: "redis"  # redis | memory | none
  url: "${REDIS_URL}"
  ttl: 3600

# Auth
auth:
  type: "api-key"  # api-key | jwt | oauth | none
  # API key settings
  prefix: "gc_"
  hashAlgorithm: "sha256"
```

## Connector Interface (TypeScript)

```typescript
// packages/core/src/connectors/types.ts

export interface StorageConnector {
  name: string;
  
  // Lifecycle
  init(config: StorageConfig): Promise<void>;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
  
  // Operations
  put(key: string, data: Buffer, metadata?: ObjectMetadata): Promise<PutResult>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  list(prefix: string, options?: ListOptions): Promise<ListResult>;
  
  // Presigned URLs
  presignGet(key: string, expiresIn?: number): Promise<string>;
  presignPut(key: string, contentType?: string, expiresIn?: number): Promise<string>;
  
  // Stats
  getStats(): Promise<StorageStats>;
}

export interface ChainConnector {
  name: string;
  network: string;
  
  // Lifecycle
  init(config: ChainConfig): Promise<void>;
  healthCheck(): Promise<boolean>;
  
  // Read operations (no wallet needed)
  getBatch(batchId: number): Promise<BatchInfo>;
  verifyContent(batchId: number, contentHash: string, proof: string[]): Promise<boolean>;
  getBatchCount(): Promise<number>;
  
  // Write operations (wallet needed)
  registerBatch(merkleRoot: string, metadataUri: string): Promise<BatchResult>;
  
  // Events
  onBatchRegistered(callback: (event: BatchEvent) => void): void;
}

export interface MCPConnector {
  name: string;
  
  // Lifecycle
  init(config: MCPConfig): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // MCP Protocol
  listTools(): Promise<Tool[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
  listResources(): Promise<Resource[]>;
  readResource(uri: string): Promise<ResourceContent>;
  
  // Sync (if enabled)
  sync(): Promise<SyncResult>;
}

export interface DatabaseConnector {
  name: string;
  
  // Lifecycle
  init(config: DatabaseConfig): Promise<void>;
  migrate(): Promise<void>;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
  
  // Generic query
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<ExecuteResult>;
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
}
```

## Built-in Connectors

### Storage Connectors

| Connector | Type | Description |
|-----------|------|-------------|
| `0711StorageConnector` | `0711-storage` | Native 0711-Storage integration |
| `S3Connector` | `s3` | AWS S3 / S3-compatible |
| `MinioConnector` | `minio` | MinIO specific optimizations |
| `LocalConnector` | `local` | Local filesystem |
| `IPFSConnector` | `ipfs` | IPFS for decentralized storage |

### Chain Connectors

| Connector | Type | Networks |
|-----------|------|----------|
| `BaseConnector` | `base` | Base Mainnet/Sepolia |
| `EthereumConnector` | `ethereum` | Mainnet/Goerli/Sepolia |
| `PolygonConnector` | `polygon` | Mainnet/Mumbai |
| `SolanaConnector` | `solana` | Mainnet/Devnet |
| `NoneConnector` | `none` | No blockchain (dev mode) |

### MCP Connectors

| Connector | Transport | Description |
|-----------|-----------|-------------|
| `StdioMCPConnector` | `stdio` | Subprocess communication |
| `HttpMCPConnector` | `http` | HTTP-based MCP |
| `WebSocketMCPConnector` | `ws` | WebSocket MCP |

## Usage

```typescript
import { GitChain, loadConfig } from "@0711/gitchain";

// Load config from file
const config = await loadConfig("./gitchain.config.yaml");

// Initialize GitChain with connectors
const gitchain = new GitChain(config);
await gitchain.init();

// Connectors are now available
const containers = await gitchain.containers.list();
const verified = await gitchain.verify("0711:product:acme:widget:v1");

// MCP tools exposed automatically
// Agents can call: gitchain.inject, gitchain.verify, etc.
```

## MCP Server Mode

GitChain can expose itself as an MCP server:

```typescript
// gitchain.config.yaml
mcp:
  server:
    enabled: true
    transport: "stdio"

// Agent can now use GitChain tools:
// - inject({ containers: [...] })
// - verify({ containerId: "..." })
// - containers.get({ id: "..." })
// - search({ query: "...", type: "product" })
```

## MCP Client Mode — Auto-Sync

GitChain can connect to external MCPs and sync data:

```yaml
mcp:
  clients:
    - name: "bosch-mcp"
      url: "http://localhost:3333/mcp"
      sync:
        enabled: true
        interval: "1h"
        containerType: "product"
        namespace: "bosch"
        # Map MCP resources to container fields
        mapping:
          resource: "product://{id}"
          fields:
            name: "$.name"
            description: "$.description"
            specs: "$.technical_specifications"
```

When sync runs:
1. GitChain calls MCP `listResources()`
2. For each resource, calls `readResource(uri)`
3. Maps data to container format
4. Creates/updates container in GitChain
5. Anchors to blockchain

## File Structure

```
packages/
├── core/
│   └── src/
│       ├── connectors/
│       │   ├── types.ts           # Interfaces
│       │   ├── registry.ts        # Connector registry
│       │   ├── storage/
│       │   │   ├── 0711.ts        # 0711-Storage
│       │   │   ├── s3.ts          # AWS S3
│       │   │   ├── minio.ts       # MinIO
│       │   │   ├── local.ts       # Local FS
│       │   │   └── ipfs.ts        # IPFS
│       │   ├── chain/
│       │   │   ├── base.ts        # Base L2
│       │   │   ├── ethereum.ts    # Ethereum
│       │   │   └── none.ts        # No-op
│       │   ├── mcp/
│       │   │   ├── server.ts      # MCP Server
│       │   │   ├── stdio.ts       # Stdio client
│       │   │   ├── http.ts        # HTTP client
│       │   │   └── sync.ts        # Auto-sync logic
│       │   └── database/
│       │       ├── postgresql.ts
│       │       └── sqlite.ts
│       └── config/
│           ├── loader.ts          # YAML config loader
│           ├── validator.ts       # Schema validation
│           └── schema.ts          # Config schema
```
