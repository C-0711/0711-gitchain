/**
 * GitChain MCP Server
 *
 * Exposes GitChain functionality as an MCP (Model Context Protocol) server.
 * AI agents can use this to inject verified context, search containers,
 * and verify data on blockchain.
 *
 * Tools:
 * - inject: Inject containers into agent context
 * - search: Search containers by query
 * - get_container: Get a single container by ID
 * - list_containers: List containers with filters
 * - verify: Verify container on blockchain
 *
 * Resources:
 * - container://{id}: Container data as resources
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// ============================================
// CONFIGURATION
// ============================================

export interface GitChainMcpConfig {
  apiUrl: string;
  apiKey?: string;
  timeout?: number;
}

const defaultConfig: GitChainMcpConfig = {
  apiUrl: process.env.GITCHAIN_API_URL || "http://localhost:3100",
  apiKey: process.env.GITCHAIN_API_KEY,
  timeout: 30000,
};

// ============================================
// API CLIENT
// ============================================

class GitChainClient {
  constructor(private config: GitChainMcpConfig) {}

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options?.headers },
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({ error: "Unknown error" }))) as any;
      throw new Error(error.error?.message || error.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async inject(containerIds: string[], options?: { format?: string; verify?: boolean }) {
    return this.fetch<{
      data: {
        containers: Array<{ id: string; type: string; data: unknown; verified: boolean }>;
        formatted: string;
        containerCount: number;
      };
    }>("/api/inject", {
      method: "POST",
      body: JSON.stringify({
        containers: containerIds,
        format: options?.format || "markdown",
        verify: options?.verify ?? true,
      }),
    });
  }

  async search(query: string, options?: { type?: string; namespace?: string; limit?: number }) {
    const params = new URLSearchParams({ q: query });
    if (options?.type) params.set("type", options.type);
    if (options?.namespace) params.set("namespace", options.namespace);
    if (options?.limit) params.set("limit", options.limit.toString());

    return this.fetch<{
      data: Array<{
        id: string;
        container_id: string;
        type: string;
        namespace: string;
        identifier: string;
        data: unknown;
      }>;
      meta: { total: number };
    }>(`/api/search?${params}`);
  }

  async getContainer(id: string) {
    return this.fetch<{
      data: {
        container: {
          id: string;
          container_id: string;
          type: string;
          namespace: string;
          identifier: string;
          data: unknown;
          is_verified: boolean;
        };
      };
    }>(`/v1/containers/${encodeURIComponent(id)}`);
  }

  async listContainers(options?: {
    type?: string;
    namespace?: string;
    limit?: number;
    page?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.type) params.set("type", options.type);
    if (options?.namespace) params.set("namespace", options.namespace);
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.page) params.set("page", options.page.toString());

    return this.fetch<{
      data: Array<{
        id: string;
        container_id: string;
        type: string;
        namespace: string;
        identifier: string;
      }>;
      meta: { total: number; page: number; limit: number };
    }>(`/v1/containers?${params}`);
  }

  async verify(containerId: string) {
    return this.fetch<{
      data: {
        verified: boolean;
        container_id: string;
        content_hash: string;
        tx_hash?: string;
        block_number?: number;
        timestamp?: string;
      };
    }>(`/v1/chain/verify/${encodeURIComponent(containerId)}`);
  }
}

// ============================================
// TOOL SCHEMAS
// ============================================

const InjectSchema = z.object({
  container_ids: z
    .array(z.string())
    .min(1)
    .describe("Array of container IDs to inject (e.g., ['0711:product:bosch:123:v1'])"),
  format: z
    .enum(["markdown", "json", "yaml"])
    .optional()
    .default("markdown")
    .describe("Output format for the injected context"),
  verify: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to verify containers on blockchain"),
});

const SearchSchema = z.object({
  query: z.string().min(1).describe("Search query string"),
  type: z
    .enum(["product", "campaign", "project", "memory", "knowledge"])
    .optional()
    .describe("Filter by container type"),
  namespace: z.string().optional().describe("Filter by namespace (e.g., 'bosch', 'siemens')"),
  limit: z.number().min(1).max(100).optional().default(10).describe("Maximum results to return"),
});

const GetContainerSchema = z.object({
  id: z
    .string()
    .describe("Container ID (UUID or full container_id like '0711:product:bosch:123:v1')"),
});

const ListContainersSchema = z.object({
  type: z
    .enum(["product", "campaign", "project", "memory", "knowledge"])
    .optional()
    .describe("Filter by container type"),
  namespace: z.string().optional().describe("Filter by namespace"),
  limit: z.number().min(1).max(100).optional().default(20).describe("Maximum results"),
  page: z.number().min(1).optional().default(1).describe("Page number"),
});

const VerifySchema = z.object({
  container_id: z.string().describe("Container ID to verify on blockchain"),
});

// ============================================
// MCP SERVER
// ============================================

export function createGitChainMcpServer(config?: Partial<GitChainMcpConfig>): Server {
  const finalConfig = { ...defaultConfig, ...config };
  const client = new GitChainClient(finalConfig);

  const server = new Server(
    {
      name: "gitchain",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // ============================================
  // TOOLS
  // ============================================

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "inject",
        description:
          "Inject verified container data into the conversation context. Returns formatted content ready for LLM consumption with full citation trail.",
        inputSchema: {
          type: "object",
          properties: {
            container_ids: {
              type: "array",
              items: { type: "string" },
              description: "Array of container IDs to inject",
            },
            format: {
              type: "string",
              enum: ["markdown", "json", "yaml"],
              default: "markdown",
              description: "Output format",
            },
            verify: {
              type: "boolean",
              default: true,
              description: "Verify on blockchain",
            },
          },
          required: ["container_ids"],
        },
      },
      {
        name: "search",
        description:
          "Search for containers by text query. Returns matching containers with their IDs for use with inject.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            type: {
              type: "string",
              enum: ["product", "campaign", "project", "memory", "knowledge"],
              description: "Filter by type",
            },
            namespace: { type: "string", description: "Filter by namespace" },
            limit: { type: "number", default: 10, description: "Max results" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_container",
        description: "Get a single container by its ID. Returns full container data.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Container ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "list_containers",
        description: "List containers with optional filtering by type and namespace.",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["product", "campaign", "project", "memory", "knowledge"],
            },
            namespace: { type: "string" },
            limit: { type: "number", default: 20 },
            page: { type: "number", default: 1 },
          },
        },
      },
      {
        name: "verify",
        description:
          "Verify a container's data integrity on Base blockchain. Returns verification status and proof.",
        inputSchema: {
          type: "object",
          properties: {
            container_id: { type: "string", description: "Container ID to verify" },
          },
          required: ["container_id"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "inject": {
          const parsed = InjectSchema.parse(args);
          const result = await client.inject(parsed.container_ids, {
            format: parsed.format,
            verify: parsed.verify,
          });
          return {
            content: [
              {
                type: "text",
                text: result.data.formatted,
              },
            ],
          };
        }

        case "search": {
          const parsed = SearchSchema.parse(args);
          const result = await client.search(parsed.query, {
            type: parsed.type,
            namespace: parsed.namespace,
            limit: parsed.limit,
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    results: result.data,
                    total: result.meta.total,
                    query: parsed.query,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "get_container": {
          const parsed = GetContainerSchema.parse(args);
          const result = await client.getContainer(parsed.id);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result.data.container, null, 2),
              },
            ],
          };
        }

        case "list_containers": {
          const parsed = ListContainersSchema.parse(args);
          const result = await client.listContainers({
            type: parsed.type,
            namespace: parsed.namespace,
            limit: parsed.limit,
            page: parsed.page,
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    containers: result.data,
                    meta: result.meta,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "verify": {
          const parsed = VerifySchema.parse(args);
          const result = await client.verify(parsed.container_id);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result.data, null, 2),
              },
            ],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }
  });

  // ============================================
  // RESOURCES
  // ============================================

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "gitchain://containers",
        name: "Container List",
        description: "List of available containers",
        mimeType: "application/json",
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === "gitchain://containers") {
      const result = await client.listContainers({ limit: 50 });
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    }

    // Handle container://{id} URIs
    if (uri.startsWith("gitchain://container/")) {
      const id = uri.replace("gitchain://container/", "");
      const result = await client.getContainer(id);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(result.data.container, null, 2),
          },
        ],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
  });

  return server;
}

// ============================================
// EXPORTS
// ============================================

export { GitChainClient };
