/**
 * Tests for container ID utilities
 */

import { describe, it, expect } from "@jest/globals";
import {
  parseContainerId,
  buildContainerId,
  isValidContainerId,
  toLatestId,
} from "../src/id.js";

describe("parseContainerId", () => {
  it("parses valid product container ID", () => {
    const result = parseContainerId("0711:product:bosch:7736606982:v3");
    expect(result).toEqual({
      type: "product",
      namespace: "bosch",
      identifier: "7736606982",
      version: 3,
    });
  });

  it("parses latest version", () => {
    const result = parseContainerId("0711:product:bosch:7736606982:latest");
    expect(result.version).toBe("latest");
  });

  it("throws on invalid format", () => {
    expect(() => parseContainerId("invalid")).toThrow();
    expect(() => parseContainerId("0711:product")).toThrow();
  });
});

describe("buildContainerId", () => {
  it("builds versioned ID", () => {
    const id = buildContainerId("product", "bosch", "7736606982", 3);
    expect(id).toBe("0711:product:bosch:7736606982:v3");
  });

  it("builds latest ID by default", () => {
    const id = buildContainerId("product", "bosch", "7736606982");
    expect(id).toBe("0711:product:bosch:7736606982:latest");
  });
});

describe("isValidContainerId", () => {
  it("validates correct IDs", () => {
    expect(isValidContainerId("0711:product:bosch:7736606982:v3")).toBe(true);
    expect(isValidContainerId("0711:campaign:0711:q1-launch:latest")).toBe(true);
    expect(isValidContainerId("0711:knowledge:etim:EC012034:v1")).toBe(true);
  });

  it("rejects invalid IDs", () => {
    expect(isValidContainerId("invalid")).toBe(false);
    expect(isValidContainerId("0711:invalid-type:ns:id:v1")).toBe(false);
  });
});

describe("toLatestId", () => {
  it("converts versioned to latest", () => {
    const latest = toLatestId("0711:product:bosch:7736606982:v3");
    expect(latest).toBe("0711:product:bosch:7736606982:latest");
  });
});
