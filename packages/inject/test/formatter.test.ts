/**
 * Tests for context formatter
 */

import { describe, it, expect } from "@jest/globals";
import { formatContext } from "../src/formatter.js";
import type { Container } from "../src/types.js";

const mockContainer: Container = {
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
    features: [
      { code: "EF000008", name: "Breite", value: "1122", unit: "mm" },
    ],
  },
  citations: [
    { documentId: "bodbsp_123.pdf", page: 3, confidence: "confirmed" },
  ],
  chain: {
    network: "base-mainnet",
    batchId: 42,
    txHash: "0x7f3a5b2c...",
  },
};

describe("formatContext", () => {
  it("formats as markdown", () => {
    const output = formatContext([mockContainer], {
      format: "markdown",
      includeCitations: true,
      includeProofs: true,
    });

    expect(output).toContain("# Verified Context");
    expect(output).toContain("CS7001iAW 17 O TH");
    expect(output).toContain("bodbsp_123.pdf");
    expect(output).toContain("base-mainnet");
  });

  it("formats as JSON", () => {
    const output = formatContext([mockContainer], {
      format: "json",
      includeCitations: true,
      includeProofs: true,
    });

    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("0711:product:bosch:7736606982:v3");
  });

  it("respects maxTokens", () => {
    const output = formatContext([mockContainer], {
      format: "markdown",
      includeCitations: true,
      includeProofs: true,
      maxTokens: 10,  // Very small limit
    });

    expect(output).toContain("[...truncated]");
  });

  it("excludes citations when disabled", () => {
    const output = formatContext([mockContainer], {
      format: "markdown",
      includeCitations: false,
      includeProofs: false,
    });

    expect(output).not.toContain("bodbsp_123.pdf");
    expect(output).not.toContain("base-mainnet");
  });
});
