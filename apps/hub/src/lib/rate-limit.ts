/**
 * GitChain Hub - Rate Limiting
 *
 * Simple in-memory rate limiter for Next.js API routes.
 * For production, consider using Redis-based rate limiting.
 */

import { NextResponse } from "next/server";

// ===========================================
// CONFIGURATION
// ===========================================

export interface RateLimitConfig {
  // Maximum requests allowed in the window
  limit: number;
  // Time window in milliseconds
  windowMs: number;
}

// Default rate limits by route type
export const RATE_LIMITS = {
  // Auth endpoints - strict to prevent brute force
  auth: { limit: 5, windowMs: 60 * 1000 }, // 5 per minute

  // API key creation - prevent abuse
  apiKeys: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour

  // Container creation
  containers: { limit: 30, windowMs: 60 * 1000 }, // 30 per minute

  // Search
  search: { limit: 60, windowMs: 60 * 1000 }, // 60 per minute

  // Default for other endpoints
  default: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
} as const;

// ===========================================
// IN-MEMORY STORE
// ===========================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store: key -> entry
// In production, use Redis instead
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime < now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Don't prevent process exit
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

startCleanup();

// ===========================================
// RATE LIMITER
// ===========================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given key (usually IP or user ID).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.default
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // No existing entry or window expired
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs;
    store.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: resetTime,
    };
  }

  // Within window - check if over limit
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get rate limit headers for a response.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.reset / 1000).toString(),
  };
}

/**
 * Create a rate-limited response (429 Too Many Requests).
 */
export function rateLimitExceeded(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: "Too many requests",
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter,
    },
    {
      status: 429,
      headers: {
        ...getRateLimitHeaders(result),
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get client IP from request headers.
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback
  return "unknown";
}

/**
 * Create a rate limit key combining IP and optional user ID.
 */
export function createRateLimitKey(
  prefix: string,
  ip: string,
  userId?: string | null
): string {
  if (userId) {
    return `${prefix}:user:${userId}`;
  }
  return `${prefix}:ip:${ip}`;
}

// ===========================================
// MIDDLEWARE HELPER
// ===========================================

/**
 * Apply rate limiting to an API route handler.
 *
 * Usage:
 * ```ts
 * export async function POST(request: Request) {
 *   const rateLimitResult = applyRateLimit(request, RATE_LIMITS.auth);
 *   if (rateLimitResult) return rateLimitResult;
 *
 *   // ... rest of handler
 * }
 * ```
 */
export function applyRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.default,
  userId?: string | null
): NextResponse | null {
  const ip = getClientIp(request);
  const key = createRateLimitKey("api", ip, userId);
  const result = checkRateLimit(key, config);

  if (!result.success) {
    return rateLimitExceeded(result);
  }

  return null;
}
