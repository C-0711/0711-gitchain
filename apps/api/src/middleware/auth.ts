/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    namespace?: string;
    apiKeyId?: string;
  };
}

let dbPool: Pool | null = null;

export function initAuthMiddleware(pool: Pool) {
  dbPool = pool;
}

/**
 * Require authentication
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

/**
 * Require namespace ownership — checks database
 */
export function requireNamespace(namespace: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!dbPool) return next();

    try {
      const result = await dbPool.query(
        `SELECT 1 FROM namespace_members WHERE namespace_id = (
          SELECT id FROM namespaces WHERE name = $1 AND deleted_at IS NULL
        ) AND user_id = $2`,
        [namespace, req.user.id]
      );

      if (result.rows.length === 0) {
        const adminCheck = await dbPool.query("SELECT is_admin FROM users WHERE id = $1", [
          req.user.id,
        ]);
        if (!adminCheck.rows[0]?.is_admin) {
          return res.status(403).json({ error: "You don't have access to this namespace" });
        }
      }

      next();
    } catch {
      next();
    }
  };
}

/**
 * Rate limiting by IP or API key
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, limit] of rateLimits) {
      if (limit.resetAt < now) rateLimits.delete(key);
    }
  },
  5 * 60 * 1000
).unref();

export function rateLimit(requestsPerMinute = 60) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const key = req.user?.apiKeyId || req.ip || "anonymous";
    const now = Date.now();

    let limit = rateLimits.get(key);
    if (!limit || limit.resetAt < now) {
      limit = { count: 0, resetAt: now + 60000 };
      rateLimits.set(key, limit);
    }

    limit.count++;

    if (limit.count > requestsPerMinute) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((limit.resetAt - now) / 1000),
      });
    }

    res.setHeader("X-RateLimit-Limit", requestsPerMinute);
    res.setHeader("X-RateLimit-Remaining", requestsPerMinute - limit.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(limit.resetAt / 1000));

    next();
  };
}
