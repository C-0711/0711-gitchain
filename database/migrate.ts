#!/usr/bin/env npx tsx
/**
 * GitChain Database Migration Runner (Node.js)
 *
 * Usage:
 *   npx tsx database/migrate.ts up
 *   npx tsx database/migrate.ts down 010
 *   npx tsx database/migrate.ts status
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://gitchain:gitchain2026@localhost:5440/gitchain";

// Database connection
const pool = new Pool({ connectionString: DATABASE_URL });

// Colors for terminal output
const colors = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
};

// Initialize migrations table
async function initMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

// Get list of applied migrations
async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query(
    "SELECT version FROM schema_migrations ORDER BY version"
  );
  return result.rows.map((r) => r.version);
}

// Check if migration is applied
async function isApplied(version: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT 1 FROM schema_migrations WHERE version = $1",
    [version]
  );
  return result.rows.length > 0;
}

// Get migration files
function getMigrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"))
    .sort();
}

// Parse migration file name
function parseMigrationName(filename: string): { version: string; name: string } {
  const version = filename.split("_")[0];
  const name = filename.replace(".sql", "");
  return { version, name };
}

// Run a single migration
async function runMigration(filename: string): Promise<boolean> {
  const { version, name } = parseMigrationName(filename);

  if (await isApplied(version)) {
    console.log(`${colors.yellow("SKIP")} ${name} (already applied)`);
    return true;
  }

  console.log(`${colors.green("RUNNING")} ${name}...`);

  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, "utf8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
      [version, name]
    );
    await client.query("COMMIT");
    console.log(`${colors.green("OK")} ${name}`);
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`${colors.red("FAILED")} ${name}`);
    console.error(error);
    return false;
  } finally {
    client.release();
  }
}

// Run all pending migrations
async function migrateUp(): Promise<void> {
  console.log("Running migrations...\n");

  const files = getMigrationFiles();
  let count = 0;

  for (const file of files) {
    if (!(await runMigration(file))) {
      console.log(`\n${colors.red("Migration failed. Stopping.")}`);
      process.exit(1);
    }
    count++;
  }

  console.log(`\n${colors.green("Done.")} ${count} migrations processed.`);
}

// Rollback a specific migration
async function migrateDown(version: string): Promise<void> {
  const downFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.startsWith(version) && f.endsWith(".down.sql"));

  if (downFiles.length === 0) {
    console.error(
      `${colors.red("ERROR")} No rollback file found for migration ${version}`
    );
    console.error(`Expected: ${version}_*.down.sql`);
    process.exit(1);
  }

  const file = downFiles[0];
  const { name } = parseMigrationName(file.replace(".down.sql", ""));

  if (!(await isApplied(version))) {
    console.log(`${colors.yellow("SKIP")} ${name} (not applied)`);
    return;
  }

  console.log(`${colors.yellow("ROLLING BACK")} ${name}...`);

  const filePath = path.join(MIGRATIONS_DIR, file);
  const sql = fs.readFileSync(filePath, "utf8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("DELETE FROM schema_migrations WHERE version = $1", [
      version,
    ]);
    await client.query("COMMIT");
    console.log(`${colors.green("OK")} Rolled back ${name}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`${colors.red("FAILED")} ${name}`);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Show migration status
async function showStatus(): Promise<void> {
  console.log("Migration Status");
  console.log("================\n");

  const applied = await getAppliedMigrations();
  const files = getMigrationFiles();

  for (const file of files) {
    const { version, name } = parseMigrationName(file);
    if (applied.includes(version)) {
      console.log(`${colors.green("[APPLIED]")} ${name}`);
    } else {
      console.log(`${colors.yellow("[PENDING]")} ${name}`);
    }
  }
}

// Main
async function main(): Promise<void> {
  const [command, target] = process.argv.slice(2);

  try {
    await initMigrationsTable();

    switch (command) {
      case "up":
        await migrateUp();
        break;
      case "down":
        if (!target) {
          console.error("Usage: migrate.ts down <migration_number>");
          console.error("Example: migrate.ts down 010");
          process.exit(1);
        }
        await migrateDown(target);
        break;
      case "status":
        await showStatus();
        break;
      default:
        console.log("Usage: migrate.ts [up|down|status] [migration_number]");
        console.log("");
        console.log("Commands:");
        console.log("  up      Run all pending migrations");
        console.log("  down    Rollback a specific migration (requires version)");
        console.log("  status  Show migration status");
        process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
