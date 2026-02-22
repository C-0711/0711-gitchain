/**
 * @0711/sdk - GitChain SDK for TypeScript/JavaScript
 * 
 * Client SDK for interacting with GitChain API
 */

export { GitChainClient } from "./client";
export type { 
  GitChainConfig,
  Container,
  InjectOptions,
  InjectResult,
} from "./types";

// Re-export core types
export type {
  ContainerType,
  Citation,
  ChainProof,
} from "@0711/core";
