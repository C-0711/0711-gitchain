/**
 * Database connection pool for GitChain Hub
 *
 * SECURITY: Database credentials must be provided via environment variables.
 * No fallback values are allowed in production.
 */

import { Pool, PoolClient } from "pg";
import { getUserIdFromAuthHeader } from "./auth";

// ===========================================
// ENVIRONMENT VALIDATION
// ===========================================

function getRequiredDbConfig() {
  const isProduction = process.env.NODE_ENV === "production";

  // In production, all DB config must be explicitly set
  if (isProduction) {
    if (!process.env.DB_PASSWORD && !process.env.DATABASE_URL) {
      throw new Error(
        "SECURITY ERROR: DB_PASSWORD or DATABASE_URL must be set in production. " +
          "Never use fallback database credentials."
      );
    }
  }

  // Use DATABASE_URL if provided (takes precedence)
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  // Otherwise use individual config vars
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5440"),
    database: process.env.DB_NAME || "gitchain",
    user: process.env.DB_USER || "gitchain",
    password: process.env.DB_PASSWORD || (isProduction ? undefined : "gitchain2026"),
  };
}

export const pool = new Pool({
  ...getRequiredDbConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper to get user ID from JWT token - uses proper JWT verification
export function getUserIdFromToken(authHeader: string | null): string | null {
  return getUserIdFromAuthHeader(authHeader);
}

// Helper to check org membership
export async function checkOrgMembership(
  userId: string,
  orgId: string,
  minRole: string = "member"
): Promise<boolean> {
  const result = await pool.query(
    "SELECT user_has_org_role($1, $2, $3) as has_role",
    [userId, orgId, minRole]
  );
  return result.rows[0]?.has_role || false;
}

// Helper for transactions
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Role hierarchy levels
export const ROLE_LEVELS: Record<string, number> = {
  owner: 5,
  admin: 4,
  maintainer: 3,
  member: 2,
  viewer: 1,
};

export const CONTAINER_ROLE_LEVELS: Record<string, number> = {
  maintainer: 4,
  editor: 3,
  reviewer: 2,
  viewer: 1,
};

export function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[minRole] || 0);
}

export function hasMinContainerRole(
  userRole: string,
  minRole: string
): boolean {
  return (
    (CONTAINER_ROLE_LEVELS[userRole] || 0) >=
    (CONTAINER_ROLE_LEVELS[minRole] || 0)
  );
}

// Audit logging helper
export async function logAuditEvent(
  orgId: string,
  actorId: string | null,
  action: string,
  targetType: string | null,
  targetId: string | null,
  oldValue: unknown | null,
  newValue: unknown | null,
  metadata: Record<string, unknown> = {},
  ip?: string,
  userAgent?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO organization_audit_log
     (org_id, actor_id, action, target_type, target_id, old_value, new_value, metadata, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      orgId,
      actorId,
      action,
      targetType,
      targetId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      JSON.stringify(metadata),
      ip || null,
      userAgent || null,
    ]
  );
}

export default pool;
