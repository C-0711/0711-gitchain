/**
 * GitChain API Server — Production Ready
 * 
 * Real database, real auth, real storage.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { Pool } from "pg";

// Services
import { AuthService, verifyToken, isValidApiKeyFormat, hashApiKey } from "./services/auth";
import { ContainerService } from "./services/containers";

// Routes
import { createAuthRouter } from "./routes/auth";
import { createContainersRouter } from "./routes/containers";

// ===========================================
// CONFIG
// ===========================================

const PORT = process.env.PORT || 3100;
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://gitchain:gitchain2026@localhost:5440/gitchain";

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

// ===========================================
// APP
// ===========================================

const app = express();

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

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

// Health
app.get("/", (req, res) => {
  res.json({
    name: "GitChain API",
    version: "1.0.0",
    status: "running",
    docs: "https://gitchain.0711.io/docs",
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "unhealthy", database: "disconnected" });
  }
});

// Auth routes
app.use("/auth", createAuthRouter(authService));

// Container routes
app.use("/api/containers", createContainersRouter(containerService));

// Inject endpoint
app.post("/api/inject", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { containers: containerIds, verify = true, format = "markdown" } = req.body;

    if (!containerIds || !Array.isArray(containerIds)) {
      return res.status(400).json({ error: "containers array is required" });
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
      formatted = JSON.stringify(containers.map(c => c.data), null, 2);
    }

    res.json({
      success: true,
      containers: containers.map(c => ({
        id: c.container_id,
        type: c.type,
        data: c.data,
        verified: c.is_verified,
      })),
      formatted,
      containerCount: containers.length,
    });
  } catch (err) {
    next(err);
  }
});

// Search endpoint
app.get("/api/search", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type, namespace, limit = "20" } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query (q) is required" });
    }

    const result = await containerService.search(q as string, {
      type: type as string | undefined,
      namespace: namespace as string | undefined,
      limit: parseInt(limit as string, 10),
    });

    res.json({
      query: q,
      results: result.containers,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
});

// Namespaces
app.get("/api/namespaces", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const namespaces = await db.query(
      "SELECT * FROM namespaces WHERE deleted_at IS NULL ORDER BY name"
    );
    res.json({ namespaces });
  } catch (err) {
    next(err);
  }
});

app.get("/api/namespaces/:name", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const namespace = await db.queryOne(
      "SELECT * FROM namespaces WHERE name = $1 AND deleted_at IS NULL",
      [req.params.name]
    );

    if (!namespace) {
      return res.status(404).json({ error: "Namespace not found" });
    }

    res.json({ namespace });
  } catch (err) {
    next(err);
  }
});

// ===========================================
// ERROR HANDLING
// ===========================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ===========================================
// START
// ===========================================

async function start() {
  try {
    // Test database connection
    await pool.query("SELECT 1");
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 GitChain API running on port ${PORT}`);
      console.log(`📚 Docs: https://gitchain.0711.io/docs`);
    });
  } catch (err) {
    console.error("❌ Failed to start:", err);
    process.exit(1);
  }
}

start();
