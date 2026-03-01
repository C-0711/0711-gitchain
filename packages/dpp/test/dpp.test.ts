/**
 * Tests for @0711/dpp - Digital Product Passport
 */

import type { Container } from "@0711/core";
import { describe, it, expect, beforeEach } from "@jest/globals";

import { DPPService, computeContentHash, computeMerkleRoot } from "../src/index.js";
import type { ProductPassport } from "../src/index.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeContainer(overrides: Partial<Container> = {}): Container {
  return {
    id: "0711:product:bosch:7736606982:v1",
    type: "product",
    namespace: "bosch",
    identifier: "7736606982",
    version: 1,
    meta: {
      name: "Compress 7000i AW 7 OR-S",
      description: "Air-to-water heat pump",
      createdAt: "2025-01-15T10:00:00.000Z",
      updatedAt: "2025-06-01T12:00:00.000Z",
      author: "bombas@0711.io",
      tags: ["heat-pump", "compress"],
    },
    data: {
      manufacturer: "Bosch Thermotechnik",
      model: "CS7000iAW 7 OR-S",
      serialNumber: "SN-20250115-001",
      gtin: "4057749751522",
      category: "Heat Pumps",
      features: [
        { code: "EF000007", name: "Nominal power", value: "7", unit: "kW" },
        { code: "EF000100", name: "Voltage", value: "230", unit: "V" },
      ],
    },
    media: [
      {
        type: "document" as const,
        name: "datasheet.pdf",
        url: "https://example.com/datasheet.pdf",
        hash: "abc123",
      },
      {
        type: "image" as const,
        name: "product-image.jpg",
        url: "https://example.com/product.jpg",
      },
    ],
    chain: {
      network: "base-mainnet",
      contractAddress: "0x1234567890abcdef",
      batchId: 42,
      merkleRoot: "abcdef1234567890",
      merkleProof: [],
      txHash: "0xdeadbeef",
      blockNumber: 1000,
      timestamp: "2025-06-01T12:00:00.000Z",
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DPPService", () => {
  let service: DPPService;

  beforeEach(() => {
    service = new DPPService({
      baseUrl: "https://dpp.test.0711.io",
      issuer: { name: "Test", id: "test.0711.io" },
    });
  });

  // =========================================================================
  // Passport creation
  // =========================================================================

  describe("createPassport", () => {
    it("creates a passport from container data", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      expect(passport.id).toBe("dpp-0711-product-bosch-7736606982-v1");
      expect(passport.containerId).toBe(container.id);
      expect(passport.product.name).toBe("Compress 7000i AW 7 OR-S");
      expect(passport.product.manufacturer).toBe("Bosch Thermotechnik");
      expect(passport.product.model).toBe("CS7000iAW 7 OR-S");
      expect(passport.product.serialNumber).toBe("SN-20250115-001");
      expect(passport.product.gtin).toBe("4057749751522");
      expect(passport.product.category).toBe("Heat Pumps");
    });

    it("populates specifications from features", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      expect(passport.specifications["Nominal power"]).toBe("7 kW");
      expect(passport.specifications["Voltage"]).toBe("230 V");
    });

    it("extracts documents from media", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      expect(passport.documents).toHaveLength(2);
      expect(passport.documents![0].name).toBe("datasheet.pdf");
      expect(passport.documents![0].hash).toBe("abc123");
      expect(passport.documents![1].name).toBe("product-image.jpg");
    });

    it("includes verification metadata", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      expect(passport.verification.chainId).toBe("base-mainnet");
      expect(passport.verification.batchId).toBe(42);
      expect(passport.verification.txHash).toBe("0xdeadbeef");
      expect(passport.verification.timestamp).toBeDefined();
    });

    it("computes a non-empty merkle root", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      expect(passport.verification.merkleRoot).toMatch(/^[0-9a-f]{64}$/);
    });

    it("computes a non-empty content hash", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      expect(passport.verification.contentHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("uses defaults when container has no chain info", async () => {
      const container = makeContainer({ chain: undefined });
      const passport = await service.createPassport(container);

      expect(passport.verification.chainId).toBe("pending");
      expect(passport.verification.batchId).toBe(0);
      expect(passport.verification.txHash).toBeUndefined();
    });

    it("uses namespace/identifier as fallbacks for manufacturer/model", async () => {
      const container = makeContainer({
        data: {}, // no manufacturer or model in data
      });
      const passport = await service.createPassport(container);

      expect(passport.product.manufacturer).toBe("bosch");
      expect(passport.product.model).toBe("7736606982");
    });
  });

  // =========================================================================
  // Passport verification
  // =========================================================================

  describe("verifyPassport", () => {
    it("verifies a valid passport", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);
      const result = await service.verifyPassport(passport);

      expect(result.valid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.contentHashMatch).toBe(true);
      expect(result.timestampValid).toBe(true);
      expect(result.merkleRootValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects tampered product name", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      // Tamper with the product name
      passport.product.name = "TAMPERED NAME";

      const result = await service.verifyPassport(passport);

      expect(result.valid).toBe(false);
      expect(result.status).toBe("invalid");
      expect(result.contentHashMatch).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("Content hash mismatch"))).toBe(true);
    });

    it("detects tampered specifications", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      // Tamper with specifications
      passport.specifications["Nominal power"] = "999 MW";

      const result = await service.verifyPassport(passport);

      expect(result.valid).toBe(false);
      expect(result.contentHashMatch).toBe(false);
    });

    it("detects tampered content hash", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      // Set a wrong content hash
      passport.verification.contentHash =
        "0000000000000000000000000000000000000000000000000000000000000000";

      const result = await service.verifyPassport(passport);

      expect(result.valid).toBe(false);
      expect(result.contentHashMatch).toBe(false);
    });

    it("reports expired passports", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      // Set timestamp to 2 years ago
      const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
      passport.verification.timestamp = twoYearsAgo.toISOString();

      // Recompute the content hash so hash check passes
      // (we only want to test expiry, not hash mismatch)
      // Actually, timestamp is not part of contentHash, so no need to recompute.

      const result = await service.verifyPassport(passport);

      expect(result.status).toBe("expired");
      expect(result.errors.some((e) => e.includes("expired"))).toBe(true);
    });

    it("reports future timestamps as invalid", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      // Set timestamp 1 hour in the future (well beyond 60s skew allowance)
      const futureDate = new Date(Date.now() + 3600_000);
      passport.verification.timestamp = futureDate.toISOString();

      const result = await service.verifyPassport(passport);

      expect(result.valid).toBe(false);
      expect(result.timestampValid).toBe(false);
      expect(result.errors.some((e) => e.includes("future"))).toBe(true);
    });

    it("reports invalid merkle root", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      // Corrupt the merkle root
      passport.verification.merkleRoot = "not-a-valid-hex";

      const result = await service.verifyPassport(passport);

      expect(result.valid).toBe(false);
      expect(result.merkleRootValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Merkle root"))).toBe(true);
    });

    it("reports empty merkle root as invalid", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      passport.verification.merkleRoot = "";

      const result = await service.verifyPassport(passport);

      expect(result.merkleRootValid).toBe(false);
    });

    it("includes chain verification info", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      const result = await service.verifyPassport(passport);

      expect(result.chain.network).toBe("base-mainnet");
      expect(result.chain.txHash).toBe("0xdeadbeef");
      expect(result.chain.verified).toBe(true);
    });

    it("reports chain as unverified when no txHash", async () => {
      const container = makeContainer({ chain: undefined });
      const passport = await service.createPassport(container);

      const result = await service.verifyPassport(passport);

      expect(result.chain.verified).toBe(false);
    });

    it("accepts custom maxAgeMs parameter", async () => {
      const container = makeContainer();
      const passport = await service.createPassport(container);

      // Set timestamp to 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      passport.verification.timestamp = twoHoursAgo.toISOString();

      // With 1-hour max age, should be expired
      const resultExpired = await service.verifyPassport(passport, 60 * 60 * 1000);
      expect(resultExpired.status).toBe("expired");

      // With 3-hour max age, should be valid
      const resultValid = await service.verifyPassport(passport, 3 * 60 * 60 * 1000);
      expect(resultValid.status).toBe("valid");
    });
  });

  // =========================================================================
  // QR Code generation
  // =========================================================================

  describe("generateQRCode", () => {
    it("produces valid SVG", async () => {
      const svg = await service.generateQRCode("dpp-test-123");

      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it("embeds the passport URL in the SVG", async () => {
      const svg = await service.generateQRCode("dpp-test-123");

      expect(svg).toContain("dpp.test.0711.io/dpp-test-123");
    });

    it("contains QR-like rect elements", async () => {
      const svg = await service.generateQRCode("dpp-test-123");

      // Should contain dark modules (rect elements)
      expect(svg).toContain("<rect");
      // Should have multiple rects (finder patterns alone produce many)
      const rectCount = (svg.match(/<rect /g) || []).length;
      expect(rectCount).toBeGreaterThan(50);
    });

    it("produces different patterns for different passport IDs", async () => {
      const svg1 = await service.generateQRCode("dpp-product-a");
      const svg2 = await service.generateQRCode("dpp-product-b");

      // The SVGs should be different since they encode different URLs
      expect(svg1).not.toEqual(svg2);
    });

    it("is deterministic for the same passport ID", async () => {
      const svg1 = await service.generateQRCode("dpp-determinism-test");
      const svg2 = await service.generateQRCode("dpp-determinism-test");

      expect(svg1).toEqual(svg2);
    });
  });

  // =========================================================================
  // Passport URL
  // =========================================================================

  describe("getPassportUrl", () => {
    it("generates the correct URL", () => {
      const url = service.getPassportUrl("dpp-test-id");
      expect(url).toBe("https://dpp.test.0711.io/dpp-test-id");
    });
  });
});

