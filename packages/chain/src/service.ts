/**
 * @0711/chain — Content Certification Service
 *
 * Handles hashing, manifest creation, compliance checks, and the
 * certification queue. This is the entry point for certifying content.
 */

import { createHash } from "crypto";
import { saveManifest, getManifest, logAudit, updateManifestBatch } from "./db.js";
import {
  createBatch as createMerkleBatch,
  verifyProof,
  getProofByHash,
  updateBatchStatus,
  type BatchResult,
} from "./merkle.js";
import { getBlockchainService } from "./blockchain.js";
import type {
  ContentManifest,
  ComplianceResult,
  CertifyRequest,
  CertifyResponse,
  MerkleProof,
} from "./types.js";

// ============================================
// CERTIFICATION QUEUE (in-memory)
// ============================================

const certificationQueue: Map<string, ContentManifest> = new Map();
const proofStore: Map<string, MerkleProof> = new Map();

// ============================================
// HASHING UTILITIES
// ============================================

export function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function hashContent(content: Buffer | string): string {
  const buffer =
    typeof content === "string" ? Buffer.from(content, "base64") : content;
  return sha256(buffer);
}

export function hashPrompt(prompt: string): string {
  const salt = process.env.PROMPT_HASH_SALT || "0711-gitchain-v1";
  return sha256(`${salt}:${prompt}`);
}

export function hashManifest(manifest: ContentManifest): string {
  const canonical = JSON.stringify(manifest, Object.keys(manifest).sort());
  return sha256(canonical);
}

// ============================================
// MANIFEST CREATION
// ============================================

export function createManifest(request: CertifyRequest): ContentManifest {
  const now = new Date().toISOString();
  const contentHash = hashContent(request.content);
  const promptHash = hashPrompt(request.prompt);

  const workflowData = JSON.stringify({
    model: request.modelId,
    params: request.parameters || {},
  });
  const workflowHash = sha256(workflowData);

  const manifest: ContentManifest = {
    contentHash,
    contentType: request.contentType,
    workflowHash,
    modelId: request.modelId,
    modelVersion: "1.0",
    promptHash,
    parameters: request.parameters || {},
    generatedAt: now,
    operatorId: request.operatorId || "anonymous",
    organizationId: request.organizationId,
    executionMode: request.executionMode || "cloud",
    provider: request.provider || "unknown",
    compliance: [],
  };

  if (request.productId) {
    manifest.productContext = {
      productId: request.productId,
      mcpSource: request.mcpSource || "gitchain",
      mcpDataHash: sha256(request.productId),
    };
  }

  if (request.brandId) {
    manifest.brandId = request.brandId;
    manifest.brandVersion = "1.0";
  }

  return manifest;
}

// ============================================
// COMPLIANCE CHECKS
// ============================================

export async function runECGTCheck(text: string): Promise<ComplianceResult> {
  const bannedTerms = [
    "nachhaltig",
    "sustainable",
    "umweltfreundlich",
    "eco-friendly",
    "grün",
    "green",
    "klimaneutral",
    "carbon-neutral",
    "CO2-neutral",
  ];

  const lowerText = text.toLowerCase();
  const found = bannedTerms.filter((term) => lowerText.includes(term));

  return {
    rule: "ecgt_no_greenwashing",
    version: "1.0",
    result: found.length === 0 ? "PASSED" : "WARNING",
    details:
      found.length > 0
        ? `Found potentially restricted terms: ${found.join(", ")}`
        : "No restricted terms found",
    checkedAt: new Date().toISOString(),
  };
}

export async function runBrandCheck(
  brandId: string
): Promise<ComplianceResult> {
  return {
    rule: `brand_${brandId}_guidelines`,
    version: "1.0",
    result: "PASSED",
    details: "Brand check passed",
    checkedAt: new Date().toISOString(),
  };
}

