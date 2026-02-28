/**
 * @0711/chain — Merkle Tree Engine
 *
 * Batches content hashes into Merkle trees for efficient on-chain certification.
 * Uses keccak256 (compatible with OpenZeppelin MerkleProof.verify on-chain).
 */

import { ethers } from "ethers";
import type { CertificationBatch, MerkleProof as TypesMerkleProof } from "./types";

// ============================================
// MERKLE TREE TYPES
// ============================================

export interface MerkleTreeResult {
  root: string;
  leaves: string[];
  tree: string[][];
}

export interface MerkleProof {
  leaf: string;
  proof: string[];
  index: number;
}

export interface BatchResult {
  batchId: number;
  merkleRoot: string;
  itemCount: number;
  contentHashes: string[];
  proofs: Map<string, MerkleProof>;
}

// ============================================
// HASHING (keccak256 for OpenZeppelin compat)
// ============================================

/**
 * Hash content data into a leaf for the Merkle tree.
 */
export function hashContent(content: unknown): string {
  const json = JSON.stringify(content, Object.keys(content as object).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(json));
}

/**
 * Hash a pair of nodes. Sorts to ensure deterministic ordering
 * (matches OpenZeppelin MerkleProof.verify behavior).
 */
function hashPair(left: string, right: string): string {
  return left < right
    ? ethers.keccak256(ethers.concat([left, right]))
    : ethers.keccak256(ethers.concat([right, left]));
}

// ============================================
// MERKLE TREE
// ============================================

/**
 * Build a Merkle tree from content hashes.
 */
export function buildMerkleTree(contentHashes: string[]): MerkleTreeResult {
  if (contentHashes.length === 0) {
    throw new Error("Cannot build Merkle tree from empty array");
  }

  // Sort hashes for deterministic tree
  const leaves = [...contentHashes].sort();
  const tree: string[][] = [leaves];

  // Build tree bottom-up
  let currentLevel = leaves;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left; // Duplicate last if odd
      nextLevel.push(hashPair(left, right));
    }

    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  return {
    root: tree[tree.length - 1][0],
    leaves,
    tree,
  };
}

/**
 * Generate a Merkle proof for a specific leaf.
 */
export function generateProof(
  tree: MerkleTreeResult,
  leafHash: string
): MerkleProof {
  const index = tree.leaves.indexOf(leafHash);
  if (index === -1) {
    throw new Error("Leaf not found in tree");
  }

  const proof: string[] = [];
  let currentIndex = index;

  for (let level = 0; level < tree.tree.length - 1; level++) {
    const levelHashes = tree.tree[level];
    const isRightNode = currentIndex % 2 === 1;
    const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

    if (siblingIndex < levelHashes.length) {
      proof.push(levelHashes[siblingIndex]);
    }

    currentIndex = Math.floor(currentIndex / 2);
  }

  return { leaf: leafHash, proof, index };
}

/**
 * Verify a Merkle proof against a root.
 * Uses sorted pair hashing for OpenZeppelin compatibility.
 */
export function verifyProof(
  root: string,
  leaf: string,
  proof: string[]
): boolean {
  let hash = leaf;

  for (const sibling of proof) {
    // Sort pair for deterministic ordering (OpenZeppelin compatible)
    hash = hashPair(hash, sibling);
  }

  return hash === root;
}

/**
 * Verify a Merkle proof with index (legacy support).
 */
export function verifyProofWithIndex(
  root: string,
  leaf: string,
  proof: string[],
  index: number
): boolean {
  return verifyProof(root, leaf, proof);
}

// ============================================
// BATCH STATE MANAGEMENT
// ============================================

let batchCounter = 0;
const batches: Map<number, CertificationBatch> = new Map();
const proofStore: Map<string, TypesMerkleProof> = new Map();

/**
 * Create a batch from the certification queue.
 * Takes a list of items with id + data, builds a Merkle tree, stores proofs.
 */
export function createBatch(
  items: { id: string; contentHash: string; data: unknown }[]
): BatchResult | null {
  if (items.length === 0) {
    return null;
  }

  const contentHashes = items.map((item) => item.contentHash);
  const tree = buildMerkleTree(contentHashes);
  const batchId = ++batchCounter;

  // Create batch record
  const batch: CertificationBatch = {
    batchId,
    merkleRoot: tree.root,
    itemCount: items.length,
    network: "base-mainnet",
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  batches.set(batchId, batch);

  // Generate and store proofs
  const proofs = new Map<string, MerkleProof>();
  for (let i = 0; i < items.length; i++) {
    const hash = contentHashes[i];
    const sortedIndex = tree.leaves.indexOf(hash);
    if (sortedIndex === -1) continue;

    const proof = generateProof(tree, hash);
    proofs.set(items[i].id, proof);

    // Store in global proof store keyed by content hash
    proofStore.set(hash, {
      contentHash: hash,
      manifestHash: hash,
      proof: proof.proof,
      batchId,
      index: proof.index,
    });
  }

  return {
    batchId,
    merkleRoot: tree.root,
    itemCount: items.length,
    contentHashes,
    proofs,
  };
}

// ============================================
// BATCH ACCESSORS
// ============================================

export function getBatchLocal(batchId: number): CertificationBatch | undefined {
  return batches.get(batchId);
}

export function getAllBatches(): CertificationBatch[] {
  return Array.from(batches.values());
}

export function updateBatchStatus(
  batchId: number,
  status: CertificationBatch["status"],
  txHash?: string,
  blockNumber?: number,
  ipfsCid?: string
): void {
  const batch = batches.get(batchId);
  if (batch) {
    batch.status = status;
    if (txHash) batch.txHash = txHash;
    if (blockNumber) batch.blockNumber = blockNumber;
    if (ipfsCid) batch.ipfsCid = ipfsCid;
  }
}

export function getProofByHash(
  contentHash: string
): TypesMerkleProof | undefined {
  return proofStore.get(contentHash);
}

// ============================================
// AUTO-BATCHING
// ============================================

let batchTimer: ReturnType<typeof setInterval> | null = null;
const BATCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function startAutoBatching(
  getQueuedItems: () => { id: string; contentHash: string; data: unknown }[],
  onBatch: (result: BatchResult) => Promise<void>
): void {
  if (batchTimer) return;

  batchTimer = setInterval(async () => {
    const items = getQueuedItems();
    if (items.length > 0) {
      const result = createBatch(items);
      if (result) {
        console.log(
          `[Chain] Auto-batch created: #${result.batchId} with ${result.itemCount} items`
        );
        await onBatch(result);
      }
    }
  }, BATCH_INTERVAL_MS);

  console.log("[Chain] Auto-batching started (5 min interval)");
}

export function stopAutoBatching(): void {
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
    console.log("[Chain] Auto-batching stopped");
  }
}

// Export for direct access
export { batches, proofStore };
