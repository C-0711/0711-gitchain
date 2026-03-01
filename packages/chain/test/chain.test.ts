/**
 * Tests for @0711/chain — Merkle Tree Engine
 *
 * Covers: hashing, tree construction, proof generation/verification,
 * batch creation, and edge cases.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

import {
  hashContent,
  buildMerkleTree,
  generateProof,
  verifyProof,
  verifyProofWithIndex,
  createBatch,
  getBatchLocal,
  getAllBatches,
  updateBatchStatus,
  getProofByHash,
  batches,
  proofStore,
} from "../src/merkle.js";

// ============================================
// HELPERS
// ============================================

function clearGlobalState() {
  batches.clear();
  proofStore.clear();
}

// ============================================
// hashContent
// ============================================

describe("hashContent", () => {
  it("produces a deterministic keccak256 hash", () => {
    const data = { name: "Widget", price: 42 };
    const hash1 = hashContent(data);
    const hash2 = hashContent(data);
    expect(hash1).toBe(hash2);
  });

  it("returns a 0x-prefixed hex string of 66 chars", () => {
    const hash = hashContent({ foo: "bar" });
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("sorts object keys for deterministic output", () => {
    const a = hashContent({ z: 1, a: 2 });
    const b = hashContent({ a: 2, z: 1 });
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    const h1 = hashContent({ value: "alpha" });
    const h2 = hashContent({ value: "beta" });
    expect(h1).not.toBe(h2);
  });

  it("hashes nested objects deterministically", () => {
    const data = { outer: { inner: "value" }, list: [1, 2, 3] };
    const hash1 = hashContent(data);
    const hash2 = hashContent(data);
    expect(hash1).toBe(hash2);
  });
});

// ============================================
// buildMerkleTree
// ============================================

describe("buildMerkleTree", () => {
  it("throws on empty input", () => {
    expect(() => buildMerkleTree([])).toThrow("Cannot build Merkle tree from empty array");
  });

  it("builds a tree with a single leaf", () => {
    const hash = hashContent({ id: 1 });
    const tree = buildMerkleTree([hash]);

    expect(tree.root).toBe(hash);
    expect(tree.leaves).toEqual([hash]);
    expect(tree.tree).toHaveLength(1); // Only the leaf level
  });

  it("builds a tree with two leaves", () => {
    const h1 = hashContent({ id: 1 });
    const h2 = hashContent({ id: 2 });
    const tree = buildMerkleTree([h1, h2]);

    expect(tree.leaves).toHaveLength(2);
    expect(tree.tree).toHaveLength(2); // leaves + root
    expect(tree.root).toBeDefined();
    expect(tree.root).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("builds a tree with three leaves (odd count)", () => {
    const h1 = hashContent({ id: 1 });
    const h2 = hashContent({ id: 2 });
    const h3 = hashContent({ id: 3 });
    const tree = buildMerkleTree([h1, h2, h3]);

    expect(tree.leaves).toHaveLength(3);
    // 3 leaves -> 2 nodes -> 1 root => 3 levels
    expect(tree.tree.length).toBeGreaterThanOrEqual(2);
    expect(tree.root).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("builds a tree with four leaves (power of 2)", () => {
    const hashes = [1, 2, 3, 4].map((n) => hashContent({ id: n }));
    const tree = buildMerkleTree(hashes);

    expect(tree.leaves).toHaveLength(4);
    // 4 -> 2 -> 1 => 3 levels
    expect(tree.tree).toHaveLength(3);
    expect(tree.root).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("sorts leaves for deterministic tree regardless of input order", () => {
    const h1 = hashContent({ id: "alpha" });
    const h2 = hashContent({ id: "beta" });
    const h3 = hashContent({ id: "gamma" });

    const tree1 = buildMerkleTree([h1, h2, h3]);
    const tree2 = buildMerkleTree([h3, h1, h2]);
    const tree3 = buildMerkleTree([h2, h3, h1]);

    expect(tree1.root).toBe(tree2.root);
    expect(tree2.root).toBe(tree3.root);
    expect(tree1.leaves).toEqual(tree2.leaves);
  });

  it("produces different roots for different input sets", () => {
    const tree1 = buildMerkleTree([hashContent({ a: 1 })]);
    const tree2 = buildMerkleTree([hashContent({ a: 2 })]);

    expect(tree1.root).not.toBe(tree2.root);
  });
});

// ============================================
// generateProof / verifyProof
// ============================================

describe("generateProof", () => {
  it("throws if leaf is not in tree", () => {
    const tree = buildMerkleTree([hashContent({ id: 1 })]);
    const missingLeaf = hashContent({ id: 999 });

    expect(() => generateProof(tree, missingLeaf)).toThrow("Leaf not found in tree");
  });

  it("generates a proof for a leaf in a single-leaf tree", () => {
    const hash = hashContent({ id: 1 });
    const tree = buildMerkleTree([hash]);
    const proof = generateProof(tree, hash);

    expect(proof.leaf).toBe(hash);
    expect(proof.proof).toHaveLength(0); // Single leaf, no siblings
    expect(proof.index).toBe(0);
  });

  it("generates a proof for each leaf in a multi-leaf tree", () => {
    const hashes = [1, 2, 3, 4].map((n) => hashContent({ id: n }));
    const tree = buildMerkleTree(hashes);

    for (const leafHash of tree.leaves) {
      const proof = generateProof(tree, leafHash);
      expect(proof.leaf).toBe(leafHash);
      expect(proof.proof.length).toBeGreaterThan(0);
      expect(typeof proof.index).toBe("number");
    }
  });
});

describe("verifyProof", () => {
  it("verifies a valid proof against the root", () => {
    const hashes = [1, 2, 3, 4].map((n) => hashContent({ id: n }));
    const tree = buildMerkleTree(hashes);

    for (const leafHash of tree.leaves) {
      const proof = generateProof(tree, leafHash);
      const valid = verifyProof(tree.root, proof.leaf, proof.proof);
      expect(valid).toBe(true);
    }
  });

  it("rejects a proof against the wrong root", () => {
    const hashes = [1, 2, 3].map((n) => hashContent({ id: n }));
    const tree = buildMerkleTree(hashes);
    const proof = generateProof(tree, tree.leaves[0]);

    const fakeRoot = hashContent({ fake: true });
    expect(verifyProof(fakeRoot, proof.leaf, proof.proof)).toBe(false);
  });

  it("rejects a proof with a tampered leaf", () => {
    const hashes = [1, 2, 3, 4].map((n) => hashContent({ id: n }));
    const tree = buildMerkleTree(hashes);
    const proof = generateProof(tree, tree.leaves[0]);

    const tamperedLeaf = hashContent({ tampered: true });
    expect(verifyProof(tree.root, tamperedLeaf, proof.proof)).toBe(false);
  });

  it("rejects a proof with a tampered sibling", () => {
    const hashes = [1, 2, 3, 4].map((n) => hashContent({ id: n }));
    const tree = buildMerkleTree(hashes);
    const proof = generateProof(tree, tree.leaves[0]);

    const tamperedProof = [...proof.proof];
    tamperedProof[0] = hashContent({ tampered: true });
    expect(verifyProof(tree.root, proof.leaf, tamperedProof)).toBe(false);
  });

  it("verifies a single-leaf tree (empty proof)", () => {
    const hash = hashContent({ solo: true });
    const tree = buildMerkleTree([hash]);
    const proof = generateProof(tree, hash);

    expect(verifyProof(tree.root, proof.leaf, proof.proof)).toBe(true);
  });

  it("verifies a large tree (16 leaves)", () => {
    const hashes = Array.from({ length: 16 }, (_, i) => hashContent({ id: i }));
    const tree = buildMerkleTree(hashes);

    for (const leafHash of tree.leaves) {
      const proof = generateProof(tree, leafHash);
      expect(verifyProof(tree.root, proof.leaf, proof.proof)).toBe(true);
    }
  });
});

describe("verifyProofWithIndex", () => {
  it("delegates to verifyProof (legacy API)", () => {
    const hashes = [1, 2].map((n) => hashContent({ id: n }));
    const tree = buildMerkleTree(hashes);
    const proof = generateProof(tree, tree.leaves[0]);

    expect(verifyProofWithIndex(tree.root, proof.leaf, proof.proof, proof.index)).toBe(true);
  });
});

// ============================================
// createBatch / batch management
// ============================================

describe("createBatch", () => {
  beforeEach(() => {
    clearGlobalState();
  });

  it("returns null for empty items array", () => {
    const result = createBatch([]);
    expect(result).toBeNull();
  });

  it("creates a batch with a single item", () => {
    const items = [
      {
        id: "container-1",
        contentHash: hashContent({ product: "widget" }),
        data: { product: "widget" },
      },
    ];

    const result = createBatch(items);

    expect(result).not.toBeNull();
    expect(result!.batchId).toBeGreaterThan(0);
    expect(result!.merkleRoot).toMatch(/^0x[0-9a-f]{64}$/);
    expect(result!.itemCount).toBe(1);
    expect(result!.contentHashes).toHaveLength(1);
    expect(result!.proofs.size).toBe(1);
    expect(result!.proofs.has("container-1")).toBe(true);
  });

  it("creates a batch with multiple items", () => {
    const items = [
      {
        id: "c-1",
        contentHash: hashContent({ a: 1 }),
        data: { a: 1 },
      },
      {
        id: "c-2",
        contentHash: hashContent({ b: 2 }),
        data: { b: 2 },
      },
      {
        id: "c-3",
        contentHash: hashContent({ c: 3 }),
        data: { c: 3 },
      },
    ];

    const result = createBatch(items);

    expect(result).not.toBeNull();
    expect(result!.itemCount).toBe(3);
    expect(result!.contentHashes).toHaveLength(3);
    expect(result!.proofs.size).toBe(3);
  });

  it("stores proofs that verify against the batch root", () => {
    const items = [
      {
        id: "c-1",
        contentHash: hashContent({ x: 10 }),
        data: { x: 10 },
      },
      {
        id: "c-2",
        contentHash: hashContent({ x: 20 }),
        data: { x: 20 },
      },
    ];

    const result = createBatch(items)!;

    for (const [, proof] of result.proofs) {
      const valid = verifyProof(result.merkleRoot, proof.leaf, proof.proof);
      expect(valid).toBe(true);
    }
  });

  it("increments batch IDs across calls", () => {
    const item = (id: string) => ({
      id,
      contentHash: hashContent({ id }),
      data: { id },
    });

    const r1 = createBatch([item("a")])!;
    const r2 = createBatch([item("b")])!;
    const r3 = createBatch([item("c")])!;

    expect(r2.batchId).toBe(r1.batchId + 1);
    expect(r3.batchId).toBe(r2.batchId + 1);
  });
});

describe("batch accessors", () => {
  beforeEach(() => {
    clearGlobalState();
  });

  it("getBatchLocal returns undefined for non-existent batch", () => {
    expect(getBatchLocal(9999)).toBeUndefined();
  });

  it("getBatchLocal retrieves a created batch", () => {
    const result = createBatch([
      {
        id: "test",
        contentHash: hashContent({ test: true }),
        data: { test: true },
      },
    ])!;

    const batch = getBatchLocal(result.batchId);
    expect(batch).toBeDefined();
    expect(batch!.merkleRoot).toBe(result.merkleRoot);
    expect(batch!.itemCount).toBe(1);
    expect(batch!.status).toBe("pending");
    expect(batch!.network).toBe("base-mainnet");
  });

  it("getAllBatches returns all created batches", () => {
    const item = (id: string) => ({
      id,
      contentHash: hashContent({ id }),
      data: { id },
    });

    createBatch([item("a")]);
    createBatch([item("b")]);

    const all = getAllBatches();
    expect(all).toHaveLength(2);
  });

  it("updateBatchStatus modifies batch status and optional fields", () => {
    const result = createBatch([
      {
        id: "test",
        contentHash: hashContent({ val: 1 }),
        data: { val: 1 },
      },
    ])!;

    updateBatchStatus(result.batchId, "confirmed", "0xabc123", 12345, "QmSomeIpfsCid");

    const batch = getBatchLocal(result.batchId)!;
    expect(batch.status).toBe("confirmed");
    expect(batch.txHash).toBe("0xabc123");
    expect(batch.blockNumber).toBe(12345);
    expect(batch.ipfsCid).toBe("QmSomeIpfsCid");
  });

  it("updateBatchStatus is a no-op for non-existent batch", () => {
    // Should not throw
    updateBatchStatus(9999, "failed");
    expect(getBatchLocal(9999)).toBeUndefined();
  });

  it("getProofByHash retrieves stored proof by content hash", () => {
    const contentHash = hashContent({ product: "pump" });
    createBatch([
      {
        id: "pump-1",
        contentHash,
        data: { product: "pump" },
      },
    ]);

    const proof = getProofByHash(contentHash);
    expect(proof).toBeDefined();
    expect(proof!.contentHash).toBe(contentHash);
    expect(proof!.proof).toBeInstanceOf(Array);
  });

  it("getProofByHash returns undefined for unknown hash", () => {
    expect(getProofByHash("0x0000")).toBeUndefined();
  });
});
