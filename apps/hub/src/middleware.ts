/**
 * GitChain Hub - Next.js Middleware
 *
 * Handles:
 * - Security headers (CSP, HSTS, etc.)
 * - Authentication protection for private routes
 * - Rate limiting headers
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ===========================================
// CONFIGURATION
// ===========================================

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/pricing",
  "/docs",
  "/api-reference",
  "/verify",
  "/explore",
  "/trending",
  "/terms",
  "/privacy",
  "/containers",
  "/users",
  "/inject",
  "/invite",
];

// API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/health",
  "/api/containers", // Public container listing
  "/api/explore",
  "/api/trending",
  "/api/invites",
];

// ===========================================
// SECURITY HEADERS
// ===========================================

function getSecurityHeaders(): Record<string, string> {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    // Content Security Policy
    "Content-Security-Policy": [
      "default-src 'self'",
      isProduction
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://mainnet.base.org https://sepolia.base.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // XSS Protection (legacy, but still useful)
    "X-XSS-Protection": "1; mode=block",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy (disable sensitive APIs)
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
    ].join(", "),

    // HSTS (only in production with HTTPS)
    ...(isProduction
      ? {
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        }
      : {}),

    // Hide server info
    "X-Powered-By": "", // Will be removed
  };
}

// ===========================================
// ROUTE MATCHING
// ===========================================

function isPublicRoute(pathname: string): boolean {
  // Check exact matches and prefixes
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isPublicApiRoute(pathname: string): boolean {
  // Check exact matches and prefixes for API routes
  return PUBLIC_API_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") || pathname.startsWith("/static/") || pathname.includes(".") // Files with extensions
  );
}

// ===========================================
// MIDDLEWARE
// ===========================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Create response
  const response = NextResponse.next();

  // Add security headers to all responses
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    if (key === "X-Powered-By") {
      response.headers.delete(key);
    } else if (value) {
      response.headers.set(key, value);
    }
  }

  // Add request ID for tracing
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  response.headers.set("X-Request-Id", requestId);

  // Check authentication for protected routes
  if (pathname.startsWith("/api/")) {
    // API routes: check for auth token
    if (!isPublicApiRoute(pathname)) {
      const authHeader = request.headers.get("authorization");
      const hasAuth = authHeader?.startsWith("Bearer ") || request.cookies.has("gitchain_session");

      if (!hasAuth) {
        return NextResponse.json(
          { error: "Authentication required" },
          {
            status: 401,
            headers: Object.fromEntries(response.headers.entries()),
          }
        );
      }
    }
  } else {
    // Page routes: redirect to login if not authenticated
    if (!isPublicRoute(pathname)) {
      const hasSession = request.cookies.has("gitchain_session");
      const hasToken = request.cookies.has("token");

      // Allow if there's any form of authentication
      // The actual token validation happens in API routes
      if (!hasSession && !hasToken) {
        // Check localStorage token via client-side redirect would be needed
        // For now, allow access and let client-side handle auth
      }
    }
  }

  return response;
}

// ===========================================
// MATCHER CONFIG
// ===========================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
