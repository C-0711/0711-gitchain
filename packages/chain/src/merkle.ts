/**
 * Merkle tree implementation for content batching
 */

import { ethers } from "ethers";

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
  merkleRoot: string;
  contentHashes: string[];
  proofs: Map<string, MerkleProof>;
  metadataUri: string;
}

/**
 * Hash content to create a leaf
 */
export function hashContent(content: unknown): string {
  const json = JSON.stringify(content, Object.keys(content as object).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(json));
}

/**
 * Build a Merkle tree from content hashes
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
      
      const combined = left < right
        ? ethers.keccak256(ethers.concat([left, right]))
        : ethers.keccak256(ethers.concat([right, left]));
      
      nextLevel.push(combined);
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
 * Generate Merkle proof for a specific leaf
 */
export function generateProof(tree: MerkleTreeResult, leafHash: string): MerkleProof {
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
 * Verify a Merkle proof
 */
export function verifyProof(
  root: string,
  leaf: string,
  proof: string[],
  index: number
): boolean {
  let hash = leaf;
  let currentIndex = index;

  for (const sibling of proof) {
    const isRightNode = currentIndex % 2 === 1;
    
    hash = isRightNode
      ? ethers.keccak256(ethers.concat([sibling, hash]))
      : ethers.keccak256(ethers.concat([hash, sibling]));
    
    currentIndex = Math.floor(currentIndex / 2);
  }

  return hash === root;
}

/**
 * Create a batch from containers
 */
export function createBatch(
  containers: { id: string; data: unknown }[],
  metadataUri: string
): BatchResult {
  const contentHashes = containers.map((c) => hashContent(c.data));
  const tree = buildMerkleTree(contentHashes);

  const proofs = new Map<string, MerkleProof>();
  for (let i = 0; i < containers.length; i++) {
    proofs.set(containers[i].id, generateProof(tree, contentHashes[i]));
  }

  return {
    merkleRoot: tree.root,
    contentHashes,
    proofs,
    metadataUri,
  };
}
