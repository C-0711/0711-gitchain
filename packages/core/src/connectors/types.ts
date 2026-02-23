/**
 * GitChain Connector Types
 * 
 * All connectors implement these interfaces for pluggable backends.
 */

// ===========================================
// COMMON TYPES
// ===========================================

export interface ConnectorConfig {
  type: string;
  [key: string]: unknown;
}

export interface HealthCheckResult {
  healthy: boolean;
  latencyMs?: number;
  message?: string;
}

// ===========================================
// STORAGE CONNECTOR
// ===========================================

export interface StorageConfig extends ConnectorConfig {
  type: "0711-storage" | "s3" | "minio" | "local" | "ipfs";
  endpoint?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  presign?: boolean;
  presignExpiry?: number;
}

export interface ObjectMetadata {
  contentType?: string;
  contentLength?: number;
  etag?: string;
  lastModified?: Date;
  custom?: Record<string, string>;
}

export interface PutResult {
  key: string;
  etag: string;
  size: number;
  versionId?: string;
}

export interface ListOptions {
  maxKeys?: number;
  continuationToken?: string;
  delimiter?: string;
}

export interface ListResult {
  objects: Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }>;
  isTruncated: boolean;
  continuationToken?: string;
}

export interface StorageStats {
  bucketCount: number;
  objectCount: number;
  totalBytes: number;
  dedupRatio?: number;
}

export interface StorageConnector {
  readonly name: string;
  readonly type: string;

  // Lifecycle
  init(config: StorageConfig): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;
  close(): Promise<void>;

  // CRUD Operations
  put(key: string, data: Buffer, metadata?: ObjectMetadata): Promise<PutResult>;
  get(key: string): Promise<Buffer>;
  head(key: string): Promise<ObjectMetadata | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix: string, options?: ListOptions): Promise<ListResult>;

  // Presigned URLs
  presignGet(key: string, expiresIn?: number): Promise<string>;
  presignPut(key: string, contentType?: string, expiresIn?: number): Promise<string>;

  // Stats
  getStats(): Promise<StorageStats>;
}

// ===========================================
// CHAIN CONNECTOR
// ===========================================

export interface ChainConfig extends ConnectorConfig {
  type: "base" | "ethereum" | "polygon" | "solana" | "none";
  network: "mainnet" | "testnet" | "local";
  rpc?: string;
  contract?: string;
  privateKey?: string;
  batchSize?: number;
  batchIntervalMs?: number;
}

export interface BatchInfo {
  batchId: number;
  merkleRoot: string;
  metadataUri: string;
  timestamp: Date;
  registrar: string;
  txHash: string;
  blockNumber: number;
}

export interface BatchResult {
  batchId: number;
  txHash: string;
  blockNumber: number;
  gasUsed: bigint;
}

export interface BatchEvent {
  batchId: number;
  merkleRoot: string;
  registrar: string;
  txHash: string;
  blockNumber: number;
}

export interface ChainConnector {
  readonly name: string;
  readonly type: string;
  readonly network: string;
  readonly contractAddress: string;

  // Lifecycle
  init(config: ChainConfig): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;

  // Read operations (no wallet needed)
  getBatch(batchId: number): Promise<BatchInfo | null>;
  getBatchCount(): Promise<number>;
  verifyContent(
    batchId: number,
    contentHash: string,
    proof: string[]
  ): Promise<boolean>;

  // Write operations (wallet required)
  registerBatch(merkleRoot: string, metadataUri: string): Promise<BatchResult>;

  // Events
  onBatchRegistered(callback: (event: BatchEvent) => void): () => void;
}

// ===========================================
// MCP CONNECTOR
// ===========================================

export interface MCPConfig extends ConnectorConfig {
  type: "stdio" | "http" | "ws";
  name: string;
  command?: string[];
  url?: string;
  apiKey?: string;
  sync?: {
    enabled: boolean;
    interval?: string;
    containerType?: string;
    namespace?: string;
    mapping?: Record<string, string>;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  isError?: boolean;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: Buffer;
}

export interface SyncResult {
  containersCreated: number;
  containersUpdated: number;
  containersSkipped: number;
  errors: string[];
  durationMs: number;
}

export interface MCPConnector {
  readonly name: string;
  readonly type: string;

  // Lifecycle
  init(config: MCPConfig): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;

  // MCP Protocol
  listTools(): Promise<MCPTool[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult>;
  listResources(): Promise<MCPResource[]>;
  readResource(uri: string): Promise<MCPResourceContent>;

  // Sync (if enabled)
  sync?(): Promise<SyncResult>;
}

// ===========================================
// DATABASE CONNECTOR
// ===========================================

export interface DatabaseConfig extends ConnectorConfig {
  type: "postgresql" | "sqlite" | "mongodb";
  url: string;
  pool?: {
    min?: number;
    max?: number;
  };
}

export interface ExecuteResult {
  rowCount: number;
  lastInsertId?: number | string;
}

export interface Transaction {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<ExecuteResult>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface DatabaseConnector {
  readonly name: string;
  readonly type: string;

  // Lifecycle
  init(config: DatabaseConfig): Promise<void>;
  migrate(): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;
  close(): Promise<void>;

  // Query operations
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<ExecuteResult>;
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
}

// ===========================================
// CONNECTOR REGISTRY
// ===========================================

export type ConnectorFactory<T, C extends ConnectorConfig> = (
  config: C
) => Promise<T>;

export interface ConnectorRegistry {
  // Storage
  registerStorage(
    type: string,
    factory: ConnectorFactory<StorageConnector, StorageConfig>
  ): void;
  getStorage(config: StorageConfig): Promise<StorageConnector>;

  // Chain
  registerChain(
    type: string,
    factory: ConnectorFactory<ChainConnector, ChainConfig>
  ): void;
  getChain(config: ChainConfig): Promise<ChainConnector>;

  // MCP
  registerMCP(
    type: string,
    factory: ConnectorFactory<MCPConnector, MCPConfig>
  ): void;
  getMCP(config: MCPConfig): Promise<MCPConnector>;

  // Database
  registerDatabase(
    type: string,
    factory: ConnectorFactory<DatabaseConnector, DatabaseConfig>
  ): void;
  getDatabase(config: DatabaseConfig): Promise<DatabaseConnector>;
}
