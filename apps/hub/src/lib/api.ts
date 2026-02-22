/**
 * API client for Hub UI
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface Container {
  id: string;
  type: string;
  namespace: string;
  identifier: string;
  version: number;
  meta: {
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    author: string;
  };
  data: Record<string, unknown>;
  citations?: Array<{
    documentId: string;
    page?: number;
    confidence: string;
  }>;
  chain?: {
    network: string;
    batchId: number;
    txHash?: string;
  };
}

export interface InjectResult {
  containers: Container[];
  formatted: string;
  tokenCount: number;
  verified: boolean;
  verifiedAt: string;
}

export interface Namespace {
  type: string;
  name: string;
  containerCount: number;
  lastCommit?: {
    hash: string;
    timestamp: string;
  };
  createdAt: string;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Containers
  async getContainers(params?: {
    type?: string;
    namespace?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ containers: Container[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.namespace) query.set("namespace", params.namespace);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    return this.request("GET", `/api/containers?${query}`);
  }

  async getContainer(id: string): Promise<Container> {
    return this.request("GET", `/api/containers/${encodeURIComponent(id)}`);
  }

  async createContainer(data: {
    type: string;
    namespace: string;
    identifier: string;
    data: unknown;
    meta?: { name?: string; description?: string };
  }): Promise<{ id: string; version: number }> {
    return this.request("POST", "/api/containers", data);
  }

  async updateContainer(
    id: string,
    data: { data?: unknown; meta?: unknown; message?: string }
  ): Promise<{ id: string; version: number }> {
    return this.request("PUT", `/api/containers/${encodeURIComponent(id)}`, data);
  }

  // Inject
  async inject(options: {
    containers: string[];
    verify?: boolean;
    format?: "markdown" | "json" | "yaml";
  }): Promise<InjectResult> {
    return this.request("POST", "/api/inject", options);
  }

  // Verify
  async verify(hashOrId: string): Promise<{
    verified: boolean;
    container?: Container;
    chain?: { network: string; batchId: number; txHash?: string };
  }> {
    return this.request("GET", `/api/verify/${encodeURIComponent(hashOrId)}`);
  }

  // Namespaces
  async getNamespaces(type?: string): Promise<{ namespaces: Namespace[] }> {
    const query = type ? `?type=${type}` : "";
    return this.request("GET", `/api/namespaces${query}`);
  }

  async createNamespace(type: string, namespace: string): Promise<void> {
    return this.request("POST", "/api/namespaces", { type, namespace });
  }

  // Search
  async search(
    query: string,
    options?: { type?: string; namespace?: string; limit?: number }
  ): Promise<{ results: Container[]; total: number }> {
    const params = new URLSearchParams({ q: query });
    if (options?.type) params.set("type", options.type);
    if (options?.namespace) params.set("namespace", options.namespace);
    if (options?.limit) params.set("limit", String(options.limit));

    return this.request("GET", `/api/search?${params}`);
  }

  // Batch
  async batchCreate(
    containers: Array<{
      type: string;
      namespace: string;
      identifier: string;
      data: unknown;
      meta?: { name?: string };
    }>
  ): Promise<{
    containers: Array<{ id: string; version: number }>;
    batch: { merkleRoot: string; batchId?: number };
  }> {
    return this.request("POST", "/api/batch", { containers });
  }
}

export const api = new APIClient();
export default api;