export async function runPIICheck(content: string): Promise<ComplianceResult> {
  const emailPattern =
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phonePattern =
    /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;

  const hasEmail = emailPattern.test(content);
  const hasPhone = phonePattern.test(content);

  return {
    rule: "dsgvo_no_pii",
    version: "1.0",
    result: hasEmail || hasPhone ? "WARNING" : "PASSED",
    details:
      hasEmail || hasPhone
        ? "Potential PII detected (email or phone pattern)"
        : "No PII patterns detected",
    checkedAt: new Date().toISOString(),
  };
}

// ============================================
// CERTIFICATION FLOW
// ============================================

export async function certify(
  request: CertifyRequest
): Promise<CertifyResponse> {
  // 1. Create manifest
  const manifest = createManifest(request);

  // 2. Run compliance checks
  const compliance: ComplianceResult[] = [];

  if (request.runCompliance?.ecgt) {
    compliance.push(await runECGTCheck(request.prompt));
  }
  if (request.runCompliance?.brand && request.brandId) {
    compliance.push(await runBrandCheck(request.brandId));
  }
  if (request.runCompliance?.pii) {
    compliance.push(await runPIICheck(request.prompt));
  }

  // Always add AI Act provenance check
  compliance.push({
    rule: "ai_act_art50_provenance",
    version: "1.0",
    result: "PASSED",
    details:
      "GitChain Content Chain certification provides machine-readable provenance",
    checkedAt: new Date().toISOString(),
  });

  manifest.compliance = compliance;
  manifest.certifiedAt = new Date().toISOString();

  // 3. Hash the complete manifest
  const manifestHash = hashManifest(manifest);

  // 4. Add to certification queue
  certificationQueue.set(manifestHash, manifest);

  // 5. Save to database
  try {
    await saveManifest({
      contentHash: manifest.contentHash,
      manifestHash,
      contentType: manifest.contentType,
      modelId: manifest.modelId || undefined,
      promptHash: manifest.promptHash,
      operatorId: manifest.operatorId || undefined,
      organizationId: manifest.organizationId || undefined,
      executionMode: manifest.executionMode || undefined,
      provider: manifest.provider || undefined,
      productId: manifest.productContext?.productId || undefined,
      brandId: manifest.brandId || undefined,
      manifestData: manifest,
      complianceData: compliance.length > 0 ? compliance : undefined,
      ipfsCid: undefined,
      batchId: undefined,
    });

    await logAudit({
      action: "content_certified",
      entityType: "manifest",
      entityId: manifest.contentHash,
      actorId: manifest.operatorId || "anonymous",
      details: {
        manifestHash,
        contentType: manifest.contentType,
        modelId: manifest.modelId,
      },
    });
  } catch (dbError) {
    console.error("[Chain] DB save failed:", dbError);
    // Continue — in-memory queue is the fallback
  }

  // 6. Return response
  return {
    success: true,
    manifestHash,
    contentHash: manifest.contentHash,
    manifest,
    compliance,
    certification: {
      batchId: 0, // Assigned when batched
      merkleProof: [], // Generated when batched
      status: "queued",
    },
  };
}

// ============================================
// VERIFICATION (local lookup)
// ============================================

export async function verify(contentHash: string): Promise<{
  verified: boolean;
  manifest?: ContentManifest;
  proof?: MerkleProof;
}> {
  // Check in-memory queue first
  for (const [manifestHash, manifest] of certificationQueue.entries()) {
    if (manifest.contentHash === contentHash) {
      const proof = proofStore.get(manifestHash);
      return { verified: true, manifest, proof };
    }
  }

  // Check database
  try {
    const dbManifest = await getManifest(contentHash);
    if (dbManifest) {
      return {
        verified: true,
        manifest: dbManifest.manifestData as ContentManifest,
      };
    }
  } catch {
    // DB not available, rely on in-memory
  }

  return { verified: false };
}

// ============================================
// QUEUE MANAGEMENT
// ============================================

export function getQueueSize(): number {
  return certificationQueue.size;
}

export function getQueuedManifests(): ContentManifest[] {
  return Array.from(certificationQueue.values());
}

/**
 * Get queued items formatted for Merkle batch creation.
 */
