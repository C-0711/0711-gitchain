/**
 * Audit Logging System
 *
 * Logs all API requests to access_log table and sensitive operations to audit_log.
 * Provides queryable audit trail for compliance and debugging.
 */

import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { logger } from "./logger.js";

// ============================================
// TYPES
// ============================================

export interface AccessLogEntry {
  id?: string;
  user_id?: string;
  api_key_id?: string;
  method: string;
  path: string;
  query_params?: Record<string, unknown>;
  status_code: number;
  response_time_ms: number;
  ip_address: string;
  user_agent?: string;
  request_id: string;
  created_at?: Date;
}

export interface AuditLogEntry {
  id?: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  created_at?: Date;
}

// Sensitive operations that should be logged to audit log
const SENSITIVE_OPERATIONS: Record<string, { action: string; resourceType: string }> = {
  // Auth
  "POST /auth/login": { action: "user.login", resourceType: "session" },
  "POST /auth/register": { action: "user.register", resourceType: "user" },
  "POST /auth/logout": { action: "user.logout", resourceType: "session" },

  // Containers
  "POST /api/containers": { action: "container.create", resourceType: "container" },
  "PUT /api/containers/:id": { action: "container.update", resourceType: "container" },
  "DELETE /api/containers/:id": { action: "container.delete", resourceType: "container" },
  "POST /api/containers/:id/collaborators": { action: "container.add_collaborator", resourceType: "container" },
  "DELETE /api/containers/:id/collaborators/:userId": { action: "container.remove_collaborator", resourceType: "container" },

  // Organizations
  "POST /api/organizations": { action: "organization.create", resourceType: "organization" },
  "PUT /api/organizations/:slug": { action: "organization.update", resourceType: "organization" },
  "DELETE /api/organizations/:slug": { action: "organization.delete", resourceType: "organization" },
  "POST /api/organizations/:slug/members": { action: "organization.add_member", resourceType: "organization" },
  "DELETE /api/organizations/:slug/members/:userId": { action: "organization.remove_member", resourceType: "organization" },

  // User settings
  "PATCH /api/user": { action: "user.update_profile", resourceType: "user" },
  "POST /api/user/password": { action: "user.change_password", resourceType: "user" },
  "POST /api/user/tokens": { action: "user.create_api_key", resourceType: "api_key" },
  "DELETE /api/user/tokens/:id": { action: "user.revoke_api_key", resourceType: "api_key" },

  // Chain operations
  "POST /api/chain/batch": { action: "chain.create_batch", resourceType: "batch" },
  "POST /api/chain/anchor": { action: "chain.anchor_batch", resourceType: "batch" },
};

// ============================================
// ACCESS LOG MIDDLEWARE
// ============================================

let pool: Pool | null = null;

/**
 * Initialize audit module with database pool.
 */
export function initAudit(dbPool: Pool): void {
  pool = dbPool;
}

/**
 * Middleware to log all API requests to access_log table.
 */
export function accessLogMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!pool) {
      next();
      return;
    }

    const start = Date.now();
    const requestId = (req as any).requestId || "-";

    // Capture response finish
    res.on("finish", async () => {
      const duration = Date.now() - start;
      const user = (req as any).user;
      const apiKey = (req as any).apiKey;

      try {
        await pool!.query(
          `INSERT INTO access_log (
            user_id, api_key_id, method, path, query_params,
            status_code, response_time_ms, ip_address, user_agent, request_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            user?.id || null,
            apiKey?.id || null,
            req.method,
            req.path,
            Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : null,
            res.statusCode,
            duration,
            req.ip || req.socket.remoteAddress || "unknown",
            req.get("user-agent") || null,
            requestId,
          ]
        );
      } catch (err) {
        // Don't fail the request if logging fails
        logger.error("Failed to write access log", { error: (err as Error).message });
      }
    });

    next();
  };
}

// ============================================
// AUDIT LOG FUNCTION
// ============================================

/**
 * Log a sensitive operation to the audit log.
 */
export async function logAuditEvent(entry: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}): Promise<void> {
  if (!pool) {
    logger.warn("Audit log not initialized, skipping audit event", { action: entry.action });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO audit_log (
        user_id, action, resource_type, resource_id,
        old_value, new_value, ip_address, user_agent, request_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.userId || null,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        entry.newValue ? JSON.stringify(entry.newValue) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.requestId || null,
      ]
    );

    logger.info("Audit event logged", {
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      userId: entry.userId,
    });
  } catch (err) {
    logger.error("Failed to write audit log", { error: (err as Error).message, action: entry.action });
  }
}

// ============================================
// AUDIT LOG QUERIES
// ============================================

export interface AuditLogQuery {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Query audit log entries.
 */
export async function queryAuditLog(query: AuditLogQuery): Promise<{
  entries: AuditLogEntry[];
  total: number;
}> {
  if (!pool) {
    return { entries: [], total: 0 };
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (query.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(query.userId);
  }

  if (query.action) {
    conditions.push(`action = $${paramIndex++}`);
    params.push(query.action);
  }

  if (query.resourceType) {
    conditions.push(`resource_type = $${paramIndex++}`);
    params.push(query.resourceType);
  }

  if (query.resourceId) {
    conditions.push(`resource_id = $${paramIndex++}`);
    params.push(query.resourceId);
  }

  if (query.from) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(query.from);
  }

  if (query.to) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(query.to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(query.limit || 50, 100);
  const offset = query.offset || 0;

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM audit_log ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get entries
  const result = await pool.query(
    `SELECT * FROM audit_log ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  return {
    entries: result.rows,
    total,
  };
}

/**
 * Query access log entries.
 */
export async function queryAccessLog(query: {
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  entries: AccessLogEntry[];
  total: number;
}> {
  if (!pool) {
    return { entries: [], total: 0 };
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (query.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(query.userId);
  }

  if (query.method) {
    conditions.push(`method = $${paramIndex++}`);
    params.push(query.method);
  }

  if (query.path) {
    conditions.push(`path LIKE $${paramIndex++}`);
    params.push(`%${query.path}%`);
  }

  if (query.statusCode) {
    conditions.push(`status_code = $${paramIndex++}`);
    params.push(query.statusCode);
  }

  if (query.from) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(query.from);
  }

  if (query.to) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(query.to);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(query.limit || 50, 100);
  const offset = query.offset || 0;

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM access_log ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get entries
  const result = await pool.query(
    `SELECT * FROM access_log ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  return {
    entries: result.rows,
    total,
  };
}
