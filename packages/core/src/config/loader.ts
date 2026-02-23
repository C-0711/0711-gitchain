/**
 * GitChain Configuration Loader
 * 
 * Loads and validates gitchain.config.yaml
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

// ===========================================
// CONFIG TYPES
// ===========================================

export interface GitChainConfig {
  version: string;
  storage: StorageConfigSection;
  database: DatabaseConfigSection;
  chain: ChainConfigSection;
  mcp: MCPConfigSection;
  processing?: ProcessingConfigSection;
  cache?: CacheConfigSection;
  auth?: AuthConfigSection;
}

export interface StorageConfigSection {
  type: "0711-storage" | "s3" | "minio" | "local" | "ipfs";
  endpoint?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  presign?: boolean;
  presignExpiry?: number;
}

export interface DatabaseConfigSection {
  type: "postgresql" | "sqlite" | "mongodb";
  url: string;
  pool?: {
    min?: number;
    max?: number;
  };
}

export interface ChainConfigSection {
  type: "base" | "ethereum" | "polygon" | "solana" | "none";
  network: "mainnet" | "testnet" | "local";
  rpc?: string;
  contract?: string;
  privateKey?: string;
  batchSize?: number;
  batchIntervalMs?: number;
}

export interface MCPConfigSection {
  server?: {
    enabled: boolean;
    transport?: "stdio" | "http" | "ws";
    port?: number;
    tools?: string[];
  };
  clients?: Array<{
    name: string;
    type: "stdio" | "http" | "ws";
    url?: string;
    command?: string[];
    apiKey?: string;
    sync?: {
      enabled: boolean;
      interval?: string;
      containerType?: string;
      namespace?: string;
      mapping?: Record<string, string>;
    };
  }>;
}

export interface ProcessingConfigSection {
  pdf?: {
    enabled: boolean;
    ocr?: boolean;
    provider?: "pixtral" | "tesseract" | "none";
  };
  images?: {
    thumbnails?: boolean;
    sizes?: number[];
    formats?: string[];
  };
  embeddings?: {
    enabled: boolean;
    provider?: "openai" | "ollama" | "none";
    model?: string;
    dimensions?: number;
  };
}

export interface CacheConfigSection {
  type: "redis" | "memory" | "none";
  url?: string;
  ttl?: number;
}

export interface AuthConfigSection {
  type: "api-key" | "jwt" | "oauth" | "none";
  prefix?: string;
  hashAlgorithm?: string;
  jwtSecret?: string;
}

// ===========================================
// ENV EXPANSION
// ===========================================

/**
 * Expand environment variables in config values
 * Supports ${VAR_NAME} syntax
 */
function expandEnvVars(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
      const envValue = process.env[varName];
      if (envValue === undefined) {
        console.warn(`Warning: Environment variable ${varName} is not set`);
        return "";
      }
      return envValue;
    });
  }

  if (Array.isArray(value)) {
    return value.map(expandEnvVars);
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = expandEnvVars(val);
    }
    return result;
  }

  return value;
}

// ===========================================
// VALIDATION
// ===========================================

function validateConfig(config: unknown): GitChainConfig {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid config: must be an object");
  }

  const c = config as Record<string, unknown>;

  // Version
  if (!c.version || typeof c.version !== "string") {
    throw new Error("Invalid config: version is required");
  }

  // Storage
  if (!c.storage || typeof c.storage !== "object") {
    throw new Error("Invalid config: storage section is required");
  }
  const storage = c.storage as Record<string, unknown>;
  if (!storage.type) {
    throw new Error("Invalid config: storage.type is required");
  }

  // Database
  if (!c.database || typeof c.database !== "object") {
    throw new Error("Invalid config: database section is required");
  }
  const database = c.database as Record<string, unknown>;
  if (!database.type || !database.url) {
    throw new Error("Invalid config: database.type and database.url are required");
  }

  // Chain
  if (!c.chain || typeof c.chain !== "object") {
    throw new Error("Invalid config: chain section is required");
  }
  const chain = c.chain as Record<string, unknown>;
  if (!chain.type || !chain.network) {
    throw new Error("Invalid config: chain.type and chain.network are required");
  }

  // MCP (optional but must be object if present)
  if (c.mcp && typeof c.mcp !== "object") {
    throw new Error("Invalid config: mcp must be an object");
  }

  return config as GitChainConfig;
}

// ===========================================
// LOADERS
// ===========================================

/**
 * Load config from YAML file
 */
export async function loadConfig(configPath: string): Promise<GitChainConfig> {
  const absolutePath = path.resolve(configPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Config file not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const parsed = yaml.load(content);
  const expanded = expandEnvVars(parsed);
  const validated = validateConfig(expanded);

  return validated;
}

/**
 * Load config from multiple sources with merging
 */
export async function loadConfigWithOverrides(
  baseConfigPath: string,
  overridePaths: string[] = []
): Promise<GitChainConfig> {
  // Load base config
  let config = await loadConfig(baseConfigPath);

  // Apply overrides
  for (const overridePath of overridePaths) {
    if (fs.existsSync(overridePath)) {
      const override = await loadConfig(overridePath);
      config = mergeConfigs(config, override);
    }
  }

  return config;
}

/**
 * Deep merge two configs
 */
function mergeConfigs(
  base: GitChainConfig,
  override: Partial<GitChainConfig>
): GitChainConfig {
  const result = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;

    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      value !== null &&
      typeof (result as any)[key] === "object"
    ) {
      (result as any)[key] = mergeConfigs(
        (result as any)[key],
        value as any
      );
    } else {
      (result as any)[key] = value;
    }
  }

  return result;
}

/**
 * Create default config
 */
export function createDefaultConfig(): GitChainConfig {
  return {
    version: "1.0",
    storage: {
      type: "local",
      bucket: "./data/storage",
    },
    database: {
      type: "sqlite",
      url: "./data/gitchain.db",
    },
    chain: {
      type: "none",
      network: "local",
    },
    mcp: {
      server: {
        enabled: false,
      },
      clients: [],
    },
  };
}

/**
 * Write config to YAML file
 */
export async function saveConfig(
  config: GitChainConfig,
  configPath: string
): Promise<void> {
  const content = yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  fs.writeFileSync(configPath, content, "utf-8");
}
