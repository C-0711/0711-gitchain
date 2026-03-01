#!/usr/bin/env node
/**
 * GitChain CLI
 * Verified context injection for AI agents
 *
 * @example
 *   gitchain login
 *   gitchain containers list
 *   gitchain inject product:bosch:1234
 *   gitchain verify product:bosch:1234
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as readline from "readline";

import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";

// ============================================
// CONFIGURATION
// ============================================

const API_URL = process.env.GITCHAIN_API_URL || "https://api-gitchain.0711.io";
const CONFIG_DIR = path.join(os.homedir(), ".gitchain");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const TOKEN_FILE = path.join(CONFIG_DIR, "token");

interface Config {
  apiUrl?: string;
  defaultNamespace?: string;
}

function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch (_) {
    /* ignore */
  }
  return {};
}

function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

function loadToken(): string | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return fs.readFileSync(TOKEN_FILE, "utf8").trim();
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

function saveToken(token: string): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
}

function clearToken(): void {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      fs.unlinkSync(TOKEN_FILE);
    }
  } catch (_) {
    /* ignore */
  }
}

function getApiUrl(): string {
  const config = loadConfig();
  return config.apiUrl || API_URL;
}

async function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      process.stdout.write(question);
      const stdin = process.stdin;
      stdin.setRawMode?.(true);
      stdin.resume();

      let password = "";
      stdin.on("data", (char) => {
        const c = char.toString("utf8");
        if (c === "\n" || c === "\r") {
          stdin.setRawMode?.(false);
          console.log();
          rl.close();
          resolve(password);
        } else if (c === "\u0003") {
          process.exit();
        } else if (c === "\u007F") {
          password = password.slice(0, -1);
        } else {
          password += c;
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

function authHeaders(): Record<string, string> {
  const token = loadToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

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

program.name("gitchain").description("Verified context injection for AI agents").version("0.1.0");

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

      const container = (await response.json()) as Container;
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
  .action(
    async (
      containerIds: string[],
      options: { format: string; output?: string; verify: boolean }
    ) => {
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

        const result = (await response.json()) as InjectResult;
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
    }
  );

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

      const result = (await response.json()) as VerifyResult;

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

      const results = (await response.json()) as SearchResult[];
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

// ============================================
// AUTH COMMANDS
// ============================================

program
  .command("login")
  .description("Login to GitChain")
  .option("--token <token>", "Use API token directly")
  .action(async (options: { token?: string }) => {
    if (options.token) {
      saveToken(options.token);
      console.log(chalk.green("✓ Token saved"));
      return;
    }

    console.log(chalk.bold("\nGitChain Login\n"));

    const email = await prompt("Email: ");
    const password = await prompt("Password: ", true);

    const spinner = ora("Logging in...").start();

    try {
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as any;
        throw new Error(error.error || `Login failed: ${response.status}`);
      }

      const { token, user } = (await response.json()) as any;
      saveToken(token);
      spinner.succeed(chalk.green(`Logged in as ${user.email}`));
    } catch (error) {
      spinner.fail(chalk.red(`Login failed: ${error}`));
      process.exit(1);
    }
  });

program
  .command("logout")
  .description("Logout from GitChain")
  .action(() => {
    clearToken();
    console.log(chalk.green("✓ Logged out"));
  });

program
  .command("whoami")
  .description("Show current user")
  .action(async () => {
    const token = loadToken();
    if (!token) {
      console.log(chalk.yellow("Not logged in. Run: gitchain login"));
      return;
    }

    const spinner = ora("Checking...").start();

    try {
      const response = await fetch(`${getApiUrl()}/auth/me`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Auth failed: ${response.status}`);
      }

      const user = (await response.json()) as any;
      spinner.stop();
      console.log(chalk.bold(`\n  ${user.name || user.username}`));
      console.log(chalk.dim(`  ${user.email}`));
      console.log();
    } catch (error) {
      spinner.fail(chalk.red(`${error}`));
      process.exit(1);
    }
  });

// ============================================
// CONTAINERS COMMANDS
// ============================================

const containers = program.command("containers").description("Manage containers");

containers
  .command("list")
  .alias("ls")
  .description("List containers")
  .option("-t, --type <type>", "Filter by type")
  .option("-n, --namespace <namespace>", "Filter by namespace")
  .option("-l, --limit <n>", "Max results", "20")
  .option("--json", "Output as JSON")
  .action(async (options: { type?: string; namespace?: string; limit: string; json?: boolean }) => {
    const spinner = ora("Fetching containers...").start();

    try {
      const params = new URLSearchParams({ limit: options.limit });
      if (options.type) params.set("type", options.type);
      if (options.namespace) params.set("namespace", options.namespace);

      const response = await fetch(`${getApiUrl()}/api/containers?${params}`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const list = data.containers || data;
      spinner.succeed(chalk.green(`Found ${list.length} container(s)`));

      if (options.json) {
        console.log(JSON.stringify(list, null, 2));
        return;
      }

      console.log();
      for (const c of list) {
        const verified = c.is_verified || c.chain?.verified ? chalk.green("✓") : chalk.dim("○");
        console.log(`  ${verified} ${chalk.bold(c.container_id || c.id)}`);
        console.log(
          chalk.dim(`    ${c.type} | ${c.namespace}:${c.identifier} | v${c.version || 1}`)
        );
      }
      console.log();
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${error}`));
      process.exit(1);
    }
  });

containers
  .command("get <id>")
  .description("Get container details")
  .option("--json", "Output as JSON")
  .action(async (id: string, options: { json?: boolean }) => {
    const spinner = ora(`Fetching ${id}...`).start();

    try {
      const response = await fetch(`${getApiUrl()}/api/containers/${encodeURIComponent(id)}`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          spinner.fail(chalk.red(`Container not found: ${id}`));
          process.exit(1);
        }
        throw new Error(`API error: ${response.status}`);
      }

      const container = (await response.json()) as any;
      spinner.succeed(chalk.green(`Found ${id}`));

      if (options.json) {
        console.log(JSON.stringify(container, null, 2));
        return;
      }

      console.log();
      console.log(chalk.bold(`  ${container.container_id || container.id}`));
      console.log(chalk.dim(`  Type: ${container.type}`));
      console.log(chalk.dim(`  Namespace: ${container.namespace}`));
      console.log(chalk.dim(`  Version: ${container.version || 1}`));
      if (container.is_verified) {
        console.log(chalk.green(`  ✓ Verified on blockchain`));
      }
      console.log();
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${error}`));
      process.exit(1);
    }
  });

containers
  .command("create")
  .description("Create a new container")
  .option("-t, --type <type>", "Container type", "product")
  .option("-n, --namespace <namespace>", "Namespace", "default")
  .option("-i, --identifier <id>", "Identifier")
  .option("-f, --file <path>", "Load data from JSON file")
  .action(
    async (options: { type: string; namespace: string; identifier?: string; file?: string }) => {
      const token = loadToken();
      if (!token) {
        console.log(chalk.red("Not logged in. Run: gitchain login"));
        process.exit(1);
      }

      let data: Record<string, unknown> = {};

      if (options.file) {
        try {
          data = JSON.parse(fs.readFileSync(options.file, "utf8"));
        } catch (error) {
          console.log(chalk.red(`Failed to read file: ${error}`));
          process.exit(1);
        }
      }

      const identifier = options.identifier || `item-${Date.now()}`;
      const spinner = ora(`Creating ${options.type}:${options.namespace}:${identifier}...`).start();

      try {
        const response = await fetch(`${getApiUrl()}/api/containers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            type: options.type,
            namespace: options.namespace,
            identifier,
            data,
          }),
        });

        if (!response.ok) {
          const error = (await response.json().catch(() => ({}))) as any;
          throw new Error(error.error || `API error: ${response.status}`);
        }

        const container = (await response.json()) as any;
        spinner.succeed(chalk.green(`Created ${container.container_id || container.id}`));
      } catch (error) {
        spinner.fail(chalk.red(`Failed: ${error}`));
        process.exit(1);
      }
    }
  );

// ============================================
// CONFIG COMMAND
// ============================================

program
  .command("config")
  .description("Show or set configuration")
  .option("--set <key=value>", "Set a config value")
  .action((options: { set?: string }) => {
    if (options.set) {
      const [key, value] = options.set.split("=");
      const config = loadConfig();
      (config as Record<string, string>)[key] = value;
      saveConfig(config);
      console.log(chalk.green(`✓ Set ${key}=${value}`));
      return;
    }

    const config = loadConfig();
    const token = loadToken();

    console.log(chalk.bold("\nGitChain Configuration\n"));
    console.log(`  API URL:    ${chalk.cyan(config.apiUrl || API_URL)}`);
    console.log(`  Namespace:  ${chalk.cyan(config.defaultNamespace || "(not set)")}`);
    console.log(`  Logged in:  ${token ? chalk.green("yes") : chalk.yellow("no")}`);
    console.log(`  Config dir: ${chalk.dim(CONFIG_DIR)}`);
    console.log();
  });

program.parse();
