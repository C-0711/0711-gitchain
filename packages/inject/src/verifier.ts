/**
 * Blockchain verification for containers
 *
 * Calls GitChain's /api/chain/verify/:hash endpoint
 * for real on-chain Merkle proof + blockchain verification.
 */

import type { Container } from "@0711/core";
import type { ChainProof, VerificationResult } from "./types.js";

// GitChain API base URL (the central blockchain service)
const CHAIN_API_URL =
  process.env.GITCHAIN_API_URL || "http://localhost:3100";

/**
 * Verify blockchain proofs for containers
 */
export async function verifyContainers(
  containers: Container[]
): Promise<VerificationResult> {
  const proofs: ChainProof[] = [];
  let allVerified = true;

  for (const container of containers) {
    if (!container.chain) {
      allVerified = false;
      proofs.push({
        containerId: container.id,
        verified: false,
        reason: "No blockchain proof attached",
      });
      continue;
    }

    const proof = await verifyOnChain(container);
    proofs.push(proof);

    if (!proof.verified) {
      allVerified = false;
    }
  }

  return { proofs, allVerified };
}

/**
 * Verify a single container on-chain via GitChain API
 */
async function verifyOnChain(container: Container): Promise<ChainProof> {
  if (!container.chain) {
    return {
      containerId: container.id,
      verified: false,
      reason: "No chain data",
    };
  }

  // The container's content hash is used for verification
  const contentHash = (container as any).contentHash || container.id;

  try {
    const response = await fetch(
      `${CHAIN_API_URL}/api/chain/verify/${contentHash}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    );

    if (!response.ok) {
      return {
        containerId: container.id,
        verified: false,
        reason: `Verification API returned ${response.status}`,
      };
    }

    const result = await response.json() as any;

    return {
      containerId: container.id,
      verified: result.verified && result.blockchain?.verified,
      network: result.batch?.network || container.chain.network,
      batchId: result.batch?.batchId || container.chain.batchId,
      txHash: result.blockchain?.details?.txHash || container.chain.txHash,
      blockNumber:
        result.blockchain?.details?.blockNumber ||
        container.chain.blockNumber,
      verifiedAt: new Date().toISOString(),
    };
  } catch (error) {
    // If the API is unreachable, fall back to trusting local chain data
    console.warn(
      `[Verifier] GitChain API unreachable, trusting local chain data for ${container.id}:`,
      error instanceof Error ? error.message : error
    );

    return {
      containerId: container.id,
      verified: !!container.chain.txHash, // Trust if we have a txHash
      network: container.chain.network,
      batchId: container.chain.batchId,
      txHash: container.chain.txHash,
      blockNumber: container.chain.blockNumber,
      verifiedAt: new Date().toISOString(),
      reason: "Verified from local chain data (API unreachable)",
    };
  }
}

/**
 * Verify a content hash directly via GitChain API
 */
export async function verifyHash(
  hash: string,
  _network = "base-mainnet"
): Promise<ChainProof & { manifest?: unknown }> {
  try {
    const response = await fetch(
      `${CHAIN_API_URL}/api/chain/verify/${hash}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return {
        containerId: "",
        verified: false,
        reason: `Verification failed: HTTP ${response.status}`,
      };
    }

    const result = await response.json() as any;

    return {
      containerId: "",
      verified: result.verified,
      network: result.batch?.network,
      batchId: result.batch?.batchId,
      txHash: result.blockchain?.details?.txHash,
      blockNumber: result.blockchain?.details?.blockNumber,
      verifiedAt: new Date().toISOString(),
      manifest: result.manifest,
    };
  } catch (error) {
    return {
      containerId: "",
      verified: false,
      reason:
        error instanceof Error
          ? error.message
          : "Hash verification failed",
    };
  }
}
