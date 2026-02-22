/**
 * Verification routes
 */

import { Router } from "express";
import { getBlockchainService } from "@0711/chain";
import { inject } from "@0711/inject";
import { validateContainerId, parseContainerId } from "@0711/core";

const router = Router();

/**
 * GET /verify/:hashOrId - Verify container or hash
 */
router.get("/:hashOrId", async (req, res) => {
  try {
    const hashOrId = decodeURIComponent(req.params.hashOrId);

    // Check if its a container ID
    if (validateContainerId(hashOrId)) {
      const context = await inject({
        containers: [hashOrId],
        verify: true,
        format: "json",
      });

      if (context.containers.length === 0) {
        return res.json({
          verified: false,
          reason: "Container not found",
        });
      }

      const container = context.containers[0];
      const proof = context.proofs.find((p) => p.containerId === hashOrId);

      return res.json({
        verified: context.verified,
        container: {
          id: container.id,
          type: container.type,
          version: container.version,
          meta: container.meta,
        },
        chain: proof
          ? {
              network: proof.network,
              batchId: proof.batchId,
              txHash: proof.txHash,
              blockNumber: proof.blockNumber,
              verifiedAt: proof.verifiedAt,
            }
          : null,
      });
    }

    // Its a content hash - verify directly on chain
    res.json({
      verified: false,
      hash: hashOrId,
      reason: "Direct hash verification not yet implemented",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /verify/batch - Verify multiple containers
 */
router.post("/batch", async (req, res) => {
  try {
    const { containers } = req.body;

    if (!containers || !Array.isArray(containers)) {
      return res.status(400).json({ error: "containers array required" });
    }

    const context = await inject({
      containers,
      verify: true,
      format: "json",
    });

    res.json({
      verified: context.verified,
      containers: context.containers.map((c) => ({
        id: c.id,
        verified: context.proofs.find((p) => p.containerId === c.id)?.verified || false,
      })),
      proofs: context.proofs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /verify/batch/:batchId - Get batch info from blockchain
 */
router.get("/batch/:batchId", async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId, 10);

    if (isNaN(batchId)) {
      return res.status(400).json({ error: "Invalid batch ID" });
    }

    const blockchain = getBlockchainService();
    const batch = await blockchain.getBatch(batchId);

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json({
      batchId: batch.batchId,
      merkleRoot: batch.merkleRoot,
      metadataUri: batch.metadataUri,
      timestamp: batch.timestamp,
      registrar: batch.registrar,
      explorerUrl: blockchain.getExplorerUrl(batch.merkleRoot),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
