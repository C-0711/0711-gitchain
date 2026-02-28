/**
 * GitChain Connector Registry
 * 
 * Central registry for all connector types.
 * Supports dynamic registration of custom connectors.
 */

import type {
  ConnectorRegistry,
  StorageConnector,
  StorageConfig,
  ChainConnector,
  ChainConfig,
  MCPConnector,
  MCPConfig,
  DatabaseConnector,
  DatabaseConfig,
  ConnectorFactory,
} from "./types.js";

// Built-in connectors
import { create0711StorageConnector } from "./storage/0711-storage.js";
import { createHttpMCPConnector } from "./mcp/http.js";

class ConnectorRegistryImpl implements ConnectorRegistry {
  private storageFactories = new Map<
    string,
    ConnectorFactory<StorageConnector, StorageConfig>
  >();

  private chainFactories = new Map<
    string,
    ConnectorFactory<ChainConnector, ChainConfig>
  >();

  private mcpFactories = new Map<
    string,
    ConnectorFactory<MCPConnector, MCPConfig>
  >();

  private databaseFactories = new Map<
    string,
    ConnectorFactory<DatabaseConnector, DatabaseConfig>
  >();

  constructor() {
    // Register built-in connectors
    this.registerBuiltins();
  }

  private registerBuiltins(): void {
    // Storage
    this.storageFactories.set("0711-storage", create0711StorageConnector);
    // TODO: Add S3, MinIO, Local, IPFS connectors

    // MCP
    this.mcpFactories.set("http", createHttpMCPConnector);
    // TODO: Add stdio, ws connectors

    // Chain
    // TODO: Add Base, Ethereum, Polygon, None connectors

    // Database
    // TODO: Add PostgreSQL, SQLite connectors
  }

  // ===========================================
  // STORAGE
  // ===========================================

  registerStorage(
    type: string,
    factory: ConnectorFactory<StorageConnector, StorageConfig>
  ): void {
    this.storageFactories.set(type, factory);
  }

  async getStorage(config: StorageConfig): Promise<StorageConnector> {
    const factory = this.storageFactories.get(config.type);
    if (!factory) {
      throw new Error(`Unknown storage connector type: ${config.type}`);
    }
    return factory(config);
  }

  // ===========================================
  // CHAIN
  // ===========================================

  registerChain(
    type: string,
    factory: ConnectorFactory<ChainConnector, ChainConfig>
  ): void {
    this.chainFactories.set(type, factory);
  }

  async getChain(config: ChainConfig): Promise<ChainConnector> {
    const factory = this.chainFactories.get(config.type);
    if (!factory) {
      throw new Error(`Unknown chain connector type: ${config.type}`);
    }
    return factory(config);
  }

  // ===========================================
  // MCP
  // ===========================================

  registerMCP(
    type: string,
    factory: ConnectorFactory<MCPConnector, MCPConfig>
  ): void {
    this.mcpFactories.set(type, factory);
  }

  async getMCP(config: MCPConfig): Promise<MCPConnector> {
    const factory = this.mcpFactories.get(config.type);
    if (!factory) {
      throw new Error(`Unknown MCP connector type: ${config.type}`);
    }
    return factory(config);
  }

  // ===========================================
  // DATABASE
  // ===========================================

  registerDatabase(
    type: string,
    factory: ConnectorFactory<DatabaseConnector, DatabaseConfig>
  ): void {
    this.databaseFactories.set(type, factory);
  }

  async getDatabase(config: DatabaseConfig): Promise<DatabaseConnector> {
    const factory = this.databaseFactories.get(config.type);
    if (!factory) {
      throw new Error(`Unknown database connector type: ${config.type}`);
    }
    return factory(config);
  }

  // ===========================================
  // INFO
  // ===========================================

  listStorageTypes(): string[] {
    return Array.from(this.storageFactories.keys());
  }

  listChainTypes(): string[] {
    return Array.from(this.chainFactories.keys());
  }

  listMCPTypes(): string[] {
    return Array.from(this.mcpFactories.keys());
  }

  listDatabaseTypes(): string[] {
    return Array.from(this.databaseFactories.keys());
  }
}

// Singleton instance
export const registry = new ConnectorRegistryImpl();

// Convenience exports
export const registerStorage = registry.registerStorage.bind(registry);
export const registerChain = registry.registerChain.bind(registry);
export const registerMCP = registry.registerMCP.bind(registry);
export const registerDatabase = registry.registerDatabase.bind(registry);

export const getStorage = registry.getStorage.bind(registry);
export const getChain = registry.getChain.bind(registry);
export const getMCP = registry.getMCP.bind(registry);
export const getDatabase = registry.getDatabase.bind(registry);
