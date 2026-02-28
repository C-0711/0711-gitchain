/**
 * HTTP MCP Connector
 * 
 * Connects to MCP servers via HTTP transport.
 * Supports auto-sync of resources to GitChain containers.
 */

import type {
  MCPConnector,
  MCPConfig,
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPResourceContent,
  SyncResult,
  HealthCheckResult,
} from "../types.js";

interface HttpMCPConfig extends MCPConfig {
  type: "http";
  url: string;
  apiKey?: string;
  timeout?: number;
  sync?: {
    enabled: boolean;
    interval?: string;
    containerType?: string;
    namespace?: string;
    mapping?: Record<string, string>;
  };
}

export class HttpMCPConnector implements MCPConnector {
  readonly name: string;
  readonly type = "http";

  private config!: HttpMCPConfig;
  private baseUrl!: string;
  private headers!: Record<string, string>;
  private connected = false;
  private syncInterval?: NodeJS.Timeout;

  constructor() {
    this.name = "http-mcp";
  }

  async init(config: MCPConfig): Promise<void> {
    this.config = config as HttpMCPConfig;
    this.baseUrl = this.config.url.replace(/\/$/, "");
    this.headers = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      this.headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    // Update name from config
    (this as { name: string }).name = this.config.name || "http-mcp";
  }

  async connect(): Promise<void> {
    // Verify server is reachable
    const health = await this.healthCheck();
    if (!health.healthy) {
      throw new Error(`Cannot connect to MCP server: ${health.message}`);
    }
    this.connected = true;

    // Start sync interval if enabled
    if (this.config.sync?.enabled && this.config.sync.interval) {
      const intervalMs = this.parseInterval(this.config.sync.interval);
      this.syncInterval = setInterval(() => {
        this.sync?.().catch(console.error);
      }, intervalMs);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        headers: this.headers,
        signal: AbortSignal.timeout(5000),
      });

      return {
        healthy: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? "OK" : res.statusText,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : "Connection failed",
      };
    }
  }

  async listTools(): Promise<MCPTool[]> {
    const res = await this.mcpRequest("tools/list", {});
    return res.tools || [];
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    return this.mcpRequest("tools/call", { name, arguments: args });
  }

  async listResources(): Promise<MCPResource[]> {
    const res = await this.mcpRequest("resources/list", {});
    return res.resources || [];
  }

  async readResource(uri: string): Promise<MCPResourceContent> {
    const res = await this.mcpRequest("resources/read", { uri });
    const content = res.contents?.[0] || {};
    return {
      uri,
      mimeType: content.mimeType || "text/plain",
      text: content.text,
      blob: content.blob ? Buffer.from(content.blob, "base64") : undefined,
    };
  }

  /**
   * Sync resources from MCP to GitChain containers
   */
  async sync(): Promise<SyncResult> {
    const start = Date.now();
    const result: SyncResult = {
      containersCreated: 0,
      containersUpdated: 0,
      containersSkipped: 0,
      errors: [],
      durationMs: 0,
    };

    if (!this.config.sync?.enabled) {
      result.durationMs = Date.now() - start;
      return result;
    }

    try {
      // List all resources
      const resources = await this.listResources();

      for (const resource of resources) {
        try {
          // Read resource content
          const content = await this.readResource(resource.uri);

          // Parse and map to container format
          let data: Record<string, unknown>;
          if (content.mimeType.includes("json") && content.text) {
            data = JSON.parse(content.text);
          } else {
            data = { raw: content.text || content.blob?.toString("base64") };
          }

          // Apply field mapping if configured
          if (this.config.sync.mapping) {
            data = this.applyMapping(data, this.config.sync.mapping);
          }

          // Create container ID
          const resourceId = this.extractResourceId(resource.uri);
          const containerId = `0711:${this.config.sync.containerType || "knowledge"}:${
            this.config.sync.namespace || this.config.name
          }:${resourceId}:v1`;

          // TODO: Call GitChain containers.create() or update()
          // For now, just count
          result.containersCreated++;
        } catch (err) {
          result.errors.push(
            `${resource.uri}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      }
    } catch (err) {
      result.errors.push(
        `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }

    result.durationMs = Date.now() - start;
    return result;
  }

  // ===========================================
  // PRIVATE HELPERS
  // ===========================================

  private async mcpRequest(
    method: string,
    params: Record<string, unknown>
  ): Promise<any> {
    const res = await fetch(`${this.baseUrl}/mcp`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!res.ok) {
      throw new Error(`MCP request failed: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`MCP error: ${data.error.message}`);
    }

    return data.result;
  }

  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return 3600000; // Default 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return 3600000;
    }
  }

  private extractResourceId(uri: string): string {
    // Extract ID from URI patterns like "product://123" or "file:///path/to/file"
    const match = uri.match(/([^/]+)$/);
    return match ? match[1] : uri.replace(/[^a-zA-Z0-9-_]/g, "_");
  }

  private applyMapping(
    data: Record<string, unknown>,
    mapping: Record<string, string>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [targetField, sourcePath] of Object.entries(mapping)) {
      // Simple JSONPath-like extraction
      const value = this.extractValue(data, sourcePath);
      if (value !== undefined) {
        result[targetField] = value;
      }
    }

    return result;
  }

  private extractValue(data: unknown, path: string): unknown {
    // Support simple JSONPath like "$.name" or "$.specs.weight"
    if (!path.startsWith("$.")) {
      return data;
    }

    const parts = path.slice(2).split(".");
    let current: unknown = data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === "object") {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}

/**
 * Factory function for connector registry
 */
export async function createHttpMCPConnector(
  config: MCPConfig
): Promise<MCPConnector> {
  const connector = new HttpMCPConnector();
  await connector.init(config);
  return connector;
}
