/**
 * /api/chain/* — The Content Blockchain API
 *
 * This is THE central blockchain service. All external services
 * (Studio, Vault, MCP servers) call these endpoints.
 *
 * Routes:
 *   POST /api/chain/certify        — Certify content
 *   GET  /api/chain/certify        — Health + queue status
 *   POST /api/chain/batch          — Create Merkle batch from queue
 *   GET  /api/chain/batch          — List all batches
 *   GET  /api/chain/batch/:id      — Get specific batch
 *   POST /api/chain/submit         — Submit batch to Base Mainnet
 *   GET  /api/chain/status         — Blockchain connection status
 *   GET  /api/chain/verify/:hash   — Full 4-step verification
 */

import { Router, Request, Response, NextFunction } from "express";
import {
  // Service
  certify,
  verify,
  getQueueSize,
  getQueuedItems,
  clearQueue,
  // Blockchain
  getBlockchainService,
  // Merkle
  createBatch,
  getBatchLocal,
  getAllBatches,
  updateBatchStatus,
  verifyProof,
  getProofByHash,
  // Database
  initializeSchema,
  saveBatch,
  getBatch,
  getManifest,
  saveProof,
  getProof,
  getStats,
  logAudit,
} from "@0711/chain";

export function createChainRouter(): Router {
  const router = Router();

  // Initialize chain DB schema on first load
  initializeSchema().catch((err: unknown) => {
    console.error("[Chain] Schema init failed:", err);
  });

  // ============================================
  // POST /certify — Certify content
  // ============================================

  router.post(
    "/certify",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body;

        if (!body.content) {
          return res.status(400).json({ error: "content is required" });
        }
        if (!body.modelId) {
          return res.status(400).json({ error: "modelId is required" });
        }
        if (!body.prompt) {
          return res.status(400).json({ error: "prompt is required" });
        }

        const result = await certify({
          content: body.content,
          contentType: body.contentType || "text",
          modelId: body.modelId,
          prompt: body.prompt,
          parameters: body.parameters,
          operatorId: body.operatorId,
          organizationId: body.organizationId,
          executionMode: body.executionMode,
          provider: body.provider,
          productId: body.productId,
          brandId: body.brandId,
          mcpSource: body.mcpSource,
          runCompliance: body.runCompliance || { ecgt: true, pii: true },
        });

        res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  // ============================================
  // GET /certify — Health + queue status
  // ============================================

  router.get(
    "/certify",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { hash } = req.query;

        // Quick verify if hash provided
        if (hash && typeof hash === "string") {
          const result = await verify(hash);
          return res.json({ action: "verify", ...result });
        }

        // Blockchain status
        let blockchainStatus;
        try {
          const blockchain = getBlockchainService();
          blockchainStatus = await blockchain.getStatus();
        } catch {
          blockchainStatus = { connected: false, network: "unknown" };
        }

        // DB stats
        let stats;
        try {
          stats = await getStats();
        } catch {
          stats = null;
        }

        res.json({
          service: "GitChain Content Blockchain",
          version: "1.0.0",
          status: "operational",
          queueSize: getQueueSize(),
          stats,
          blockchain: blockchainStatus,
          endpoints: {
            certify: "POST /api/chain/certify",
            batch: "POST /api/chain/batch",
            submit: "POST /api/chain/submit",
            verify: "GET /api/chain/verify/:hash",
            status: "GET /api/chain/status",
          },
          compliance: {
            ecgt: "ECGT Anti-Greenwashing (effective 2026-09-27)",
            brand: "Brand Guidelines Check",
            pii: "DSGVO PII Detection",
            aiAct: "EU AI Act Art. 50 Provenance",
          },
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // ============================================
  // POST /batch — Create Merkle batch from queue
  // ============================================

  router.post(
    "/batch",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const items = getQueuedItems();

        if (items.length === 0) {
          return res
            .status(400)
            .json({ error: "No items in queue to batch", queueSize: 0 });
        }

        const result = createBatch(items);

        if (!result) {
          return res.status(500).json({ error: "Failed to create batch" });
        }

        // Persist batch to DB
        try {
          await saveBatch({
            batchId: result.batchId,
            merkleRoot: result.merkleRoot,
            itemCount: result.itemCount,
            status: "pending",
            network: "base-mainnet",
          });

          // Persist individual proofs
          for (const [id, proof] of result.proofs.entries()) {
            await saveProof({
              manifestHash: id,
              batchId: result.batchId,
              leafIndex: proof.index,
              proof: proof.proof,
            });
          }
        } catch (dbErr) {
          console.error("[Chain] Batch DB save failed:", dbErr);
        }

        // Clear the queue after successful batching
        clearQueue();

        // Convert proofs Map to object for JSON serialization
        const proofsObj: Record<string, any> = {};
        for (const [hash, proof] of result.proofs.entries()) {
          proofsObj[hash] = proof;
        }

        res.json({
          success: true,
          batch: {
            batchId: result.batchId,
            merkleRoot: result.merkleRoot,
            itemCount: result.itemCount,
            status: "pending",
          },
          proofs: proofsObj,
          message: `Batch #${result.batchId} created with ${result.itemCount} items. Ready for blockchain submission.`,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // ============================================
  // GET /batch — List all batches
  // ============================================

  router.get(
    "/batch",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const batches = getAllBatches();
        const queueSize = getQueueSize();

        res.json({
          queueSize,
          batchCount: batches.length,
          batches: batches.map((b: any) => ({
            batchId: b.batchId,
            merkleRoot: b.merkleRoot,
            itemCount: b.itemCount,
            status: b.status,
            network: b.network,
            txHash: b.txHash,
            createdAt: b.createdAt,
          })),
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // ============================================
  // GET /batch/:id — Get specific batch
  // ============================================

  router.get(
    "/batch/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const batchId = parseInt(req.params.id, 10);
        if (isNaN(batchId)) {
          return res.status(400).json({ error: "Invalid batch ID" });
        }

        // Check in-memory first, then DB
        let batch = getBatchLocal(batchId);
        if (!batch) {
          const dbBatch = await getBatch(batchId);
          if (!dbBatch) {
            return res.status(404).json({ error: "Batch not found" });
          }
          return res.json({ batch: dbBatch });
        }

        res.json({ batch });
      } catch (err) {
        next(err);
      }
    }
  );

  // ============================================
  // POST /submit — Submit batch to blockchain
  // ============================================

  router.post(
    "/submit",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { batchId, metadataURI } = req.body;

        if (!batchId) {
          return res.status(400).json({ error: "batchId is required" });
        }

        // Get batch (in-memory or DB)
        let batch = getBatchLocal(batchId);
        if (!batch) {
          const dbBatch = await getBatch(batchId);
          if (!dbBatch) {
            return res.status(404).json({ error: "Batch not found" });
          }
          if (dbBatch.status === "confirmed") {
            return res.status(400).json({
              error: "Batch already confirmed on blockchain",
              txHash: dbBatch.txHash,
            });
          }
          // Use DB batch data
          batch = {
            batchId: dbBatch.batchId,
            merkleRoot: dbBatch.merkleRoot,
            itemCount: dbBatch.itemCount,
            network: (dbBatch.network as "base-mainnet" | "base-sepolia") || "base-mainnet",
            createdAt: new Date().toISOString(),
            status: dbBatch.status,
          };
        }

        if (batch.status === "confirmed") {
          return res.status(400).json({
            error: "Batch already confirmed on blockchain",
            txHash: batch.txHash,
          });
        }

        const blockchain = getBlockchainService();
        const status = await blockchain.getStatus();

        if (!status.connected) {
          return res
            .status(503)
            .json({ error: "Cannot connect to blockchain", network: status.network });
        }

        // Submit to blockchain
        const result = await blockchain.certifyBatch(
          batch.merkleRoot,
          metadataURI || `ipfs://pending-${batchId}`,
          batch.itemCount
        );

        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }

        // Update in-memory + DB
        updateBatchStatus(
          batchId,
          "confirmed",
          result.txHash,
          result.blockNumber
        );

        try {
          await saveBatch({
            batchId,
            merkleRoot: batch.merkleRoot,
            itemCount: batch.itemCount,
            status: "confirmed",
            onChainBatchId: result.onChainBatchId,
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            network: status.network,
          });

          await logAudit({
            action: "batch_submitted",
            entityType: "batch",
            entityId: String(batchId),
            details: {
              txHash: result.txHash,
              blockNumber: result.blockNumber,
              onChainBatchId: result.onChainBatchId,
            },
          });
        } catch (dbErr) {
          console.error("[Chain] Batch status DB update failed:", dbErr);
        }

        res.json({
          success: true,
          batchId,
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          onChainBatchId: result.onChainBatchId,
          network: status.network,
          explorerUrl: blockchain.getExplorerUrl(result.txHash!),
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // ============================================
  // GET /status — Blockchain connection status
  // ============================================

  router.get(
    "/status",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const blockchain = getBlockchainService();
        const status = await blockchain.getStatus();

        let stats;
        try {
          stats = await getStats();
        } catch {
          stats = null;
        }

        res.json({
          service: "GitChain Content Blockchain",
          ...status,
          stats,
          contract: blockchain.getContractAddress(),
          explorer: blockchain.getContractUrl(),
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // ============================================
  // GET /verify/:hash — Full 4-step verification
  // ============================================

  router.get(
    "/verify/:hash",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const hash = req.params.hash;

        if (!hash || hash.length < 16) {
          return res
            .status(400)
            .json({ error: "Invalid hash (min 16 hex chars)" });
        }

        // Step 1: Check local manifest
        const localResult = await verify(hash);

        // Step 2: Check DB for manifest
        let dbManifest = null;
        try {
          dbManifest = await getManifest(hash);
        } catch {
          // DB not available
        }

        // Step 3: Get proof + batch
        let proof = null;
        let batchRecord = null;
        try {
          proof = getProofByHash(hash);
          if (!proof) {
            const dbProof = await getProof(hash);
            if (dbProof) {
              proof = {
                contentHash: hash,
                manifestHash: hash,
                proof: dbProof.proof,
                batchId: dbProof.batchId,
                index: dbProof.leafIndex,
              };
            }
          }

          if (proof) {
            batchRecord = await getBatch(proof.batchId);
          }
        } catch {
          // DB not available
        }

        // Step 4: Verify on blockchain if batch is confirmed
        let blockchainVerified = false;
        let blockchainDetails = null;

        if (
          batchRecord?.status === "confirmed" &&
          batchRecord.txHash &&
          proof
        ) {
          try {
            const blockchain = getBlockchainService();
            blockchainVerified = await blockchain.verifyCertification(
              proof.batchId,
              hash,
              proof.proof
            );

            const certification = await blockchain.getCertification(
              proof.batchId
            );
            if (certification) {
              blockchainDetails = {
                batchId: proof.batchId,
                merkleRoot: certification.merkleRoot,
                timestamp: certification.timestamp.toISOString(),
                itemCount: certification.itemCount,
                issuer: certification.issuer,
                txHash: batchRecord.txHash,
                blockNumber: batchRecord.blockNumber,
              };
            }
          } catch (err) {
            console.error("[Chain] Blockchain verification error:", err);
          }
        }

        res.json({
          success: true,
          contentHash: hash,
          verified: localResult.verified || !!dbManifest,
          manifest: localResult.manifest || dbManifest?.manifestData || null,
          batch: batchRecord
            ? {
                batchId: batchRecord.batchId,
                status: batchRecord.status,
                itemCount: batchRecord.itemCount,
                network: batchRecord.network,
              }
            : null,
          merkleProof: proof?.proof || null,
          blockchain: {
            verified: blockchainVerified,
            onChain: !!blockchainDetails,
            details: blockchainDetails,
          },
          links: blockchainDetails
            ? {
                basescan: `https://basescan.org/tx/${batchRecord?.txHash}`,
                contract: `https://basescan.org/address/0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7`,
              }
            : null,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
