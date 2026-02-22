/**
 * Digital Product Passport types
 */

export interface DPPConfig {
  /** Base URL for DPP links */
  baseUrl: string;
  /** QR code generation */
  qrCode: {
    size: number;
    format: "svg" | "png";
    errorCorrection: "L" | "M" | "Q" | "H";
  };
  /** Issuer information */
  issuer: {
    name: string;
    id: string;
    logo?: string;
  };
}

export interface ProductPassport {
  /** Unique passport ID */
  id: string;
  /** Container reference */
  containerId: string;
  /** Product information */
  product: {
    name: string;
    manufacturer: string;
    model: string;
    serialNumber?: string;
    gtin?: string;
    category?: string;
  };
  /** Sustainability data */
  sustainability?: {
    carbonFootprint?: {
      value: number;
      unit: string;
      scope: string;
    };
    recyclability?: number;
    materials?: Array<{
      name: string;
      percentage: number;
      recyclable: boolean;
    }>;
    certifications?: string[];
  };
  /** Supply chain */
  supplyChain?: {
    origin: string;
    facilities?: Array<{
      name: string;
      location: string;
      role: string;
    }>;
  };
  /** Technical specifications */
  specifications: Record<string, unknown>;
  /** Documents and links */
  documents?: Array<{
    type: string;
    name: string;
    url: string;
    hash?: string;
  }>;
  /** Blockchain verification */
  verification: {
    chainId: string;
    batchId: number;
    merkleRoot: string;
    txHash?: string;
    timestamp: string;
  };
  /** Metadata */
  meta: {
    version: number;
    createdAt: string;
    updatedAt: string;
    issuer: string;
  };
}

export interface PassportVerification {
  valid: boolean;
  passport: ProductPassport;
  chain: {
    verified: boolean;
    network: string;
    txHash?: string;
    blockNumber?: number;
  };
  citations: Array<{
    documentId: string;
    confidence: string;
  }>;
}
