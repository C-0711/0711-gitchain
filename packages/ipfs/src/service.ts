/**
 * @0711/ipfs — IPFS Service
 *
 * Production IPFS integration using Pinata SDK.
 * Uploads manifests, Merkle trees, and batch metadata.
 * Falls back to raw IPFS API if Pinata is not configured.
 */

import type { IPFSConfig, UploadResult } from "./types";

// ============================================
// CONFIGURATION
// ============================================

const PINATA_JWT = process.env.PINATA_JWT || "";
const PINATA_GATEWAY =
  process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

const DEFAULT_CONFIG: IPFSConfig = {
  apiUrl: process.env.IPFS_API_URL || "http://localhost:5001",
  gatewayUrl: process.env.IPFS_GATEWAY_URL || `https://${PINATA_GATEWAY}/ipfs`,
};

// ============================================
// TYPES
// ============================================

export interface ManifestUpload {
  contentHash: string;
  manifest: unknown;
  batchId?: number;
  merkleRoot?: string;
}

// ============================================
// IPFS SERVICE
// ============================================

export class IPFSService {
  private config: IPFSConfig;
  private pinata: any | null = null;

  constructor(config: Partial<IPFSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize Pinata SDK (lazy).
   */
  private async getPinata(): Promise<any> {
    if (this.pinata) return this.pinata;

    if (!PINATA_JWT) {
      throw new Error(
        "PINATA_JWT not configured. Set PINATA_JWT env var or use raw IPFS API."
      );
    }

    // Dynamic import so the package is optional
    try {
      const { PinataSDK } = await import("pinata");
      this.pinata = new PinataSDK({
        pinataJwt: PINATA_JWT,
        pinataGateway: PINATA_GATEWAY,
      });
      return this.pinata;
    } catch {
      throw new Error(
        "Pinata SDK not installed. Run: pnpm add pinata"
      );
    }
  }

  /**
   * Check if Pinata is configured
   */
  isPinataConfigured(): boolean {
    return !!PINATA_JWT;
  }

  // ============================================
  // UPLOAD METHODS
  // ============================================

  /**
   * Upload JSON data to IPFS.
   * Uses Pinata SDK if configured, falls back to raw IPFS API.
   */
  async uploadJSON(
    data: unknown,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    if (this.isPinataConfigured()) {
      return this.uploadJSONPinata(data, name, metadata);
    }
    return this.uploadJSONRaw(data);
  }

  /**
   * Upload JSON via Pinata SDK (production path)
   */
  private async uploadJSONPinata(
    data: unknown,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      const client = await this.getPinata();

      const result = await client.upload.public.json(data, {
        metadata: {
          name: name || `gitchain-${Date.now()}`,
          keyvalues: metadata || {},
        },
      });

      const cid = result.cid;
      return {
        cid,
        size: JSON.stringify(data).length,
        url: `https://${PINATA_GATEWAY}/ipfs/${cid}`,
        pinned: true,
      };
    } catch (error) {
      console.error("[IPFS] Pinata upload error:", error);
      throw error;
    }
  }

  /**
   * Upload JSON via raw IPFS API (development / fallback)
   */
  private async uploadJSONRaw(data: unknown): Promise<UploadResult> {
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
    if (this.isPinataConfigured()) {
      try {
        const client = await this.getPinata();
        const file = new File([content], filename);
        const result = await client.upload.public.file(file, {
          metadata: { name: filename },
        });
        return {
          cid: result.cid,
          size: content instanceof Blob ? content.size : content.length,
          url: `https://${PINATA_GATEWAY}/ipfs/${result.cid}`,
          pinned: true,
        };
      } catch (error) {
        console.error("[IPFS] Pinata file upload error:", error);
        throw error;
      }
    }

    // Fallback: raw IPFS API
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

  // ============================================
  // CHAIN-SPECIFIC UPLOAD METHODS
  // ============================================

  /**
   * Upload a content manifest to IPFS
   */
  async uploadManifest(upload: ManifestUpload): Promise<UploadResult> {
    const data = {
      version: "1.0",
      type: "content-manifest",
      contentHash: upload.contentHash,
      manifest: upload.manifest,
      batchId: upload.batchId,
      merkleRoot: upload.merkleRoot,
      timestamp: new Date().toISOString(),
      generator: "0711 GitChain",
    };

    return this.uploadJSON(
      data,
      `manifest-${upload.contentHash.slice(0, 16)}`,
      {
        contentHash: upload.contentHash,
        batchId: upload.batchId?.toString() || "",
      }
    );
  }

  /**
   * Upload a Merkle tree to IPFS
   */
  async uploadMerkleTree(
    batchId: number,
    merkleRoot: string,
    leaves: string[],
    tree: string[][]
  ): Promise<UploadResult> {
    const data = {
      version: "1.0",
      type: "merkle-tree",
      batchId,
      merkleRoot,
      leafCount: leaves.length,
      leaves,
      tree,
      timestamp: new Date().toISOString(),
      generator: "0711 GitChain",
    };

    return this.uploadJSON(data, `merkle-tree-batch-${batchId}`, {
      batchId: batchId.toString(),
      merkleRoot,
    });
  }

  /**
   * Upload batch metadata to IPFS (for blockchain metadataURI reference)
   */
  async uploadBatchMetadata(
    batchId: number,
    merkleRoot: string,
    itemCount: number,
    manifestCIDs: string[]
  ): Promise<UploadResult> {
    const data = {
      version: "1.0",
      type: "certification-batch",
      batchId,
      merkleRoot,
      itemCount,
      manifestCIDs,
      timestamp: new Date().toISOString(),
      generator: "0711 GitChain",
      network: process.env.CONTENT_CERTIFICATE_ADDRESS_MAINNET
        ? "base-mainnet"
        : "base-sepolia",
      contract: "0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7",
    };

    return this.uploadJSON(data, `batch-${batchId}-metadata`, {
      batchId: batchId.toString(),
      merkleRoot,
      itemCount: itemCount.toString(),
    });
  }

  // ============================================
  // RETRIEVAL & PINNING
  // ============================================

  /**
   * Download JSON from IPFS
   */
  async downloadJSON<T = unknown>(cid: string): Promise<T> {
    const response = await fetch(this.getGatewayUrl(cid));

    if (!response.ok) {
      throw new Error(`IPFS download failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Pin content (via Pinata or raw IPFS)
   */
  async pin(cid: string, name?: string): Promise<void> {
    if (this.isPinataConfigured()) {
      try {
        const client = await this.getPinata();
        await client.upload.public.cid(cid, {
          metadata: {
            name: name || `pinned-${cid.slice(0, 16)}`,
          },
        });
        return;
      } catch (error) {
        console.error("[IPFS] Pinata pin error:", error);
        throw error;
      }
    }

    if (this.config.pinningService) {
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
      return;
    }

    // Local IPFS pin
    const response = await fetch(
      `${this.config.apiUrl}/api/v0/pin/add?arg=${cid}`,
      { method: "POST" }
    );

    if (!response.ok) {
      throw new Error(`IPFS pin failed: ${response.statusText}`);
    }
  }

  /**
   * Get gateway URL for CID
   */
  getGatewayUrl(cid: string): string {
    if (this.isPinataConfigured()) {
      return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
    }
    return `${this.config.gatewayUrl}/${cid}`;
  }
}

// ============================================
// SINGLETON
// ============================================

let defaultService: IPFSService | null = null;

export function getIPFSService(config?: Partial<IPFSConfig>): IPFSService {
  if (!defaultService || config) {
    defaultService = new IPFSService(config);
  }
  return defaultService;
}
