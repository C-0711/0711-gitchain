/**
 * @0711/core - Container schema, validation, and types
 * 
 * Core definitions for GitChain containers.
 */

// Schema exports
export {
  ContainerTypeSchema,
  CitationSchema,
  MediaSchema,
  ContainerMetaSchema,
  ChainProofSchema,
  GitInfoSchema,
  ContainerSchema,
  ContainerIdSchema,
  validateContainer,
  safeValidateContainer,
  validateContainerId,
} from "./schema";

export type {
  ContainerType,
  Citation,
  Media,
  ContainerMeta,
  ChainProof,
  GitInfo,
  Container,
} from "./schema";

// ID utilities
export {
  parseContainerId,
  buildContainerId,
  toLatestId,
  isLatestVersion,
  isValidContainerId,
} from "./id";

export type { ParsedContainerId } from "./id";

// Constants
export const CONTAINER_TYPES = [
  "product",
  "campaign",
  "project",
  "memory",
  "knowledge",
] as const;

export const VERSION_PATTERN = /^v\d+$/;
export const LATEST_VERSION = "latest";