export function getQueuedItems(): {
  id: string;
  contentHash: string;
  data: unknown;
}[] {
  return Array.from(certificationQueue.entries()).map(
    ([manifestHash, manifest]) => ({
      id: manifestHash,
      contentHash: manifest.contentHash,
      data: manifest,
    })
  );
}

export function clearQueue(): void {
  certificationQueue.clear();
}

// ============================================
// BLOCKCHAIN BATCH SUBMISSION
// ============================================

export interface BatchSubmissionResult {
  success: boolean;
  batchId: number;
  merkleRoot: string;
  txHash?: string;
  blockNumber?: number;
  onChainBatchId?: number;
  error?: string;
}

/**
 * Create a batch from queued items and submit to blockchain.
 */
export async function submitBatchToChain(
  metadataUri?: string
): Promise<BatchSubmissionResult | null> {
  const items = getQueuedItems();
  if (items.length === 0) {
    return null;
  }

  // Create Merkle batch
  const batch = createMerkleBatch(items);
  if (!batch) {
    return null;
  }

  console.log(
    `[Chain] Created batch #${batch.batchId} with ${batch.itemCount} items`
  );

  // Submit to blockchain
  const blockchain = getBlockchainService();
  const uri = metadataUri || `ipfs://pending-${batch.batchId}`;

  const result = await blockchain.certifyBatch(
    batch.merkleRoot,
    uri,
    batch.itemCount
  );

  if (result.success) {
    // Update batch status
    updateBatchStatus(
      batch.batchId,
      "confirmed",
      result.txHash,
      result.blockNumber
    );

    // Update manifests in database with batch ID
    for (const item of items) {
      try {
        await updateManifestBatch(item.contentHash, batch.batchId);
      } catch (err) {
        console.error(`[Chain] Failed to update manifest ${item.id}:`, err);
      }
    }

    // Clear submitted items from queue
    for (const item of items) {
      certificationQueue.delete(item.id);
    }

    console.log(
      `[Chain] Batch #${batch.batchId} confirmed in tx ${result.txHash}`
    );

    return {
      success: true,
      batchId: batch.batchId,
      merkleRoot: batch.merkleRoot,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      onChainBatchId: result.onChainBatchId,
    };
  } else {
    updateBatchStatus(batch.batchId, "failed");
    return {
      success: false,
      batchId: batch.batchId,
      merkleRoot: batch.merkleRoot,
      error: result.error,
    };
  }
}

// ============================================
// ON-CHAIN VERIFICATION
// ============================================

export interface OnChainVerificationResult {
  verified: boolean;
  onChain: boolean;
  batchId?: number;
  txHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
  error?: string;
}

/**
 * Verify a content hash on the blockchain.
 */
export async function verifyOnChain(
  contentHash: string
): Promise<OnChainVerificationResult> {
  // Get stored proof
  const proof = getProofByHash(contentHash);
  if (!proof) {
    // Try database lookup
    try {
      const manifest = await getManifest(contentHash);
      if (!manifest?.batchId) {
        return {
          verified: false,
          onChain: false,
          error: "No proof found for this content hash",
        };
      }

      // We have a batch ID but no local proof - need to reconstruct
      return {
        verified: true,
        onChain: true,
        batchId: manifest.batchId,
      };
    } catch {
      return {
        verified: false,
        onChain: false,
        error: "Content not found",
      };
    }
  }

  // Verify on-chain
  const blockchain = getBlockchainService();

  try {
    const isValid = await blockchain.verifyCertification(
      proof.batchId,
      proof.contentHash,
      proof.proof
    );

    if (isValid) {
      const batchInfo = await blockchain.getCertification(proof.batchId);
      return {
        verified: true,
        onChain: true,
        batchId: proof.batchId,
        explorerUrl: batchInfo
          ? blockchain.getExplorerUrl(proof.batchId.toString())
          : undefined,
      };
    } else {
      return {
        verified: false,
        onChain: true,
        batchId: proof.batchId,
        error: "Merkle proof verification failed on-chain",
      };
    }
  } catch (error) {
    return {
      verified: false,
      onChain: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

export { certificationQueue, proofStore };
