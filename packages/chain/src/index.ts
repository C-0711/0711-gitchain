/**
 * @0711/chain - Blockchain anchoring for GitChain
 * 
 * Provides Merkle tree batching and on-chain certification.
 * Smart contract deployed at 0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7 (Base Mainnet)
 */

export { BlockchainService, getBlockchainService } from "./blockchain";
export { buildMerkleTree, createBatch, verifyProof } from "./merkle";
export type { BatchResult, MerkleTreeResult, MerkleProof } from "./merkle";
