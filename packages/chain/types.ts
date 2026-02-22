// 0711 Content Chain - Types & Interfaces
// Blockchain-verified AI content compliance

export interface ContentManifest {
  // Content identification
  contentHash: string;           // SHA-256 of output file
  contentType: 'image' | 'video' | 'audio' | 'text';
  
  // Generation metadata
  workflowHash: string;          // SHA-256 of workflow/prompt config
  modelId: string;               // e.g. "flux-schnell", "sdxl"
  modelVersion: string;
  promptHash: string;            // SHA-256 of prompt (never store plaintext on-chain)
  
  // Parameters (non-sensitive)
  parameters: {
    seed?: number;
    steps?: number;
    guidance?: number;
    width?: number;
    height?: number;
    [key: string]: any;
  };
  
  // Timestamps
  generatedAt: string;           // ISO 8601
  certifiedAt?: string;
  
  // Operator (pseudonymized)
  operatorId: string;            // Wallet address or hashed user ID
  organizationId?: string;
  
  // Execution context
  executionMode: 'local' | 'cloud' | 'hybrid';
  provider: string;              // "comfyui", "replicate", etc.
  
  // Product context (MCP)
  productContext?: {
    productId: string;
    mcpSource: string;
    mcpDataHash: string;
  };
  
  // Compliance results
  compliance: ComplianceResult[];
  
  // Brand context
  brandId?: string;
  brandVersion?: string;
}

export interface ComplianceResult {
  rule: string;                  // e.g. "ecgt_no_greenwashing"
  version: string;
  result: 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED';
  details?: string;
  checkedAt: string;
}

export interface CertificationBatch {
  batchId: number;
  merkleRoot: string;
  itemCount: number;
  ipfsCid?: string;
  txHash?: string;
  blockNumber?: number;
  network: 'base-sepolia' | 'base-mainnet';
  createdAt: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
}

export interface MerkleProof {
  contentHash: string;
  manifestHash: string;
  proof: string[];
  batchId: number;
  index: number;
}

export interface CertifyRequest {
  // Content to certify
  content: Buffer | string;      // File data or base64
  contentType: ContentManifest['contentType'];
  
  // Generation info
  modelId: string;
  prompt: string;                // Will be hashed, not stored
  parameters?: ContentManifest['parameters'];
  
  // Context
  operatorId?: string;
  organizationId?: string;
  executionMode?: ContentManifest['executionMode'];
  provider?: string;
  
  // Optional
  productId?: string;
  brandId?: string;
  
  // Compliance checks to run
  runCompliance?: {
    ecgt?: boolean;
    brand?: boolean;
    pii?: boolean;
  };
}

export interface CertifyResponse {
  success: boolean;
  manifestHash: string;
  contentHash: string;
  manifest: ContentManifest;
  compliance: ComplianceResult[];
  
  // Will be filled after batch submission
  certification?: {
    batchId: number;
    merkleProof: string[];
    status: 'queued' | 'certified';
  };
}

export interface VerifyRequest {
  contentHash: string;
}

export interface VerifyResponse {
  verified: boolean;
  manifest?: ContentManifest;
  certification?: {
    batchId: number;
    merkleRoot: string;
    txHash?: string;
    blockNumber?: number;
    network: string;
    proofValid: boolean;
  };
  error?: string;
}
