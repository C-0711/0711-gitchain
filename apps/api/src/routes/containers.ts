/**
 * Container CRUD routes
 */

import { Router } from "express";
import { inject } from "@0711/inject";
import { parseContainerId, validateContainerId } from "@0711/core";
import { GitRepository } from "@0711/git";

const router = Router();

const gitConfig = {
  baseDir: process.env.GITCHAIN_DATA_DIR || "/data/gitchain/repos",
  authorName: "GitChain API",
  authorEmail: "api@gitchain.0711.io",
};

/**
 * GET /containers - List containers
 */
router.get("/", async (req, res) => {
  try {
    const { type, namespace, limit = 50, offset = 0 } = req.query;

    // TODO: Implement proper listing from Git repos
    // For now, return sample data
    const containers = [
      {
        id: "0711:product:bosch:7736606982:v3",
        type: "product",
        namespace: "bosch",
        identifier: "7736606982",
        version: 3,
        meta: { name: "CS7001iAW 17 O TH", updatedAt: "2026-02-22" },
      },
    ];

    res.json({
      containers,
      total: containers.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /containers/:id - Get single container
 */
router.get("/:id", async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);

    if (!validateContainerId(id)) {
      return res.status(400).json({ error: "Invalid container ID format" });
    }

    const context = await inject({
      containers: [id],
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

/**
 * POST /containers - Create container
 */
router.post("/", async (req, res) => {
  try {
    const { type, namespace, identifier, data, meta } = req.body;

    if (!type || !namespace || !identifier || !data) {
      return res.status(400).json({
        error: "Required: type, namespace, identifier, data",
      });
    }

    const repoNamespace = `${type}/${namespace}`;
    const repo = new GitRepository(repoNamespace, gitConfig);

    const container = {
      meta: {
        name: meta?.name || identifier,
        description: meta?.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: meta?.author || "api",
      },
      data,
    };

    const hash = await repo.writeContainer(identifier, container);
    const history = await repo.getHistory(identifier, 1);
    const version = history.length;

    const id = `0711:${type}:${namespace}:${identifier}:v${version}`;

    res.status(201).json({
      id,
      version,
      commitHash: hash,
      message: "Container created",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /containers/:id - Update container
 */
router.put("/:id", async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const { data, meta, message } = req.body;

    if (!validateContainerId(id)) {
      return res.status(400).json({ error: "Invalid container ID format" });
    }

    const parsed = parseContainerId(id);
    const repoNamespace = `${parsed.type}/${parsed.namespace}`;
    const repo = new GitRepository(repoNamespace, gitConfig);

    // Get existing container
    const existing = await repo.readContainer(parsed.identifier);
    if (!existing) {
      return res.status(404).json({ error: "Container not found" });
    }

    // Merge updates
    const updated = {
      ...(existing as object),
      data: data || (existing as any).data,
      meta: {
        ...(existing as any).meta,
        ...meta,
        updatedAt: new Date().toISOString(),
      },
    };

    const hash = await repo.writeContainer(
      parsed.identifier,
      updated,
      message || `Update container ${parsed.identifier}`
    );
    const history = await repo.getHistory(parsed.identifier, 1);
    const version = history.length;

    const newId = `0711:${parsed.type}:${parsed.namespace}:${parsed.identifier}:v${version}`;

    res.json({
      id: newId,
      version,
      commitHash: hash,
      message: "Container updated",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /containers/:id/history - Get container history
 */
router.get("/:id/history", async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const { limit = 50 } = req.query;

    if (!validateContainerId(id)) {
      return res.status(400).json({ error: "Invalid container ID format" });
    }

    const parsed = parseContainerId(id);
    const repoNamespace = `${parsed.type}/${parsed.namespace}`;
    const repo = new GitRepository(repoNamespace, gitConfig);

    const history = await repo.getHistory(parsed.identifier, Number(limit));

    res.json({
      containerId: id,
      history: history.map((commit, index) => ({
        version: history.length - index,
        hash: commit.hash,
        message: commit.message,
        author: commit.author,
        timestamp: commit.timestamp,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