// ===========================================================================
// Standalone crypto function tests
// ===========================================================================

describe("computeContentHash", () => {
  it("produces a 64-char hex string", async () => {
    const service = new DPPService();
    const passport = await service.createPassport(makeContainer());

    const hash = computeContentHash(passport);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", async () => {
    const service = new DPPService();
    const passport = await service.createPassport(makeContainer());

    const hash1 = computeContentHash(passport);
    const hash2 = computeContentHash(passport);
    expect(hash1).toBe(hash2);
  });

  it("changes when passport data changes", async () => {
    const service = new DPPService();
    const passport1 = await service.createPassport(makeContainer());
    const hash1 = computeContentHash(passport1);

    const passport2 = await service.createPassport(
      makeContainer({
        meta: {
          ...makeContainer().meta,
          name: "Different Product Name",
        },
      })
    );
    const hash2 = computeContentHash(passport2);

    expect(hash1).not.toBe(hash2);
  });
});

describe("computeMerkleRoot", () => {
  it("returns a 64-char hex string for non-empty input", () => {
    const root = computeMerkleRoot(["leaf1", "leaf2", "leaf3"]);
    expect(root).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns a hash for empty input", () => {
    const root = computeMerkleRoot([]);
    expect(root).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    const items = ["alpha", "beta", "gamma", "delta"];
    const root1 = computeMerkleRoot(items);
    const root2 = computeMerkleRoot(items);
    expect(root1).toBe(root2);
  });

  it("produces different roots for different data", () => {
    const root1 = computeMerkleRoot(["a", "b", "c"]);
    const root2 = computeMerkleRoot(["x", "y", "z"]);
    expect(root1).not.toBe(root2);
  });

  it("handles a single leaf", () => {
    const root = computeMerkleRoot(["single-leaf"]);
    expect(root).toMatch(/^[0-9a-f]{64}$/);
  });

  it("handles odd number of leaves (duplicates last)", () => {
    const root3 = computeMerkleRoot(["a", "b", "c"]);
    const root4 = computeMerkleRoot(["a", "b", "c", "d"]);
    // They should be different since the tree structures differ
    expect(root3).not.toBe(root4);
  });

  it("is order-dependent", () => {
    const root1 = computeMerkleRoot(["a", "b", "c"]);
    const root2 = computeMerkleRoot(["c", "b", "a"]);
    expect(root1).not.toBe(root2);
  });
});
