/**
 * Types for the inject API
 */

import type { Container, Citation, ChainProof } from "@0711/core";

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
  
  /** Maximum tokens for LLM context */
  maxTokens?: number;
  
  /** Cache TTL in seconds */
  cacheTtl?: number;
}

export interface InjectedContext {
  /** Resolved containers */
  containers: Container[];
  
  /** All source citations across containers */
  citations: Citation[];
  
  /** Blockchain proofs for verification */
  proofs: ChainProof[];
  
  /** LLM-ready formatted output */
  formatted: string;
  
  /** Estimated token count */
  tokenCount: number;
  
  /** Verification status */
  verified: boolean;
  
  /** Verification timestamp */
  verifiedAt: string;
  
  /** Any verification errors */
  errors?: string[];
}

export interface ResolverOptions {
  /** Resolve "latest" to specific version */
  resolveLatest?: boolean;
  
  /** Include dependencies */
  includeDeps?: boolean;
}

export interface FormatOptions {
  /** Include citations inline */
  inlineCitations?: boolean;
  
  /** Include blockchain proof info */
  includeProofs?: boolean;
  
  /** Max characters per section */
  maxCharsPerSection?: number;
}
