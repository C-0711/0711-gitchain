/**
 * PostgreSQL Database Connector
 * 
 * Production database connector for GitChain.
 */

import { Pool, PoolClient } from "pg";
import type {
  DatabaseConnector,
  DatabaseConfig,
  ExecuteResult,
  Transaction,
  HealthCheckResult,
} from "../types.js";

interface PostgreSQLConfig extends DatabaseConfig {
  type: "postgresql";
  url: string;
  pool?: {
    min?: number;
    max?: number;
  };
}

class PostgreSQLTransaction implements Transaction {
  constructor(private client: PoolClient) {}

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.client.query(sql, params);
    return result.rows as T[];
  }

  async execute(sql: string, params?: unknown[]): Promise<ExecuteResult> {
    const result = await this.client.query(sql, params);
    return {
      rowCount: result.rowCount || 0,
    };
  }

  async commit(): Promise<void> {
    await this.client.query("COMMIT");
  }

  async rollback(): Promise<void> {
    await this.client.query("ROLLBACK");
  }
}

export class PostgreSQLConnector implements DatabaseConnector {
  readonly name = "PostgreSQL";
  readonly type = "postgresql";

  private pool!: Pool;
  private config!: PostgreSQLConfig;

  async init(config: DatabaseConfig): Promise<void> {
    this.config = config as PostgreSQLConfig;

    this.pool = new Pool({
      connectionString: this.config.url,
      min: this.config.pool?.min || 5,
      max: this.config.pool?.max || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const client = await this.pool.connect();
    client.release();
  }

  async migrate(): Promise<void> {
    // Migrations handled by schema.sql for now
    // Could add migration tracking table later
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();
      return {
        healthy: true,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  async execute(sql: string, params?: unknown[]): Promise<ExecuteResult> {
    const result = await this.pool.query(sql, params);
    return {
      rowCount: result.rowCount || 0,
    };
  }

  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const tx = new PostgreSQLTransaction(client);
      const result = await fn(tx);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // ===========================================
  // HELPER METHODS FOR GITCHAIN
  // ===========================================

  /**
   * Get single row or null
   */
  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] || null;
  }

  /**
   * Insert and return the inserted row
   */
  async insert<T>(
    table: string,
    data: Record<string, unknown>
  ): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const columns = keys.join(", ");

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const rows = await this.query<T>(sql, values);
    return rows[0];
  }

  /**
   * Update rows matching condition
   */
  async update(
    table: string,
    data: Record<string, unknown>,
    where: string,
    whereParams: unknown[]
  ): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys
      .map((key, i) => `${key} = $${i + 1}`)
      .join(", ");

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const allParams = [...values, ...whereParams];
    
    // Adjust parameter numbers in where clause
    const adjustedSql = sql.replace(
      /\$(\d+)/g,
      (_, num) => {
        const n = parseInt(num);
        return n <= keys.length ? `$${n}` : `$${n}`;
      }
    );

    const result = await this.execute(adjustedSql, allParams);
    return result.rowCount;
  }

  /**
   * Soft delete (set deleted_at)
   */
  async softDelete(table: string, where: string, params: unknown[]): Promise<number> {
    const sql = `UPDATE ${table} SET deleted_at = NOW() WHERE ${where} AND deleted_at IS NULL`;
    const result = await this.execute(sql, params);
    return result.rowCount;
  }
}

/**
 * Factory function
 */
export async function createPostgreSQLConnector(
  config: DatabaseConfig
): Promise<DatabaseConnector> {
  const connector = new PostgreSQLConnector();
  await connector.init(config);
  return connector;
}
