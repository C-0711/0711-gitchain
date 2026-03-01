/**
 * Digital Product Passport types
 */

/** Verification status for a passport */
export type VerificationStatus = "valid" | "invalid" | "expired";

/** Maximum passport age in milliseconds (default: 1 year) */
export const DEFAULT_PASSPORT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

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
    contentHash: string;
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
  status: VerificationStatus;
  passport: ProductPassport;
  contentHashMatch: boolean;
  timestampValid: boolean;
  merkleRootValid: boolean;
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
  errors: string[];
}
