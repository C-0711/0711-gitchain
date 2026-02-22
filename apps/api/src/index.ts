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

// Route imports
import containersRouter from "./routes/containers";
import verifyRouter from "./routes/verify";
import namespacesRouter from "./routes/namespaces";

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

// REST Routes
app.use("/api/containers", containersRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/namespaces", namespacesRouter);

// REST: Inject context (main API)
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

// GraphQL schema
const schema = createSchema({
  typeDefs: /* GraphQL */ \`
    type Query {
      container(id: ID!): Container
      containers(ids: [ID!]!, type: String, namespace: String): [Container!]!
      inject(input: InjectInput!): InjectedContext!
      namespaces(type: String): [Namespace!]!
    }

    type Mutation {
      createContainer(input: CreateContainerInput!): ContainerResult!
      updateContainer(id: ID!, input: UpdateContainerInput!): ContainerResult!
      createNamespace(type: String!, namespace: String!): NamespaceResult!
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
      chain: ChainProof
      git: GitInfo
    }

    type ContainerMeta {
      name: String!
      description: String
      createdAt: String!
      updatedAt: String!
      author: String!
      tags: [String!]
    }

    type Citation {
      documentId: String!
      page: Int
      quote: String
      confidence: String!
    }

    type ChainProof {
      network: String!
      batchId: Int!
      txHash: String
      blockNumber: Int
    }

    type GitInfo {
      repository: String!
      branch: String!
      commit: String!
      commitMessage: String
      commitAt: String!
    }

    type InjectedContext {
      containers: [Container!]!
      citations: [Citation!]!
      formatted: String!
      tokenCount: Int!
      verified: Boolean!
      verifiedAt: String!
    }

    type Namespace {
      name: String!
      type: String!
      containerCount: Int!
      createdAt: String!
    }

    type ContainerResult {
      id: ID!
      version: Int!
      commitHash: String!
      message: String!
    }

    type NamespaceResult {
      type: String!
      namespace: String!
      message: String!
    }

    input InjectInput {
      containers: [ID!]!
      verify: Boolean
      format: String
      includeCitations: Boolean
    }

    input CreateContainerInput {
      type: String!
      namespace: String!
      identifier: String!
      data: JSON!
      meta: ContainerMetaInput
    }

    input UpdateContainerInput {
      data: JSON
      meta: ContainerMetaInput
      message: String
    }

    input ContainerMetaInput {
      name: String
      description: String
      author: String
      tags: [String!]
    }

    scalar JSON
  \`,
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
      namespaces: async () => {
        // TODO: Implement namespace listing
        return [];
      },
    },
    Mutation: {
      createContainer: async (_, { input }) => {
        // TODO: Implement container creation
        return {
          id: "0711:product:test:test:v1",
          version: 1,
          commitHash: "abc123",
          message: "Container created",
        };
      },
      updateContainer: async (_, { id, input }) => {
        // TODO: Implement container update
        return {
          id,
          version: 2,
          commitHash: "def456",
          message: "Container updated",
        };
      },
      createNamespace: async (_, { type, namespace }) => {
        // TODO: Implement namespace creation
        return {
          type,
          namespace,
          message: "Namespace created",
        };
      },
    },
  },
});

// GraphQL endpoint
const yoga = createYoga({ schema });
app.use("/graphql", yoga);

// Start server
app.listen(PORT, () => {
  console.log(\`GitChain API running on port \${PORT}\`);
  console.log(\`  REST:    http://localhost:\${PORT}/api\`);
  console.log(\`  GraphQL: http://localhost:\${PORT}/graphql\`);
  console.log(\`  Health:  http://localhost:\${PORT}/health\`);
});
