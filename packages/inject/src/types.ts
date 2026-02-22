/**
 * Inject layer types
 */

import type { Container as CoreContainer } from "@0711/core";

// Re-export core container type with chain info
export interface Container extends CoreContainer {
  chain?: {
    network: string;
    batchId: number;
    txHash?: string;
    blockNumber?: number;
  };
  git?: {
    repository: string;
    branch: string;
    commit: string;
    commitMessage?: string;
    commitAt: string;
  };
}

export interface InjectOptions {
  /** Container IDs to inject */
  containers: string[];
  
  /** Verify blockchain proofs (default: true) */
  verify?: boolean;
  
  /** Output format (default: "markdown") */
  format?: "markdown" | "json" | "yaml";
  
  /** Include version history */
  includeHistory?: boolean;
  
  /** Include source citations (default: true) */
  includeCitations?: boolean;
  
  /** Maximum tokens for output */
  maxTokens?: number;
}

export interface Citation {
  containerId: string;
  documentId: string;
  page?: number;
  quote?: string;
  confidence: "confirmed" | "likely" | "inferred";
}

export interface ChainProof {
  containerId: string;
  verified: boolean;
  network?: string;
  batchId?: number;
  txHash?: string;
  blockNumber?: number;
  verifiedAt?: string;
  reason?: string;
}

export interface InjectedContext {
  /** Resolved containers */
  containers: Container[];
  
  /** All source citations */
  citations: Citation[];
  
  /** Blockchain proofs */
  proofs: ChainProof[];
  
  /** LLM-ready formatted output */
  formatted: string;
  
  /** Estimated token count */
  tokenCount: number;
  
  /** All proofs verified */
  verified: boolean;
  
  /** When verification was performed */
  verifiedAt: string;
}

export interface VerificationResult {
  proofs: ChainProof[];
  allVerified: boolean;
}

export interface ResolverOptions {
  resolveLatest?: boolean;
  includeHistory?: boolean;
}
