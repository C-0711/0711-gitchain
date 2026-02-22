/**
 * GitChain API Server
 * 
 * GraphQL + REST API for container operations
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createSchema, createYoga } from "graphql-yoga";
import { inject } from "@0711/inject";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "gitchain-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// REST: Inject context
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

    res.json({
      success: true,
      ...context,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REST: Get container
app.get("/api/containers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const context = await inject({
      containers: [decodeURIComponent(id)],
      verify: true,
      format: "json",
    });

    if (context.containers.length === 0) {
      return res.status(404).json({ error: "Container not found" });
    }

    res.json(context.containers[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REST: Verify hash
app.get("/api/verify/:hash", async (req, res) => {
  // TODO: Implement hash verification against blockchain
  res.json({
    hash: req.params.hash,
    verified: false,
    message: "Verification endpoint coming soon",
  });
});

// GraphQL schema
const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      container(id: ID!): Container
      containers(ids: [ID!]!): [Container!]!
      inject(input: InjectInput!): InjectedContext!
    }

    type Container {
      id: ID!
      type: String!
      namespace: String!
      identifier: String!
      version: Int!
      meta: ContainerMeta!
      data: JSON
      citations: [Citation!]
    }

    type ContainerMeta {
      name: String!
      description: String
      createdAt: String!
      updatedAt: String!
      author: String!
    }

    type Citation {
      documentId: String!
      page: Int
      quote: String
      confidence: String!
    }

    type InjectedContext {
      containers: [Container!]!
      formatted: String!
      tokenCount: Int!
      verified: Boolean!
      verifiedAt: String!
    }

    input InjectInput {
      containers: [ID!]!
      verify: Boolean
      format: String
      includeCitations: Boolean
    }

    scalar JSON
  `,
  resolvers: {
    Query: {
      container: async (_, { id }) => {
        const context = await inject({
          containers: [id],
          verify: true,
          format: "json",
        });
        return context.containers[0] || null;
      },
      containers: async (_, { ids }) => {
        const context = await inject({
          containers: ids,
          verify: true,
          format: "json",
        });
        return context.containers;
      },
      inject: async (_, { input }) => {
        return inject({
          containers: input.containers,
          verify: input.verify !== false,
          format: input.format || "markdown",
          includeCitations: input.includeCitations !== false,
        });
      },
    },
  },
});

// GraphQL endpoint
const yoga = createYoga({ schema });
app.use("/graphql", yoga);

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 GitChain API running on port \${PORT}\`);
  console.log(\`   REST: http://localhost:\${PORT}/api\`);
  console.log(\`   GraphQL: http://localhost:\${PORT}/graphql\`);
  console.log(\`   Health: http://localhost:\${PORT}/health\`);
});
