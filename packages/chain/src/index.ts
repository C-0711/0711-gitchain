/**
 * @0711/chain — The Content Blockchain
 *
 * GitChain IS the content blockchain. All other services consume this package
 * via the GitChain API at /api/chain/*.
 *
 * Smart contract: ContentCertificate.sol
 * Address: 0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7 (Base Mainnet)
 */

// Blockchain
export {
  BlockchainService,
  getBlockchainService,
  NETWORKS,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "./blockchain.js";
export type {
  BatchInfo,
  CertifyBatchResult,
  BlockchainStatus,
  NetworkConfig,
} from "./blockchain.js";

// Merkle Tree
export {
  buildMerkleTree,
  createBatch,
  generateProof,
  verifyProof,
  hashContent,
  getBatchLocal,
  getAllBatches,
  updateBatchStatus,
  getProofByHash,
  startAutoBatching,
  stopAutoBatching,
} from "./merkle.js";
export type { BatchResult, MerkleTreeResult, MerkleProof } from "./merkle.js";

// Certification Service
export {
  certify,
  verify,
  sha256,
  hashManifest,
  hashPrompt,
  createManifest,
  getQueueSize,
  getQueuedManifests,
  getQueuedItems,
  clearQueue,
  runECGTCheck,
  runBrandCheck,
  runPIICheck,
} from "./service.js";
// Note: hashContent is exported from merkle.ts (keccak256 for on-chain)
// service.ts also has a hashContent (sha256 for content fingerprinting)
// They serve different purposes.
export { hashContent as hashContentSha256 } from "./service.js";

// Database
export {
  initializeSchema,
  saveManifest,
  getManifest,
  getManifestsByBatch,
  saveBatch,
  getBatch,
  getPendingBatches,
  saveProof,
  getProof,
  logAudit,
  getAuditLog,
  getStats,
} from "./db.js";
export type { ManifestRecord, BatchRecord, ProofRecord, AuditEntry } from "./db.js";

// Types
export type {
  ContentManifest,
  ComplianceResult,
  CertificationBatch,
  CertifyRequest,
  CertifyResponse,
  VerifyRequest,
  VerifyResponse,
  MerkleProof as TypesMerkleProof,
} from "./types.js";
