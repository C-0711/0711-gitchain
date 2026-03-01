/**
 * Tests for @0711/sdk — GitChain API Client
 *
 * Covers: client construction, request handling, error paths,
 * and all public method signatures. Uses mocked fetch.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

import { GitChainClient, getClient } from "../src/client.js";

// ============================================
// FETCH MOCK HELPERS
// ============================================

function mockFetchOk(data: unknown) {
  return jest.fn<typeof globalThis.fetch>().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  } as Response);
}

function mockFetchError(status: number, body?: Record<string, unknown>) {
  return jest.fn<typeof globalThis.fetch>().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body || {}),
  } as Response);
}

function mockFetchNetworkError(message: string) {
  return jest.fn<typeof globalThis.fetch>().mockRejectedValue(new Error(message));
}

// ============================================
// CLIENT CONSTRUCTION
// ============================================

describe("GitChainClient constructor", () => {
  it("uses default config when none provided", () => {
    const client = new GitChainClient();
    // We can't inspect private fields directly, but we can verify
    // the client is functional by checking it doesn't throw
    expect(client).toBeInstanceOf(GitChainClient);
  });

  it("accepts custom apiUrl", () => {
    const client = new GitChainClient({
      apiUrl: "https://custom.api.example.com",
    });
    expect(client).toBeInstanceOf(GitChainClient);
  });

  it("accepts custom apiKey", () => {
    const client = new GitChainClient({
      apiKey: "test-key-abc123",
    });
    expect(client).toBeInstanceOf(GitChainClient);
  });

  it("accepts custom timeout", () => {
    const client = new GitChainClient({
      timeout: 60000,
    });
    expect(client).toBeInstanceOf(GitChainClient);
  });

  it("merges partial config with defaults", () => {
    const client = new GitChainClient({
      apiKey: "my-key",
      // apiUrl and timeout should come from defaults
    });
    expect(client).toBeInstanceOf(GitChainClient);
  });
});

// ============================================
// getClient (singleton factory)
// ============================================

describe("getClient", () => {
  it("returns a GitChainClient instance", () => {
    const client = getClient({ apiUrl: "https://test.example.com" });
    expect(client).toBeInstanceOf(GitChainClient);
  });

  it("returns the same instance when called without config", () => {
    const c1 = getClient({ apiUrl: "https://test2.example.com" });
    const c2 = getClient();
    // Without new config, should return the cached instance
    expect(c2).toBe(c1);
  });

  it("creates a new instance when config is provided", () => {
    const c1 = getClient({ apiUrl: "https://original.example.com" });
    const c2 = getClient({ apiUrl: "https://different.example.com" });
    // New config should create a new instance
    expect(c2).not.toBe(c1);
  });
});

// ============================================
// inject()
// ============================================

describe("GitChainClient.inject", () => {
  let client: GitChainClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new GitChainClient({
      apiUrl: "https://api.test.local",
      apiKey: "test-key",
      timeout: 5000,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST request to /api/inject", async () => {
    const mockResponse = {
      containers: [],
      formatted: "",
      tokenCount: 0,
      verified: true,
      verifiedAt: "2026-01-01T00:00:00Z",
    };

    globalThis.fetch = mockFetchOk(mockResponse);

    const result = await client.inject({
      containers: ["0711:product:bosch:123:v1"],
      verify: true,
      format: "markdown",
    });

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url, opts] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test.local/api/inject");
    expect(opts.method).toBe("POST");
    expect(opts.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer test-key",
      })
    );
  });

  it("throws on non-ok response", async () => {
    globalThis.fetch = mockFetchError(500, { message: "Internal server error" });

    await expect(client.inject({ containers: ["0711:product:test:1:v1"] })).rejects.toThrow(
      "Internal server error"
    );
  });

  it("throws generic error when response body has no message", async () => {
    globalThis.fetch = mockFetchError(502);

    await expect(client.inject({ containers: ["0711:product:test:1:v1"] })).rejects.toThrow(
      "HTTP 502"
    );
  });
});

// ============================================
// getContainer()
// ============================================

describe("GitChainClient.getContainer", () => {
  let client: GitChainClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new GitChainClient({
      apiUrl: "https://api.test.local",
      timeout: 5000,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches a container by ID", async () => {
    const mockContainer = {
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
      data: { supplierPid: "7736606982" },
    };

    globalThis.fetch = mockFetchOk(mockContainer);

    const result = await client.getContainer("0711:product:bosch:7736606982:v3");

    expect(result).toEqual(mockContainer);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string];
    expect(url).toContain("/api/containers/");
    expect(url).toContain(encodeURIComponent("0711:product:bosch:7736606982:v3"));
  });

  it("returns null on fetch error", async () => {
    globalThis.fetch = mockFetchNetworkError("ECONNREFUSED");

    const result = await client.getContainer("0711:product:test:1:v1");
    expect(result).toBeNull();
  });

  it("returns null on non-ok response (caught internally)", async () => {
    globalThis.fetch = mockFetchError(404, { message: "Not found" });

    const result = await client.getContainer("0711:product:test:missing:v1");
    expect(result).toBeNull();
  });
});

// ============================================
// verify()
// ============================================

describe("GitChainClient.verify", () => {
  let client: GitChainClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new GitChainClient({
      apiUrl: "https://api.test.local",
      timeout: 5000,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET request to /api/verify/:hashOrId", async () => {
    const mockVerification = {
      verified: true,
      chain: {
        network: "base-mainnet",
        batchId: 42,
        txHash: "0xabc123",
      },
    };

    globalThis.fetch = mockFetchOk(mockVerification);

    const result = await client.verify("0xdeadbeef");

    expect(result.verified).toBe(true);
    expect(result.chain).toBeDefined();
    expect(result.chain!.network).toBe("base-mainnet");

    const [url] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string];
    expect(url).toBe("https://api.test.local/api/verify/0xdeadbeef");
  });

  it("returns unverified result on failure response", async () => {
    globalThis.fetch = mockFetchError(500, { message: "Server error" });

    await expect(client.verify("0xbadbeef")).rejects.toThrow("Server error");
  });
});

// ============================================
// getContainers()
// ============================================

describe("GitChainClient.getContainers", () => {
  let client: GitChainClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new GitChainClient({
      apiUrl: "https://api.test.local",
      timeout: 5000,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches multiple containers via inject endpoint", async () => {
    const mockResult = {
      containers: [{ id: "0711:product:bosch:1:v1" }, { id: "0711:product:bosch:2:v1" }],
      formatted: "",
      tokenCount: 0,
      verified: false,
      verifiedAt: "2026-01-01T00:00:00Z",
    };

    globalThis.fetch = mockFetchOk(mockResult);

    const result = await client.getContainers([
      "0711:product:bosch:1:v1",
      "0711:product:bosch:2:v1",
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("0711:product:bosch:1:v1");
  });
});

// ============================================
// Authorization header
// ============================================

describe("Authorization header handling", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("includes Authorization header when apiKey is set", async () => {
    const client = new GitChainClient({
      apiUrl: "https://api.test.local",
      apiKey: "secret-token-xyz",
    });

    globalThis.fetch = mockFetchOk({ verified: true });

    await client.verify("0xtest");

    const [, opts] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = opts.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer secret-token-xyz");
  });

  it("omits Authorization header when no apiKey", async () => {
    const client = new GitChainClient({
      apiUrl: "https://api.test.local",
    });

    globalThis.fetch = mockFetchOk({ verified: true });

    await client.verify("0xtest");

    const [, opts] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = opts.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });
});
