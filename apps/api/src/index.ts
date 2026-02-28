/**
 * GitChain API Server — Production Ready
 *
 * Real database, real auth, real storage.
 * API Version: 1.0
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { Pool } from "pg";
import crypto from "crypto";

// Services
import { AuthService, verifyToken, isValidApiKeyFormat, hashApiKey } from "./services/auth.js";
import { ContainerService } from "./services/containers.js";
import { OrganizationService } from "./services/organizations.js";

// Routes
import { createAuthRouter } from "./routes/auth.js";
import { createContainersRouter } from "./routes/containers.js";
import { createOrganizationsRouter } from "./routes/organizations.js";
import { createChainRouter } from "./routes/chain.js";
import { createAdminRouter } from "./routes/admin.js";

// Audit logging
import { initAudit, accessLogMiddleware } from "./lib/audit.js";

// API Versioning
import { versionMiddleware, getSupportedVersions, getCurrentVersion } from "./lib/versioning.js";

// Response utilities
import {
  sendSuccess,
  sendPaginated,
  sendBadRequest,
  sendNotFound,
  sendServiceUnavailable,
  asyncHandler,
  errorHandler,
} from "./lib/response.js";

// Structured logging
import { logger, requestLogger, logError, logAudit } from "./lib/logger.js";

// API Version
const API_VERSION = "1.0";

// ===========================================
// CONFIG
// ===========================================

const PORT = process.env.PORT || 3100;
const isProduction = process.env.NODE_ENV === "production";

// Database URL - required in production
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url && isProduction) {
    throw new Error("DATABASE_URL environment variable is required in production");
  }
  return url || "postgresql://gitchain:gitchain2026@localhost:5440/gitchain";
}

const DATABASE_URL = getDatabaseUrl();

// Track server start time for uptime reporting
const serverStartTime = Date.now();

// ===========================================
// DATABASE
// ===========================================

const pool = new Pool({
  connectionString: DATABASE_URL,
  min: 5,
  max: 20,
});

// Simple database connector
const db = {
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  },

  async insert<T>(table: string, data: Record<string, unknown>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const columns = keys.join(", ");
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(sql, values);
    return result.rows[0];
  },

  async execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }> {
    const result = await pool.query(sql, params);
    return { rowCount: result.rowCount || 0 };
  },

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn({
        query: async <T>(sql: string, params?: unknown[]) => {
          const r = await client.query(sql, params);
          return r.rows as T[];
        },
        queryOne: async <T>(sql: string, params?: unknown[]) => {
          const r = await client.query(sql, params);
          return r.rows[0] || null;
        },
        insert: async <T>(table: string, data: Record<string, unknown>) => {
          const keys = Object.keys(data);
          const values = Object.values(data);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
          const columns = keys.join(", ");
          const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
          const r = await client.query(sql, values);
          return r.rows[0] as T;
        },
        execute: async (sql: string, params?: unknown[]) => {
          const r = await client.query(sql, params);
          return { rowCount: r.rowCount || 0 };
        },
      });
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

// ===========================================
// SERVICES
// ===========================================

const authService = new AuthService(db);
const containerService = new ContainerService(db);
const organizationService = new OrganizationService(db);

// ===========================================
// APP
// ===========================================

const app = express();

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10mb" }));

// Request ID and API version headers
app.use((req, res, next) => {
  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID();
  (req as any).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Api-Version", API_VERSION);
  next();
});

// Structured request logging
app.use(requestLogger());

// Access log to database (after auth middleware for user context)
app.use(accessLogMiddleware());

// ===========================================
// AUTH MIDDLEWARE
// ===========================================

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  // Bearer token (JWT)
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    // Check if it's an API key
    if (isValidApiKeyFormat(token)) {
      const result = await authService.validateApiKey(token);
      if (result) {
        (req as any).user = result.user;
        (req as any).apiKey = result.apiKey;
      }
    } else {
      // JWT token
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await authService.getUserById(decoded.userId);
        if (user) {
          (req as any).user = user;
        }
      }
    }
  }

  next();
}

app.use(authMiddleware);

// ===========================================
// ROUTES
// ===========================================

// Root - API info
app.get("/", (req, res) => {
  sendSuccess(res, {
    name: "GitChain API",
    version: API_VERSION,
    currentVersion: getCurrentVersion(),
    supportedVersions: getSupportedVersions(),
    status: "running",
    docs: "https://gitchain.0711.io/docs",
    endpoints: {
      v1: "/v1",
      health: "/health",
      ready: "/ready",
    },
  });
});

// API versions endpoint
app.get("/versions", (req, res) => {
  sendSuccess(res, {
    current: getCurrentVersion(),
    supported: getSupportedVersions(),
    latest: getCurrentVersion(),
  });
});

// Health check - basic liveness probe
app.get("/health", asyncHandler(async (req, res) => {
  try {
    await pool.query("SELECT 1");
    sendSuccess(res, {
      status: "ok",
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    sendServiceUnavailable(res, "Database connection failed");
  }
}));

// Readiness check - full dependency check
app.get("/ready", asyncHandler(async (req, res) => {
  const checks: Record<string, "ok" | "error"> = {};
  let allReady = true;

  // Check database
  try {
    await pool.query("SELECT 1");
    checks.database = "ok";
  } catch (err) {
    checks.database = "error";
    allReady = false;
  }

  // Check pool status
  const poolStats = {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };

  if (allReady) {
    sendSuccess(res, {
      status: "ready",
      checks,
      pool: poolStats,
    });
  } else {
    sendServiceUnavailable(res, "Not all dependencies are ready");
  }
}));

// ===========================================
// VERSIONED API ROUTES (v1)
// ===========================================

// Apply version middleware to all v1 routes
app.use("/v1", versionMiddleware("v1"));

// Auth routes (v1)
app.use("/v1/auth", createAuthRouter(authService));

// Container routes (v1)
app.use("/v1/containers", createContainersRouter(containerService));

// Organization routes (v1)
app.use("/v1/organizations", createOrganizationsRouter(organizationService));

// Chain routes (v1)
app.use("/v1/chain", createChainRouter());

// Admin routes (v1)
app.use("/v1/admin", createAdminRouter());

// ===========================================
// LEGACY ROUTES (without version prefix)
// ===========================================
// These are kept for backwards compatibility and will be deprecated

// Auth routes (legacy)
app.use("/auth", createAuthRouter(authService));

// Container routes (legacy - forwards to v1 behavior)
app.use("/api/containers", createContainersRouter(containerService));

// Organization routes (legacy)
app.use("/api/organizations", createOrganizationsRouter(organizationService));

// Chain routes (legacy)
app.use("/api/chain", createChainRouter());

// Admin routes (legacy)
app.use("/api/admin", createAdminRouter());

// Inject endpoint
app.post("/api/inject", asyncHandler(async (req: Request, res: Response) => {
  const { containers: containerIds, verify = true, format = "markdown" } = req.body;

  if (!containerIds || !Array.isArray(containerIds)) {
    return sendBadRequest(res, "containers array is required");
  }

  const containers = [];
  for (const id of containerIds) {
    const container = await containerService.getByContainerId(id);
    if (container) {
      containers.push(container);
      await containerService.incrementStat(container.id, "inject_count");
    }
  }

  // Format output
  let formatted = "";
  if (format === "markdown") {
    for (const c of containers) {
      formatted += `# ${c.data.name || c.identifier}\n\n`;
      formatted += `**Container ID:** \`${c.container_id}\`\n`;
      formatted += `**Type:** ${c.type}\n`;
      formatted += `**Namespace:** ${c.namespace}\n\n`;

      if (c.data.description) {
        formatted += `## Description\n${c.data.description}\n\n`;
      }

      if (c.data.specs || c.data.specifications) {
        formatted += `## Specifications\n`;
        const specs = c.data.specs || c.data.specifications;
        for (const [key, value] of Object.entries(specs as Record<string, unknown>)) {
          formatted += `- **${key}:** ${value}\n`;
        }
        formatted += "\n";
      }

      formatted += `---\n\n`;
    }
  } else if (format === "json") {
    formatted = JSON.stringify(containers.map((c) => c.data), null, 2);
  }

  sendSuccess(res, {
    containers: containers.map((c) => ({
      id: c.container_id,
      type: c.type,
      data: c.data,
      verified: c.is_verified,
    })),
    formatted,
    containerCount: containers.length,
  });
}));

// Search endpoint
app.get("/api/search", asyncHandler(async (req: Request, res: Response) => {
  const { q, type, namespace, limit = "20", page = "1" } = req.query;

  if (!q) {
    return sendBadRequest(res, "Search query (q) is required");
  }

  const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
  const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);

  const result = await containerService.search(q as string, {
    type: type as string | undefined,
    namespace: namespace as string | undefined,
    limit: limitNum,
  });

  sendPaginated(res, result.containers, {
    total: result.total,
    page: pageNum,
    limit: limitNum,
  });
}));

// Namespaces
app.get("/api/namespaces", asyncHandler(async (req: Request, res: Response) => {
  const namespaces = await db.query(
    "SELECT * FROM namespaces WHERE deleted_at IS NULL ORDER BY name"
  );
  sendSuccess(res, namespaces);
}));

app.get("/api/namespaces/:name", asyncHandler(async (req: Request, res: Response) => {
  const namespace = await db.queryOne(
    "SELECT * FROM namespaces WHERE name = $1 AND deleted_at IS NULL",
    [req.params.name]
  );

  if (!namespace) {
    return sendNotFound(res, "Namespace");
  }

  sendSuccess(res, namespace);
}));

// ===========================================
// ERROR HANDLING
// ===========================================

// Use standardized error handler
app.use(errorHandler);

// ===========================================
// START
// ===========================================

async function start() {
  try {
    // Test database connection
    await pool.query("SELECT 1");
    logger.info("Database connected");

    // Initialize audit logging
    initAudit(pool);
    logger.info("Audit logging initialized");

    app.listen(PORT, () => {
      logger.info("GitChain API started", {
        port: PORT,
        version: API_VERSION,
        environment: process.env.NODE_ENV || "development",
        docs: "https://gitchain.0711.io/docs",
      });
    });
  } catch (err) {
    logError(err as Error, { context: "startup" });
    process.exit(1);
  }
}

start();
