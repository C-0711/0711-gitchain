/**
 * Batch registration routes
 * 
 * Register multiple containers in a single blockchain batch
 */

import { Router } from "express";
import type { Router as IRouter } from "express";
import { getBlockchainService, createBatch, verifyProof, hashContent } from "@0711/chain";
import { GitRepository } from "@0711/git";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const gitConfig = {
  baseDir: process.env.GITCHAIN_DATA_DIR || "/data/gitchain/repos",
  authorName: "GitChain API",
  authorEmail: "api@gitchain.0711.io",
};

interface BatchContainer {
  type: string;
  namespace: string;
  identifier: string;
  data: object;
  meta?: {
    name?: string;
    description?: string;
    author?: string;
  };
}

/**
 * POST /batch - Register a batch of containers
 */
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { containers, message } = req.body as {
      containers: BatchContainer[];
      message?: string;
    };

    if (!containers || !Array.isArray(containers) || containers.length === 0) {
      return res.status(400).json({
        error: "containers array required (non-empty)",
      });
    }

    if (containers.length > 1000) {
      return res.status(400).json({
        error: "Maximum 1000 containers per batch",
      });
    }

    // 1. Write containers to Git
    const results: Array<{
      id: string;
      version: number;
      commitHash: string;
    }> = [];

    for (const container of containers) {
      const { type, namespace, identifier, data, meta } = container;
      const repoNamespace = `${type}/${namespace}`;
      const repo = new GitRepository(repoNamespace, gitConfig);

      const containerData = {
        meta: {
          name: meta?.name || identifier,
          description: meta?.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: meta?.author || req.user?.email || "api",
        },
        data,
      };

      const hash = await repo.writeContainer(
        identifier,
        containerData,
        message || `Batch update: ${identifier}`
      );
      const history = await repo.getHistory(identifier, 1);
      const version = history.length;

      results.push({
        id: `0711:${type}:${namespace}:${identifier}:v${version}`,
        version,
        commitHash: hash,
      });
    }

    // 2. Create Merkle tree batch
    const batchContainers = results.map((r, i) => ({
      id: r.id,
      contentHash: hashContent(containers[i].data),
      data: containers[i].data,
    }));

    const metadataUri = `ipfs://pending`; // TODO: Upload to IPFS
    const batch = createBatch(batchContainers);

    // 3. Register on blockchain (if private key available)
    let chainResult: { batchId: number; txHash: string } | null = null;

    const privateKey = process.env.GITCHAIN_WALLET_KEY;
    if (privateKey) {
      const blockchain = getBlockchainService("base-mainnet", privateKey);
      const certResult = await blockchain.certifyBatch(batch.merkleRoot, metadataUri, results.length);
      if (certResult.success && certResult.onChainBatchId && certResult.txHash) {
        chainResult = { batchId: certResult.onChainBatchId, txHash: certResult.txHash };
      }
    }

    res.status(201).json({
      success: true,
      containers: results,
      batch: {
        merkleRoot: batch.merkleRoot,
        containerCount: results.length,
        ...(chainResult && {
          batchId: chainResult.batchId,
          txHash: chainResult.txHash,
        }),
      },
      message: chainResult
        ? "Batch registered on blockchain"
        : "Batch created (blockchain registration pending)",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /batch/:id - Get batch info
 */
router.get("/:id", async (req, res) => {
  try {
    const batchId = parseInt(req.params.id, 10);

    if (isNaN(batchId)) {
      return res.status(400).json({ error: "Invalid batch ID" });
    }

    const blockchain = getBlockchainService();
    const batch = await blockchain.getCertification(batchId);

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({
      batchId: batch.batchId,
      merkleRoot: batch.merkleRoot,
      metadataUri: batch.metadataUri,
      timestamp: batch.timestamp,
      registrar: batch.issuer,
      explorerUrl: blockchain.getExplorerUrl(batch.merkleRoot),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /batch/:id/verify - Verify a container against a batch
 */
router.post("/:id/verify", async (req, res) => {
  try {
    const batchId = parseInt(req.params.id, 10);
    const { contentHash, proof } = req.body;

    if (isNaN(batchId)) {
      return res.status(400).json({ error: "Invalid batch ID" });
    }

    if (!contentHash || !proof || !Array.isArray(proof)) {
      return res.status(400).json({
        error: "Required: contentHash, proof (array)",
      });
    }

    const blockchain = getBlockchainService();
    const batch = await blockchain.getCertification(batchId);

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Verify using Merkle proof
    const isValid = verifyProof(batch.merkleRoot, contentHash, proof);

    res.json({
      verified: isValid,
      batchId,
      merkleRoot: batch.merkleRoot,
      contentHash,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
