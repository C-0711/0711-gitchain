/**
 * Tests for @0711/inject — Core inject() function
 *
 * Covers: inject(), injectBatch(), createInject(),
 * error handling, citation collection, token counting,
 * and integration with mocked resolver/verifier.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

import type { Container } from "../src/types.js";

// ============================================
// MODULE MOCKS (hoisted by ts-jest above imports)
// ============================================

jest.mock("../src/resolver.js", () => ({
  resolveContainers: jest.fn(),
}));

jest.mock("../src/verifier.js", () => ({
  verifyContainers: jest.fn(),
}));

jest.mock("../src/formatter.js", () => ({
  formatContext: jest.fn(),
}));

// Static imports — these receive the mocked versions
import { inject, injectBatch, createInject } from "../src/injector.js";
import { resolveContainers } from "../src/resolver.js";
import { verifyContainers } from "../src/verifier.js";
import { formatContext } from "../src/formatter.js";

// Typed mock references
const mockResolveContainers = resolveContainers as jest.MockedFunction<typeof resolveContainers>;
const mockVerifyContainers = verifyContainers as jest.MockedFunction<typeof verifyContainers>;
const mockFormatContext = formatContext as jest.MockedFunction<typeof formatContext>;

// ============================================
// FIXTURES
// ============================================

function makeContainer(overrides: Partial<Container> = {}): Container {
  return {
    id: "0711:product:bosch:7736606982:v3",
    type: "product",
    namespace: "bosch",
    identifier: "7736606982",
    version: 3,
    meta: {
      name: "CS7001iAW 17 O TH",
      description: "Hybrid Heat Pump",
      createdAt: "2026-01-15T10:00:00Z",
      updatedAt: "2026-02-22T08:30:00Z",
      author: "enrichment-bot",
    },
    data: {
      supplierPid: "7736606982",
    },
    citations: [{ documentId: "bodbsp_123.pdf", page: 3, confidence: "confirmed" as const }],
    chain: {
      network: "base-mainnet",
      batchId: 42,
      txHash: "0x7f3a5b2c",
    },
    ...overrides,
  };
}

// ============================================
// inject()
// ============================================

describe("inject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty result when no containers resolve", async () => {
    mockResolveContainers.mockResolvedValue([]);

    const result = await inject({
      containers: ["0711:product:test:missing:v1"],
      verify: true,
      format: "markdown",
    });

    expect(result.containers).toEqual([]);
    expect(result.citations).toEqual([]);
    expect(result.proofs).toEqual([]);
    expect(result.formatted).toBe("");
    expect(result.tokenCount).toBe(0);
    expect(result.verified).toBe(false);
    expect(result.verifiedAt).toBeDefined();
  });

  it("resolves containers and formats output", async () => {
    const container = makeContainer();
    mockResolveContainers.mockResolvedValue([container]);
    mockVerifyContainers.mockResolvedValue({
      proofs: [{ containerId: container.id, verified: true }],
      allVerified: true,
    });
    mockFormatContext.mockReturnValue("# Verified Context\n\n## CS7001iAW");

    const result = await inject({
      containers: [container.id],
      verify: true,
      format: "markdown",
      includeCitations: true,
    });

    expect(result.containers).toHaveLength(1);
    expect(result.containers[0].id).toBe(container.id);
    expect(result.verified).toBe(true);
    expect(result.formatted).toContain("Verified Context");
    expect(result.tokenCount).toBeGreaterThan(0);
  });

  it("collects citations from containers", async () => {
    const container = makeContainer({
      citations: [
        { documentId: "doc1.pdf", page: 1, confidence: "confirmed" as const },
        { documentId: "doc2.pdf", page: 5, confidence: "likely" as const },
      ],
    });

    mockResolveContainers.mockResolvedValue([container]);
    mockVerifyContainers.mockResolvedValue({
      proofs: [],
      allVerified: true,
    });
    mockFormatContext.mockReturnValue("formatted output");

    const result = await inject({
      containers: [container.id],
      verify: true,
      includeCitations: true,
    });

    expect(result.citations).toHaveLength(2);
    expect(result.citations[0].containerId).toBe(container.id);
    expect(result.citations[0].documentId).toBe("doc1.pdf");
    expect(result.citations[1].documentId).toBe("doc2.pdf");
  });

  it("excludes citations when includeCitations is false", async () => {
    const container = makeContainer();
    mockResolveContainers.mockResolvedValue([container]);
    mockVerifyContainers.mockResolvedValue({
      proofs: [],
      allVerified: true,
    });
    mockFormatContext.mockReturnValue("output");

    const result = await inject({
      containers: [container.id],
      verify: true,
      includeCitations: false,
    });

    expect(result.citations).toEqual([]);
  });

  it("skips verification when verify is false", async () => {
    const container = makeContainer();
    mockResolveContainers.mockResolvedValue([container]);
    mockFormatContext.mockReturnValue("output");

    const result = await inject({
      containers: [container.id],
      verify: false,
    });

    expect(mockVerifyContainers).not.toHaveBeenCalled();
    expect(result.verified).toBe(false);
    expect(result.proofs).toEqual([]);
  });

  it("defaults verify to true", async () => {
    const container = makeContainer();
    mockResolveContainers.mockResolvedValue([container]);
    mockVerifyContainers.mockResolvedValue({
      proofs: [{ containerId: container.id, verified: true }],
      allVerified: true,
    });
    mockFormatContext.mockReturnValue("output");

    await inject({
      containers: [container.id],
    });

    expect(mockVerifyContainers).toHaveBeenCalledWith([container]);
  });

  it("passes maxTokens to formatter", async () => {
    const container = makeContainer();
    mockResolveContainers.mockResolvedValue([container]);
    mockVerifyContainers.mockResolvedValue({
      proofs: [],
      allVerified: true,
    });
    mockFormatContext.mockReturnValue("short");

    await inject({
      containers: [container.id],
      maxTokens: 500,
    });

    expect(mockFormatContext).toHaveBeenCalledWith(
      [container],
      expect.objectContaining({ maxTokens: 500 })
    );
  });

  it("estimates token count as ceil(length/4)", async () => {
    const container = makeContainer();
    mockResolveContainers.mockResolvedValue([container]);
    mockVerifyContainers.mockResolvedValue({
      proofs: [],
      allVerified: true,
    });
    // 20 chars -> ceil(20/4) = 5 tokens
    mockFormatContext.mockReturnValue("12345678901234567890");

    const result = await inject({
      containers: [container.id],
    });

    expect(result.tokenCount).toBe(5);
  });

  it("handles containers without citations gracefully", async () => {
    const container = makeContainer({ citations: undefined });
    mockResolveContainers.mockResolvedValue([container]);
    mockVerifyContainers.mockResolvedValue({
      proofs: [],
      allVerified: true,
    });
    mockFormatContext.mockReturnValue("output");

    const result = await inject({
      containers: [container.id],
      includeCitations: true,
    });

    expect(result.citations).toEqual([]);
  });

  it("passes resolveLatest flag when container IDs contain :latest", async () => {
    mockResolveContainers.mockResolvedValue([]);

    await inject({
      containers: ["0711:product:bosch:123:latest"],
    });

    expect(mockResolveContainers).toHaveBeenCalledWith(
      ["0711:product:bosch:123:latest"],
      expect.objectContaining({ resolveLatest: true })
    );
  });

  it("sets resolveLatest false when no :latest IDs", async () => {
    mockResolveContainers.mockResolvedValue([]);

    await inject({
      containers: ["0711:product:bosch:123:v3"],
    });

    expect(mockResolveContainers).toHaveBeenCalledWith(
      ["0711:product:bosch:123:v3"],
      expect.objectContaining({ resolveLatest: false })
    );
  });
});

// ============================================
// injectBatch()
// ============================================

describe("injectBatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("processes multiple option sets in parallel", async () => {
    mockResolveContainers.mockResolvedValue([]);

    const results = await injectBatch([
      { containers: ["0711:product:a:1:v1"] },
      { containers: ["0711:product:b:2:v1"] },
      { containers: ["0711:product:c:3:v1"] },
    ]);

    expect(results).toHaveLength(3);
    expect(mockResolveContainers).toHaveBeenCalledTimes(3);
  });

  it("returns empty array for empty input", async () => {
    const results = await injectBatch([]);
    expect(results).toEqual([]);
  });

  it("each result has the correct structure", async () => {
    mockResolveContainers.mockResolvedValue([]);

    const results = await injectBatch([{ containers: ["0711:product:test:1:v1"] }]);

    expect(results[0]).toHaveProperty("containers");
    expect(results[0]).toHaveProperty("citations");
    expect(results[0]).toHaveProperty("proofs");
    expect(results[0]).toHaveProperty("formatted");
    expect(results[0]).toHaveProperty("tokenCount");
    expect(results[0]).toHaveProperty("verified");
    expect(results[0]).toHaveProperty("verifiedAt");
  });
});

// ============================================
// createInject()
// ============================================

describe("createInject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a bound inject with default options", async () => {
    mockResolveContainers.mockResolvedValue([]);

    const myInject = createInject({
      verify: false,
      format: "json",
      includeCitations: false,
    });

    await myInject({
      containers: ["0711:product:test:1:v1"],
    });

    // verify should not be called because the default is verify: false
    expect(mockVerifyContainers).not.toHaveBeenCalled();
  });

  it("allows overriding defaults per call", async () => {
    const container = makeContainer();
    mockResolveContainers.mockResolvedValue([container]);
    mockVerifyContainers.mockResolvedValue({
      proofs: [{ containerId: container.id, verified: true }],
      allVerified: true,
    });
    mockFormatContext.mockReturnValue("output");

    const myInject = createInject({
      verify: false,
    });

    // Override verify to true
    await myInject({
      containers: [container.id],
      verify: true,
    });

    expect(mockVerifyContainers).toHaveBeenCalled();
  });
});
