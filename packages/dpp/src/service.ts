/**
 * Digital Product Passport Service
 */

import type { DPPConfig, ProductPassport, PassportVerification } from "./types.js";
import type { Container } from "@0711/core";

const DEFAULT_CONFIG: DPPConfig = {
  baseUrl: process.env.DPP_BASE_URL || "https://dpp.gitchain.0711.io",
  qrCode: {
    size: 256,
    format: "svg",
    errorCorrection: "M",
  },
  issuer: {
    name: "GitChain",
    id: "gitchain.0711.io",
  },
};

export class DPPService {
  private config: DPPConfig;

  constructor(config: Partial<DPPConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a Digital Product Passport from a container
   */
  async createPassport(container: Container): Promise<ProductPassport> {
    const data = container.data as Record<string, unknown>;

    const passport: ProductPassport = {
      id: `dpp-${container.id.replace(/:/g, "-")}`,
      containerId: container.id,
      product: {
        name: container.meta.name,
        manufacturer: (data.manufacturer as string) || container.namespace,
        model: (data.model as string) || container.identifier,
        serialNumber: data.serialNumber as string,
        gtin: data.gtin as string,
        category: data.category as string,
      },
      sustainability: this.extractSustainability(data),
      supplyChain: this.extractSupplyChain(data),
      specifications: this.extractSpecifications(data),
      documents: this.extractDocuments(container),
      verification: {
        chainId: container.chain?.network || "pending",
        batchId: container.chain?.batchId || 0,
        merkleRoot: "",  // TODO: Calculate
        txHash: container.chain?.txHash,
        timestamp: new Date().toISOString(),
      },
      meta: {
        version: container.version,
        createdAt: container.meta.createdAt,
        updatedAt: container.meta.updatedAt,
        issuer: this.config.issuer.id,
      },
    };

    return passport;
  }

  /**
   * Verify a Digital Product Passport
   */
  async verifyPassport(passportId: string): Promise<PassportVerification> {
    // TODO: Implement full verification
    return {
      valid: false,
      passport: {} as ProductPassport,
      chain: {
        verified: false,
        network: "base-mainnet",
      },
      citations: [],
    };
  }

  /**
   * Generate passport URL
   */
  getPassportUrl(passportId: string): string {
    return `${this.config.baseUrl}/${passportId}`;
  }

  /**
   * Generate QR code for passport
   */
  async generateQRCode(passportId: string): Promise<string> {
    const url = this.getPassportUrl(passportId);
    // TODO: Generate QR code
    return `data:image/svg+xml,<svg>...</svg>`;
  }

  private extractSustainability(data: Record<string, unknown>) {
    const sustainability = data.sustainability as Record<string, unknown>;
    if (!sustainability) return undefined;

    return {
      carbonFootprint: sustainability.carbonFootprint as {
        value: number;
        unit: string;
        scope: string;
      },
      recyclability: sustainability.recyclability as number,
      materials: sustainability.materials as Array<{
        name: string;
        percentage: number;
        recyclable: boolean;
      }>,
      certifications: sustainability.certifications as string[],
    };
  }

  private extractSupplyChain(data: Record<string, unknown>) {
    const supplyChain = data.supplyChain as Record<string, unknown>;
    if (!supplyChain) return undefined;

    return {
      origin: (supplyChain.origin as string) || "Unknown",
      facilities: supplyChain.facilities as Array<{
        name: string;
        location: string;
        role: string;
      }>,
    };
  }

  private extractSpecifications(data: Record<string, unknown>) {
    const specs: Record<string, unknown> = {};

    // Extract feature values
    const features = data.features as Array<{
      code: string;
      name: string;
      value: string;
      unit?: string;
    }>;

    if (features) {
      for (const feature of features) {
        const key = feature.name || feature.code;
        specs[key] = feature.unit
          ? `${feature.value} ${feature.unit}`
          : feature.value;
      }
    }

    return specs;
  }

  private extractDocuments(container: Container) {
    return container.media?.map((m) => ({
      type: m.type,
      name: m.name || "Document",
      url: m.url,
      hash: m.hash,
    }));
  }
}

// Singleton
let defaultService: DPPService | null = null;

export function getDPPService(config?: Partial<DPPConfig>): DPPService {
  if (!defaultService || config) {
    defaultService = new DPPService(config);
  }
  return defaultService;
}
