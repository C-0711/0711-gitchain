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
} from "./schema.js";

export type {
  ContainerType,
  Citation,
  Media,
  ContainerMeta,
  ChainProof,
  GitInfo,
  Container,
} from "./schema.js";

// ID utilities
export {
  parseContainerId,
  buildContainerId,
  toLatestId,
  isLatestVersion,
  isValidContainerId,
} from "./id.js";

export type { ParsedContainerId } from "./id.js";

// Atom types (DataAtom provenance system)
export {
  createAtom,
  compareTrust,
  meetsTrustMin,
  SOURCE_TO_TRUST,
  TRUST_PRIORITY,
} from "./types/atom.js";

export type {
  TrustLevel,
  SourceType,
  DataAtom,
  DataAtomSource,
  DataAtomCitation,
  DataAtomVerification,
  ContainerLayer,
  Contributor,
  ContributorRole,
  ProductContainerManifest,
  InjectOptions,
  InjectResponse,
  EtimFeatureAtom,
} from "./types/atom.js";

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
