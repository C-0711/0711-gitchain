#!/usr/bin/env node
/**
 * GitChain CLI
 * Verified context injection for AI agents
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";

const API_URL = process.env.GITCHAIN_API_URL || "https://api-gitchain.0711.io";

// Types
interface Container {
  id: string;
  type: string;
  version: number;
  data?: Record<string, unknown>;
  chain?: { verified?: boolean; network?: string; blockNumber?: number; txHash?: string };
  meta?: { name?: string };
}

interface InjectResult {
  formatted?: string;
  containers?: Container[];
}

interface VerifyResult {
  verified: boolean;
  network?: string;
  blockNumber?: number;
  txHash?: string;
  reason?: string;
}

interface SearchResult {
  id: string;
  type: string;
  version: number;
  identifier: string;
  meta?: { name?: string };
}

const program = new Command();

program
  .name("gitchain")
  .description("Verified context injection for AI agents")
  .version("0.1.0");

// Pull command
program
  .command("pull <containerId>")
  .description("Pull a container and display its contents")
  .option("-f, --format <format>", "Output format (json|yaml|markdown)", "markdown")
  .option("-o, --output <file>", "Write output to file")
  .action(async (containerId: string, options: { format: string; output?: string }) => {
    const spinner = ora(`Pulling ${containerId}...`).start();
    
    try {
      const response = await fetch(`${API_URL}/api/containers/${encodeURIComponent(containerId)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          spinner.fail(chalk.red(`Container not found: ${containerId}`));
          process.exit(1);
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const container = await response.json() as Container;
      spinner.succeed(chalk.green(`Pulled ${containerId}`));
      
      console.log();
      console.log(chalk.dim(`  Type: ${container.type}`));
      console.log(chalk.dim(`  Version: v${container.version}`));
      console.log(chalk.dim(`  Atoms: ${Object.keys(container.data || {}).length}`));
      
      if (container.chain?.verified) {
        console.log(chalk.green(`  ✓ Verified on ${container.chain.network}`));
      }
      
      if (options.output) {
        const fs = await import("fs");
        fs.writeFileSync(options.output, JSON.stringify(container, null, 2));
        console.log(chalk.dim(`\n  Written to ${options.output}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to pull: ${error}`));
      process.exit(1);
    }
  });

// Inject command
program
  .command("inject <containerIds...>")
  .description("Inject containers into AI-ready context")
  .option("-f, --format <format>", "Output format (markdown|json|openai|anthropic)", "markdown")
  .option("-o, --output <file>", "Write output to file")
  .option("--verify", "Verify blockchain proofs", true)
  .action(async (containerIds: string[], options: { format: string; output?: string; verify: boolean }) => {
    const spinner = ora(`Injecting ${containerIds.length} container(s)...`).start();
    
    try {
      const response = await fetch(`${API_URL}/api/inject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          containers: containerIds,
          format: options.format,
          verify: options.verify,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json() as InjectResult;
      spinner.succeed(chalk.green(`Injected ${containerIds.length} container(s)`));
      
      if (options.output) {
        const fs = await import("fs");
        fs.writeFileSync(options.output, result.formatted || JSON.stringify(result, null, 2));
        console.log(chalk.dim(`\nWritten to ${options.output}`));
      } else {
        console.log();
        console.log(result.formatted || JSON.stringify(result, null, 2));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to inject: ${error}`));
      process.exit(1);
    }
  });

// Verify command
program
  .command("verify <containerId>")
  .description("Verify a container against blockchain")
  .action(async (containerId: string) => {
    const spinner = ora(`Verifying ${containerId}...`).start();
    
    try {
      const response = await fetch(`${API_URL}/api/verify/${encodeURIComponent(containerId)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json() as VerifyResult;
      
      if (result.verified) {
        spinner.succeed(chalk.green(`✓ Verified`));
        console.log();
        console.log(chalk.dim(`  Network: ${result.network || "Base Mainnet"}`));
        console.log(chalk.dim(`  Block: ${result.blockNumber || "N/A"}`));
        console.log(chalk.dim(`  TX: ${result.txHash || "N/A"}`));
      } else {
        spinner.warn(chalk.yellow(`⚠ Not verified`));
        console.log(chalk.dim(`\n  Reason: ${result.reason || "No blockchain anchor found"}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to verify: ${error}`));
      process.exit(1);
    }
  });

// Search command
program
  .command("search <query>")
  .description("Search for containers")
  .option("-l, --limit <n>", "Max results", "10")
  .action(async (query: string, options: { limit: string }) => {
    const spinner = ora(`Searching...`).start();
    
    try {
      const response = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(query)}&limit=${options.limit}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const results = await response.json() as SearchResult[];
      spinner.succeed(chalk.green(`Found ${results.length} result(s)`));
      
      console.log();
      for (const r of results) {
        console.log(chalk.bold(`  ${r.id}`));
        console.log(chalk.dim(`    ${r.meta?.name || r.identifier} | ${r.type} | v${r.version}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Search failed: ${error}`));
      process.exit(1);
    }
  });

// Config command
program
  .command("config")
  .description("Show current configuration")
  .action(() => {
    console.log(chalk.bold("\nGitChain Configuration\n"));
    console.log(`  API URL: ${chalk.cyan(API_URL)}`);
    console.log(`  Cache:   ${chalk.cyan(process.env.GITCHAIN_CACHE_ENABLED !== "false" ? "enabled" : "disabled")}`);
    console.log();
  });

program.parse();
