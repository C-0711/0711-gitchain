#!/usr/bin/env node
/**
 * GitChain MCP Server CLI
 *
 * Run as: gitchain-mcp
 * Or: npx @0711/mcp-server
 *
 * Environment variables:
 * - GITCHAIN_API_URL: API URL (default: http://localhost:3100)
 * - GITCHAIN_API_KEY: API key for authentication
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createGitChainMcpServer } from "./index.js";

async function main() {
  const server = createGitChainMcpServer({
    apiUrl: process.env.GITCHAIN_API_URL,
    apiKey: process.env.GITCHAIN_API_KEY,
  });

  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });

  console.error("GitChain MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
