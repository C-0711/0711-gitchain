// 0711 Content Chain - Merkle Tree Engine
// Batches manifests into a Merkle tree for efficient blockchain certification

import { createHash } from 'crypto';
import { certificationQueue, proofStore, hashManifest } from './service';
import type { ContentManifest, CertificationBatch, MerkleProof } from './types';

// ============================================
// MERKLE TREE IMPLEMENTATION
// ============================================

export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function hashPair(left: string, right: string): string {
  // Sort to ensure deterministic ordering
  const [a, b] = [left, right].sort();
  return sha256(a + b);
}

export interface MerkleTreeResult {
  root: string;
  leaves: string[];
  layers: string[][];
  proofs: Map<string, string[]>;
}

export function buildMerkleTree(leaves: string[]): MerkleTreeResult {
  if (leaves.length === 0) {
    return { root: '', leaves: [], layers: [], proofs: new Map() };
  }

  // Ensure even number of leaves (duplicate last if odd)
  const paddedLeaves = [...leaves];
  if (paddedLeaves.length % 2 === 1) {
    paddedLeaves.push(paddedLeaves[paddedLeaves.length - 1]);
  }

  const layers: string[][] = [paddedLeaves];
  let currentLayer = paddedLeaves;

  // Build tree layers
  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = currentLayer[i + 1] || left;
      nextLayer.push(hashPair(left, right));
    }
    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  const root = currentLayer[0];

  // Generate proofs for each leaf
  const proofs = new Map<string, string[]>();
  for (let i = 0; i < leaves.length; i++) {
    proofs.set(leaves[i], generateProof(layers, i));
  }

  return { root, leaves, layers, proofs };
}

function generateProof(layers: string[][], leafIndex: number): string[] {
  const proof: string[] = [];
  let index = leafIndex;

  for (let i = 0; i < layers.length - 1; i++) {
    const layer = layers[i];
    const isLeft = index % 2 === 0;
    const siblingIndex = isLeft ? index + 1 : index - 1;

    if (siblingIndex < layer.length) {
      proof.push(layer[siblingIndex]);
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

export function verifyProof(leaf: string, proof: string[], root: string): boolean {
  let hash = leaf;

  for (const sibling of proof) {
    hash = hashPair(hash, sibling);
  }

  return hash === root;
}

// ============================================
// BATCH CERTIFICATION
// ============================================

let batchCounter = 0;
const batches: Map<number, CertificationBatch> = new Map();

export interface BatchResult {
  batchId: number;
  merkleRoot: string;
  itemCount: number;
  manifests: ContentManifest[];
  proofs: Map<string, MerkleProof>;
}

export function createBatch(): BatchResult | null {
  const manifests = Array.from(certificationQueue.values());
  
  if (manifests.length === 0) {
    return null;
  }

  // Hash each manifest
  const manifestHashes: string[] = [];
  const hashToManifest = new Map<string, ContentManifest>();
  
  for (const manifest of manifests) {
    const hash = hashManifest(manifest);
    manifestHashes.push(hash);
    hashToManifest.set(hash, manifest);
  }

  // Build Merkle tree
  const tree = buildMerkleTree(manifestHashes);
  
  // Create batch record
  const batchId = ++batchCounter;
  const batch: CertificationBatch = {
    batchId,
    merkleRoot: tree.root,
    itemCount: manifests.length,
    network: 'base-sepolia',
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  batches.set(batchId, batch);

  // Store proofs
  const batchProofs = new Map<string, MerkleProof>();
  let index = 0;
  for (const [manifestHash, proof] of tree.proofs.entries()) {
    const merkleProof: MerkleProof = {
      contentHash: hashToManifest.get(manifestHash)?.contentHash || '',
      manifestHash,
      proof,
      batchId,
      index: index++,
    };
    proofStore.set(manifestHash, merkleProof);
    batchProofs.set(manifestHash, merkleProof);
  }

  // Clear the queue
  certificationQueue.clear();

  return {
    batchId,
    merkleRoot: tree.root,
    itemCount: manifests.length,
    manifests,
    proofs: batchProofs,
  };
}

// ============================================
// BATCH MANAGEMENT
// ============================================

export function getBatch(batchId: number): CertificationBatch | undefined {
  return batches.get(batchId);
}

export function getAllBatches(): CertificationBatch[] {
  return Array.from(batches.values());
}

export function updateBatchStatus(
  batchId: number, 
  status: CertificationBatch['status'],
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

export function getProof(manifestHash: string): MerkleProof | undefined {
  return proofStore.get(manifestHash);
}

// ============================================
// AUTO-BATCHING (Timer-based)
// ============================================

let batchTimer: NodeJS.Timeout | null = null;
const BATCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MIN_BATCH_SIZE = 1;

export function startAutoBatching(
  onBatch: (result: BatchResult) => Promise<void>
): void {
  if (batchTimer) return;
  
  batchTimer = setInterval(async () => {
    if (certificationQueue.size >= MIN_BATCH_SIZE) {
      const result = createBatch();
      if (result) {
        console.log(`[Merkle] Auto-batch created: ${result.batchId} with ${result.itemCount} items`);
        await onBatch(result);
      }
    }
  }, BATCH_INTERVAL_MS);
  
  console.log('[Merkle] Auto-batching started (5 min interval)');
}

export function stopAutoBatching(): void {
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
    console.log('[Merkle] Auto-batching stopped');
  }
}

// Export for testing
export { batches };
