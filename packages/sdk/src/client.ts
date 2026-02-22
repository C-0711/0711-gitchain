/**
 * GitChain API Client
 */

import type { GitChainConfig, Container, InjectOptions, InjectResult } from "./types";

const DEFAULT_CONFIG: Partial<GitChainConfig> = {
  apiUrl: "https://api.gitchain.0711.io",
  timeout: 30000,
};

export class GitChainClient {
  private config: GitChainConfig;

  constructor(config: Partial<GitChainConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as GitChainConfig;
  }

  /**
   * Inject verified context from containers
   */
  async inject(options: InjectOptions): Promise<InjectResult> {
    const response = await this.request<InjectResult>("POST", "/api/inject", options);
    return response;
  }

  /**
   * Get a single container
   */
  async getContainer(id: string): Promise<Container | null> {
    try {
      const response = await this.request<Container>(
        "GET",
        `/api/containers/${encodeURIComponent(id)}`
      );
      return response;
    } catch {
      return null;
    }
  }

  /**
   * Get multiple containers
   */
  async getContainers(ids: string[]): Promise<Container[]> {
    const result = await this.inject({
      containers: ids,
      verify: false,
      format: "json",
    });
    return result.containers;
  }

  /**
   * Verify a container or hash
   */
  async verify(hashOrId: string): Promise<{
    verified: boolean;
    container?: Container;
    chain?: {
      network: string;
      batchId: number;
      txHash?: string;
    };
  }> {
    const response = await this.request<any>(
      "GET",
      `/api/verify/${encodeURIComponent(hashOrId)}`
    );
    return response;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// Default client instance
let defaultClient: GitChainClient | null = null;

export function getClient(config?: Partial<GitChainConfig>): GitChainClient {
  if (!defaultClient || config) {
    defaultClient = new GitChainClient(config);
  }
  return defaultClient;
}
