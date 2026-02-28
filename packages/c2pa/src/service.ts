/**
 * C2PA Service
 */

import type { C2PAConfig, C2PAManifest, SignatureResult, VerificationResult } from "./types.js";
import type { Container } from "@0711/core";
import crypto from "crypto";

const DEFAULT_CONFIG: Partial<C2PAConfig> = {
  claimGenerator: "GitChain/0.1.0 c2pa-ts/0.1.0",
  signer: {
    name: "GitChain",
    url: "https://gitchain.0711.io",
  },
};

export class C2PAService {
  private config: C2PAConfig;

  constructor(config: Partial<C2PAConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as C2PAConfig;
  }

  /**
   * Sign container content with C2PA manifest
   */
  async signContainer(container: Container): Promise<SignatureResult> {
    const claimId = crypto.randomUUID();
    const instanceId = `urn:uuid:${crypto.randomUUID()}`;

    // Create content hash
    const contentJson = JSON.stringify(container.data);
    const contentHash = crypto
      .createHash("sha256")
      .update(contentJson)
      .digest("hex");

    const manifest: C2PAManifest = {
      claimId,
      format: "c2pa",
      instanceId,
      title: container.meta.name,
      claimGenerator: this.config.claimGenerator,
      signature: {
        issuer: this.config.signer.name,
        time: new Date().toISOString(),
        algorithm: "ES256",
      },
      assertions: [
        {
          label: "c2pa.hash.data",
          data: {
            name: "sha256",
            hash: contentHash,
          },
        },
        {
          label: "stds.schema-org.CreativeWork",
          data: {
            "@context": "https://schema.org/",
            "@type": "CreativeWork",
            name: container.meta.name,
            author: container.meta.author,
            dateCreated: container.meta.createdAt,
            dateModified: container.meta.updatedAt,
          },
        },
        {
          label: "gitchain.container",
          data: {
            id: container.id,
            type: container.type,
            namespace: container.namespace,
            version: container.version,
          },
        },
      ],
      actions: [
        {
          action: "c2pa.created",
          when: container.meta.createdAt,
          softwareAgent: "GitChain",
        },
      ],
    };

    // Add citations as ingredients
    if (container.citations?.length) {
      manifest.ingredients = container.citations.map((citation) => ({
        title: citation.documentId,
        format: "application/pdf",
        instanceId: `urn:gitchain:${citation.documentId}`,
        documentId: citation.documentId,
        relationship: "inputTo" as const,
      }));
    }

    // TODO: Actually sign with certificate
    // For now, return unsigned manifest

    return {
      success: true,
      manifest,
      signedData: Buffer.from(JSON.stringify(manifest)),
    };
  }

  /**
   * Verify C2PA manifest
   */
  async verifyManifest(data: Buffer): Promise<VerificationResult> {
    try {
      const manifest = JSON.parse(data.toString()) as C2PAManifest;

      // TODO: Verify signature against certificate chain

      return {
        valid: true,
        manifest,
        warnings: ["Signature verification not yet implemented"],
      };
    } catch (err: any) {
      return {
        valid: false,
        errors: [err.message],
      };
    }
  }

  /**
   * Extract manifest from signed content
   */
  extractManifest(data: Buffer): C2PAManifest | null {
    try {
      return JSON.parse(data.toString()) as C2PAManifest;
    } catch {
      return null;
    }
  }
}

// Singleton
let defaultService: C2PAService | null = null;

export function getC2PAService(config?: Partial<C2PAConfig>): C2PAService {
  if (!defaultService || config) {
    defaultService = new C2PAService(config);
  }
  return defaultService;
}
