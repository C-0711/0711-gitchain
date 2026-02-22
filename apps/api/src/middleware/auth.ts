/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    namespace: string;
    apiKeyId?: string;
  };
}

/**
 * API Key authentication middleware
 */
export function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    // Allow unauthenticated access for public endpoints
    return next();
  }

  const apiKey = authHeader.slice(7);

  // TODO: Validate API key against database
  // For now, accept any key for development
  if (apiKey.startsWith("gc_")) {
    req.user = {
      id: "dev-user",
      email: "dev@gitchain.0711.io",
      namespace: "dev",
      apiKeyId: apiKey.slice(0, 10),
    };
  }

  next();
}

/**
 * Require authentication
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

/**
 * Require namespace ownership
 */
export function requireNamespace(namespace: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // TODO: Check namespace ownership in database
    // For now, allow all authenticated users
    next();
  };
}

/**
 * Rate limiting by API key
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>();

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
