/**
 * API Versioning
 *
 * Provides versioned API routing and deprecation notices.
 * Version format: /v{major}/
 *
 * Versioning Policy:
 * - Major version changes for breaking changes
 * - Deprecation notice 6 months before removal
 * - Minimum 12 months support for major versions
 */

import { Router, Request, Response, NextFunction } from "express";
import { logger } from "./logger";

// ============================================
// CONFIGURATION
// ============================================

export interface ApiVersionConfig {
  version: string;
  status: "current" | "supported" | "deprecated" | "sunset";
  deprecatedAt?: Date;
  sunsetAt?: Date;
}

// Registered API versions
const API_VERSIONS: Record<string, ApiVersionConfig> = {
  v1: {
    version: "1",
    status: "current",
  },
  // Future versions can be added here:
  // v2: {
  //   version: "2",
  //   status: "current",
  // },
};

// Current default version
const DEFAULT_VERSION = "v1";

// ============================================
// VERSION MIDDLEWARE
// ============================================

/**
 * Middleware that adds version info to response headers.
 */
export function versionMiddleware(version: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const config = API_VERSIONS[version];

    if (!config) {
      res.status(400).json({
        error: {
          code: "INVALID_API_VERSION",
          message: `API version '${version}' is not supported`,
          supportedVersions: Object.keys(API_VERSIONS),
        },
      });
      return;
    }

    // Add version headers
    res.setHeader("X-Api-Version", config.version);

    // Add deprecation warning if deprecated
    if (config.status === "deprecated" && config.sunsetAt) {
      res.setHeader("Deprecation", config.deprecatedAt?.toISOString() || "true");
      res.setHeader("Sunset", config.sunsetAt.toISOString());
      res.setHeader(
        "X-Api-Warn",
        `API version ${version} is deprecated and will be removed on ${config.sunsetAt.toISOString()}`
      );

      logger.warn("Deprecated API version used", {
        version,
        path: req.path,
        sunsetAt: config.sunsetAt.toISOString(),
      });
    }

    // Reject sunset versions
    if (config.status === "sunset") {
      res.status(410).json({
        error: {
          code: "API_VERSION_SUNSET",
          message: `API version '${version}' has been retired`,
          currentVersion: DEFAULT_VERSION,
          migrationGuide: "https://gitchain.0711.io/docs/api/migration",
        },
      });
      return;
    }

    next();
  };
}

/**
 * Create a versioned router.
 * All routes registered on this router will be prefixed with /v{version}/
 */
export function createVersionedRouter(version: string): Router {
  const router = Router();

  // Apply version middleware
  router.use(versionMiddleware(version));

  return router;
}

// ============================================
// VERSION NEGOTIATION
// ============================================

/**
 * Parse Accept-Version header or URL path to determine API version.
 */
export function negotiateVersion(req: Request): string {
  // Check URL path first (e.g., /v1/containers)
  const pathMatch = req.path.match(/^\/v(\d+)\//);
  if (pathMatch) {
    return `v${pathMatch[1]}`;
  }

  // Check Accept-Version header
  const acceptVersion = req.get("Accept-Version");
  if (acceptVersion) {
    const normalized = acceptVersion.startsWith("v")
      ? acceptVersion
      : `v${acceptVersion}`;
    if (API_VERSIONS[normalized]) {
      return normalized;
    }
  }

  // Check custom header
  const apiVersion = req.get("X-Api-Version");
  if (apiVersion) {
    const normalized = apiVersion.startsWith("v") ? apiVersion : `v${apiVersion}`;
    if (API_VERSIONS[normalized]) {
      return normalized;
    }
  }

  // Default to current version
  return DEFAULT_VERSION;
}

// ============================================
// EXPORTS
// ============================================

export { API_VERSIONS, DEFAULT_VERSION };

/**
 * Get all supported API versions.
 */
export function getSupportedVersions(): string[] {
  return Object.entries(API_VERSIONS)
    .filter(([_, config]) => config.status !== "sunset")
    .map(([version]) => version);
}

/**
 * Get current API version.
 */
export function getCurrentVersion(): string {
  const current = Object.entries(API_VERSIONS).find(
    ([_, config]) => config.status === "current"
  );
  return current ? current[0] : DEFAULT_VERSION;
}
