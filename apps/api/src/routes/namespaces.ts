/**
 * Namespace management routes
 */

import { Router } from "express";
import { listNamespaces, createNamespace } from "@0711/git";

const router = Router();

const gitConfig = {
  baseDir: process.env.GITCHAIN_DATA_DIR || "/data/gitchain/repos",
  authorName: "GitChain API",
  authorEmail: "api@gitchain.0711.io",
};

/**
 * GET /namespaces - List all namespaces
 */
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    const namespaces = await listNamespaces(type as string | undefined, gitConfig);

    res.json({
      namespaces: namespaces.map((ns) => ({
        name: ns.name,
        type: ns.type,
        containerCount: ns.containerCount,
        lastCommit: ns.lastCommit
          ? {
              hash: ns.lastCommit.hash,
              message: ns.lastCommit.message,
              timestamp: ns.lastCommit.timestamp,
            }
          : null,
        createdAt: ns.createdAt,
      })),
      total: namespaces.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /namespaces - Create namespace
 */
router.post("/", async (req, res) => {
  try {
    const { type, namespace } = req.body;

    if (!type || !namespace) {
      return res.status(400).json({ error: "Required: type, namespace" });
    }

    const validTypes = ["product", "campaign", "project", "memory", "knowledge"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    await createNamespace(type, namespace, gitConfig);

    res.status(201).json({
      type,
      namespace,
      message: "Namespace created",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
