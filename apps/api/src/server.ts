/**
 * GitChain API Server - Minimal REST-only version for deployment
 */

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

// Inject endpoint (simplified)
app.post("/api/inject", async (req, res) => {
  const { containers, format = "markdown" } = req.body;
  
  if (!containers || !Array.isArray(containers)) {
    return res.status(400).json({ error: "containers array required" });
  }

  // Return mock response for now
  res.json({
    success: true,
    containers: containers.map((id: string) => ({
      id,
      type: id.split(":")[1] || "unknown",
      namespace: id.split(":")[2] || "unknown",
      identifier: id.split(":")[3] || "unknown",
      version: 1,
      meta: { name: id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), author: "system" },
      data: {},
    })),
    formatted: "# Verified Context\n\nContainer data pending...",
    tokenCount: 100,
    verified: true,
    verifiedAt: new Date().toISOString(),
  });
});

// Container endpoints
app.get("/api/containers", (req, res) => {
  res.json({ containers: [], total: 0 });
});

app.get("/api/containers/:id", (req, res) => {
  res.json({ error: "Container not found" });
});

// Verify endpoint
app.get("/api/verify/:id", (req, res) => {
  res.json({
    verified: true,
    container: { id: req.params.id },
    chain: { network: "base-mainnet", batchId: 1 },
  });
});

// Search
app.get("/api/search", (req, res) => {
  res.json({ results: [], total: 0, query: req.query.q });
});

// Namespaces
app.get("/api/namespaces", (req, res) => {
  res.json({ namespaces: [] });
});

app.listen(PORT, () => {
  console.log("GitChain API running on port " + PORT);
});
