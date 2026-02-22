#!/usr/bin/env node
/**
 * GitChain CLI
 * 
 * Command-line interface for GitChain operations.
 */

import { parseArgs } from "node:util";
import { inject } from "@0711/inject";
import { validateContainerId } from "@0711/core";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    verify: { type: "boolean", default: true },
    "no-verify": { type: "boolean", default: false },
    format: { type: "string", default: "markdown" },
    citations: { type: "boolean", default: true },
    "no-citations": { type: "boolean", default: false },
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
    type: { type: "string", short: "t" },
    namespace: { type: "string", short: "n" },
    output: { type: "string", short: "o" },
  },
});

const command = positionals[0];
const args = positionals.slice(1);

async function main() {
  if (values.version) {
    console.log("gitchain v0.1.0");
    return;
  }

  if (values.help || !command) {
    printHelp();
    return;
  }

  switch (command) {
    case "inject":
      await handleInject(args);
      break;
    case "verify":
      await handleVerify(args);
      break;
    case "search":
      await handleSearch(args);
      break;
    case "list":
      await handleList();
      break;
    default:
      console.error(\`Unknown command: \${command}\`);
      printHelp();
      process.exit(1);
  }
}

async function handleInject(containerIds: string[]) {
  if (containerIds.length === 0) {
    console.error("Error: At least one container ID required");
    process.exit(1);
  }

  // Validate IDs
  for (const id of containerIds) {
    if (!validateContainerId(id)) {
      console.error(\`Invalid container ID: \${id}\`);
      process.exit(1);
    }
  }

  const context = await inject({
    containers: containerIds,
    verify: !values["no-verify"],
    format: (values.format as "markdown" | "json" | "yaml") || "markdown",
    includeCitations: !values["no-citations"],
  });

  if (context.containers.length === 0) {
    console.error("No containers found");
    process.exit(1);
  }

  console.log(context.formatted);

  // Print summary to stderr
  console.error(\`\\n---\\nContainers: \${context.containers.length}\`);
  console.error(\`Tokens: ~\${context.tokenCount}\`);
  console.error(\`Verified: \${context.verified ? "Yes" : "No"}\`);
}

async function handleVerify(args: string[]) {
  const hashOrId = args[0];
  if (!hashOrId) {
    console.error("Error: Container ID or hash required");
    process.exit(1);
  }

  if (validateContainerId(hashOrId)) {
    const context = await inject({
      containers: [hashOrId],
      verify: true,
      format: "json",
    });

    if (context.containers.length === 0) {
      console.log(JSON.stringify({ verified: false, reason: "Container not found" }, null, 2));
      return;
    }

    const proof = context.proofs[0];
    console.log(JSON.stringify({
      verified: context.verified,
      container: {
        id: context.containers[0].id,
        name: context.containers[0].meta.name,
        version: context.containers[0].version,
      },
      chain: proof ? {
        network: proof.network,
        batchId: proof.batchId,
        txHash: proof.txHash,
      } : null,
    }, null, 2));
  } else {
    console.log(JSON.stringify({
      verified: false,
      hash: hashOrId,
      reason: "Direct hash verification not yet implemented",
    }, null, 2));
  }
}

async function handleSearch(args: string[]) {
  const query = args.join(" ");
  if (!query) {
    console.error("Error: Search query required");
    process.exit(1);
  }

  // TODO: Implement search
  console.log(JSON.stringify({
    query,
    results: [],
    message: "Search not yet implemented",
  }, null, 2));
}

async function handleList() {
  // TODO: Implement list
  console.log(JSON.stringify({
    namespaces: [],
    message: "List not yet implemented",
  }, null, 2));
}

function printHelp() {
  console.log(\`
GitChain CLI - Blockchain-verified context injection

USAGE:
  gitchain <command> [options] [arguments]

COMMANDS:
  inject <id...>     Inject context from containers
  verify <id|hash>   Verify container or hash
  search <query>     Search containers
  list               List namespaces

OPTIONS:
  --format <fmt>     Output format: markdown, json, yaml (default: markdown)
  --no-verify        Skip blockchain verification
  --no-citations     Exclude source citations
  -h, --help         Show help
  -v, --version      Show version

EXAMPLES:
  gitchain inject 0711:product:bosch:7736606982:v3
  gitchain verify 0711:product:bosch:7736606982:v3
  gitchain inject 0711:product:bosch:* --format json
\`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
