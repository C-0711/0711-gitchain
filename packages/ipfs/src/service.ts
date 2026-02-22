/**
 * IPFS Service
 */

import type { IPFSConfig, UploadResult } from "./types";

const DEFAULT_CONFIG: IPFSConfig = {
  apiUrl: process.env.IPFS_API_URL || "http://localhost:5001",
  gatewayUrl: process.env.IPFS_GATEWAY_URL || "https://ipfs.io/ipfs",
};

export class IPFSService {
  private config: IPFSConfig;

  constructor(config: Partial<IPFSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: unknown): Promise<UploadResult> {
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: "application/json" });

    const formData = new FormData();
    formData.append("file", blob, "data.json");

    const response = await fetch(`${this.config.apiUrl}/api/v0/add`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const cid = result.Hash;

    return {
      cid,
      size: result.Size,
      url: `${this.config.gatewayUrl}/${cid}`,
      pinned: false,
    };
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(
    content: Blob | Buffer,
    filename: string
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", new Blob([content]), filename);

    const response = await fetch(`${this.config.apiUrl}/api/v0/add`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const cid = result.Hash;

    return {
      cid,
      size: result.Size,
      url: `${this.config.gatewayUrl}/${cid}`,
      pinned: false,
    };
  }

  /**
   * Download JSON from IPFS
   */
  async downloadJSON<T = unknown>(cid: string): Promise<T> {
    const response = await fetch(`${this.config.gatewayUrl}/${cid}`);

    if (!response.ok) {
      throw new Error(`IPFS download failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Pin content
   */
  async pin(cid: string): Promise<void> {
    if (!this.config.pinningService) {
      // Local pin
      const response = await fetch(
        `${this.config.apiUrl}/api/v0/pin/add?arg=${cid}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`IPFS pin failed: ${response.statusText}`);
      }
      return;
    }

    // Use pinning service
    const response = await fetch(`${this.config.pinningService.url}/pins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.pinningService.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cid, name: `gitchain-${cid.slice(0, 8)}` }),
    });

    if (!response.ok) {
      throw new Error(`Pinning service failed: ${response.statusText}`);
    }
  }

  /**
   * Get gateway URL for CID
   */
  getGatewayUrl(cid: string): string {
    return `${this.config.gatewayUrl}/${cid}`;
  }
}

// Singleton
let defaultService: IPFSService | null = null;

export function getIPFSService(config?: Partial<IPFSConfig>): IPFSService {
  if (!defaultService || config) {
    defaultService = new IPFSService(config);
  }
  return defaultService;
}
