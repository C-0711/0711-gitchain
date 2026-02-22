/**
 * GitChain API Server
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createSchema, createYoga } from "graphql-yoga";
import { inject } from "@0711/inject";

// Middleware
import { apiKeyAuth, rateLimit } from "./middleware/auth";

// Routes
import containersRouter from "./routes/containers";
import verifyRouter from "./routes/verify";
import namespacesRouter from "./routes/namespaces";
import batchRouter from "./routes/batch";
import searchRouter from "./routes/search";
import authRouter from "./routes/auth";
import webhooksRouter from "./routes/webhooks";

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(apiKeyAuth);
app.use(rateLimit(60));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "gitchain-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// REST Routes
app.use("/api/auth", authRouter);
app.use("/api/containers", containersRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/namespaces", namespacesRouter);
app.use("/api/batch", batchRouter);
app.use("/api/search", searchRouter);
app.use("/api/webhooks", webhooksRouter);

// Inject endpoint
app.post("/api/inject", async (req, res) => {
  try {
    const { containers, verify, format, includeCitations } = req.body;
    if (!containers || !Array.isArray(containers)) {
      return res.status(400).json({ error: "containers array required" });
    }
    const context = await inject({
      containers,
      verify: verify !== false,
      format: format || "markdown",
      includeCitations: includeCitations !== false,
    });
    res.json({ success: true, ...context });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GraphQL
const schema = createSchema({
  typeDefs: `
    type Query {
      health: Health!
      container(id: ID!): Container
      containers(type: String, namespace: String, limit: Int): [Container!]!
      inject(containers: [ID!]!, verify: Boolean, format: String): InjectResult!
    }

    type Health { status: String!, version: String! }
    
    type Container {
      id: ID!
      type: String!
      namespace: String!
      identifier: String!
      version: Int!
      meta: ContainerMeta!
      data: JSON
    }

    type ContainerMeta {
      name: String!
      createdAt: String!
      updatedAt: String!
      author: String!
    }

    type InjectResult {
      containers: [Container!]!
      formatted: String!
      tokenCount: Int!
      verified: Boolean!
    }

    scalar JSON
  `,
  resolvers: {
    Query: {
      health: () => ({ status: "ok", version: "0.1.0" }),
      container: async (_, { id }) => {
        const ctx = await inject({ containers: [id], verify: true, format: "json" });
        return ctx.containers[0] || null;
      },
      containers: async (_, { type, namespace, limit }) => {
        // TODO: implement listing
        return [];
      },
      inject: async (_, { containers, verify, format }) => {
        return inject({
          containers,
          verify: verify !== false,
          format: format || "markdown",
        });
      },
    },
  },
});

app.use("/graphql", createYoga({ schema }));

// Start
app.listen(PORT, () => {
  console.log(`GitChain API on port ${PORT}`);
  console.log(`  REST:    http://localhost:${PORT}/api`);
  console.log(`  GraphQL: http://localhost:${PORT}/graphql`);
});
