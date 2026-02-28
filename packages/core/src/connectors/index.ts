/**
 * GitChain Connectors
 * 
 * Pluggable backends for storage, blockchain, MCP, and database.
 */

// Types
export * from "./types.js";

// Registry
export {
  registry,
  registerStorage,
  registerChain,
  registerMCP,
  registerDatabase,
  getStorage,
  getChain,
  getMCP,
  getDatabase,
} from "./registry.js";

// Storage connectors
export { Storage0711Connector, create0711StorageConnector } from "./storage/0711-storage.js";
// export { S3Connector, createS3Connector } from "./storage/s3";
// export { MinioConnector, createMinioConnector } from "./storage/minio";
// export { LocalConnector, createLocalConnector } from "./storage/local";

// MCP connectors
export { HttpMCPConnector, createHttpMCPConnector } from "./mcp/http.js";
// export { StdioMCPConnector, createStdioMCPConnector } from "./mcp/stdio";

// Chain connectors
// export { BaseConnector, createBaseConnector } from "./chain/base";
// export { NoneConnector, createNoneConnector } from "./chain/none";

// Database connectors
// export { PostgreSQLConnector, createPostgreSQLConnector } from "./database/postgresql";
// export { SQLiteConnector, createSQLiteConnector } from "./database/sqlite";
