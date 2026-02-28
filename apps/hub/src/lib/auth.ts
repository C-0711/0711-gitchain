/**
 * GitChain Hub - Authentication Utilities
 *
 * SECURITY: This module handles JWT verification and auth configuration.
 * All secrets are required - no fallback values allowed.
 */

import jwt from "jsonwebtoken";

// ===========================================
// ENVIRONMENT VALIDATION
// ===========================================

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `SECURITY ERROR: Required environment variable ${name} is not set. ` +
        `Never use fallback values for secrets in production.`
    );
  }
  return value;
}

// Validate on module load in production
const isProduction = process.env.NODE_ENV === "production";

// JWT_SECRET is always required
export function getJwtSecret(): string {
  // In development, allow a development-only secret if not set
  if (!isProduction && !process.env.JWT_SECRET) {
    console.warn(
      "WARNING: JWT_SECRET not set. Using development-only secret. " +
        "This MUST be set in production."
    );
    return "gitchain-dev-only-not-for-production";
  }
  return getRequiredEnv("JWT_SECRET");
}

// ===========================================
// JWT TOKEN VERIFICATION
// ===========================================

export interface JwtPayload {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify a JWT token and return the payload.
 * Uses proper cryptographic verification - NOT base64 decode.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    // Handle both 'sub' and 'userId' claim formats
    const userId = decoded.sub || decoded.userId;
    if (!userId || typeof userId !== "string") {
      return null;
    }

    return {
      userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error) {
    // Token invalid, expired, or signature mismatch
    return null;
  }
}

/**
 * Generate a new JWT token for a user.
 */
export function generateToken(
  userId: string,
  email?: string
): { token: string; expiresAt: Date } {
  const secret = getJwtSecret();
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

  const token = jwt.sign({ userId, email }, secret, { expiresIn });

  // Calculate expiry date
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  return { token, expiresAt };
}

/**
 * Extract user ID from Authorization header.
 * Uses proper JWT verification.
 */
export function getUserIdFromAuthHeader(
  authHeader: string | null
): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  return payload?.userId || null;
}

/**
 * Check if a token is expired.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}
