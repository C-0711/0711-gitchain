/**
 * @0711/chain — Blockchain Service
 *
 * THE canonical blockchain service for GitChain.
 * All other services (Studio, Vault, MCP servers) consume this via the API.
 *
 * Contract: ContentCertificate.sol
 * Address:  0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7
 * Network:  Base Mainnet (Chain ID 8453)
 */

import { ethers } from "ethers";

// ============================================
// CONTRACT ABI (matches deployed ContentCertificate.sol)
// ============================================

const CONTRACT_ABI = [
  "function certifyBatch(bytes32 _merkleRoot, string calldata _metadataURI, uint256 _itemCount, uint8 _schemaVersion) external returns (uint256)",
  "function verifyCertification(uint256 _batchId, bytes32 _contentManifestHash, bytes32[] calldata _merkleProof) external view returns (bool)",
  "function getCertification(uint256 _batchId) external view returns (bytes32, uint256, string, uint256, address)",
  "function nextBatchId() external view returns (uint256)",
  "function updateRule(string calldata _ruleId, uint256 _version) external",
  "function getRuleVersion(string calldata _ruleId) external view returns (uint256)",
  "event BatchCertified(uint256 indexed batchId, bytes32 merkleRoot, uint256 itemCount, string metadataURI, address indexed issuer)",
  "event RuleUpdated(string ruleId, uint256 version)",
];

// Contract address on Base Mainnet
const CONTRACT_ADDRESS = "0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7";

// ============================================
// NETWORK CONFIGURATION
// ============================================

export interface NetworkConfig {
  rpc: string;
  chainId: number;
  explorer: string;
}

const NETWORKS: Record<string, NetworkConfig> = {
  "base-mainnet": {
    rpc: process.env.BASE_MAINNET_RPC || "https://mainnet.base.org",
    chainId: 8453,
    explorer: "https://basescan.org",
  },
  "base-sepolia": {
    rpc: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    chainId: 84532,
    explorer: "https://sepolia.basescan.org",
  },
};

// ============================================
// TYPES
// ============================================

export interface BatchInfo {
  batchId: number;
  merkleRoot: string;
  metadataUri: string;
  timestamp: Date;
  itemCount: number;
  issuer: string;
}

export interface CertifyBatchResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  onChainBatchId?: number;
  error?: string;
}

export interface BlockchainStatus {
  connected: boolean;
  network: string;
  contractAddress: string;
  contractDeployed: boolean;
  walletAddress: string;
  balance: string;
}

// ============================================
// BLOCKCHAIN SERVICE
// ============================================

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private signer?: ethers.Wallet;
  private networkName: string;
  private networkConfig: NetworkConfig;

  constructor(network?: string, privateKey?: string) {
    // Auto-detect network: use mainnet if contract address is configured
    const selectedNetwork =
      network ||
      (process.env.CONTENT_CERTIFICATE_ADDRESS_MAINNET
        ? "base-mainnet"
        : "base-sepolia");

    const config = NETWORKS[selectedNetwork];
    if (!config) {
      throw new Error(`Unknown network: ${selectedNetwork}`);
    }

    this.networkName = selectedNetwork;
    this.networkConfig = config;
    this.provider = new ethers.JsonRpcProvider(config.rpc);

    // Resolve private key from param or env
    const key = privateKey || process.env.DEPLOYER_PRIVATE_KEY;

    if (key) {
      this.signer = new ethers.Wallet(key, this.provider);
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        this.signer
      );
    } else {
      // Read-only mode (verification only, no signing)
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        this.provider
      );
    }
  }

  // ============================================
  // STATUS
  // ============================================

  async isConnected(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<BlockchainStatus> {
    const connected = await this.isConnected();
    let balance = "0";

    if (connected && this.signer) {
      try {
        const wei = await this.provider.getBalance(this.signer.address);
        balance = ethers.formatEther(wei);
      } catch {
        // ignore balance errors
      }
    }

    return {
      connected,
      network: this.networkName,
      contractAddress: CONTRACT_ADDRESS,
      contractDeployed: true, // We know it's deployed
      walletAddress: this.signer?.address || "read-only",
      balance,
    };
  }

  // ============================================
  // CERTIFICATION
  // ============================================

  /**
   * Submit a Merkle batch to the smart contract.
   * Requires a signer (private key).
   */
  async certifyBatch(
    merkleRoot: string,
    metadataURI: string,
    itemCount: number,
    schemaVersion = 1
  ): Promise<CertifyBatchResult> {
    if (!this.signer) {
      return {
        success: false,
        error: "Signer required for write operations. Set DEPLOYER_PRIVATE_KEY.",
      };
    }

    try {
      // Ensure bytes32 format
      const merkleRootBytes = merkleRoot.startsWith("0x")
        ? merkleRoot
        : "0x" + merkleRoot;

      const tx = await this.contract.certifyBatch(
        merkleRootBytes,
        metadataURI,
        itemCount,
        schemaVersion
      );

      console.log(`[Chain] Tx submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      // Parse BatchCertified event to get on-chain batch ID
      let onChainBatchId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog(log);
          if (parsed?.name === "BatchCertified") {
            onChainBatchId = Number(parsed.args[0]);
            break;
          }
        } catch {
          // not our event
        }
      }

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        onChainBatchId,
      };
    } catch (error) {
      console.error("[Chain] Certification error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================
  // VERIFICATION
  // ============================================

  /**
   * Verify a content hash against a batch's Merkle tree on-chain.
   */
  async verifyCertification(
    batchId: number,
    contentHash: string,
    proof: string[]
  ): Promise<boolean> {
    try {
      const hashBytes = contentHash.startsWith("0x")
        ? contentHash
        : "0x" + contentHash;
      const proofBytes = proof.map((p) => (p.startsWith("0x") ? p : "0x" + p));

      return this.contract.verifyCertification(batchId, hashBytes, proofBytes);
    } catch (error) {
      console.error("[Chain] Verification error:", error);
      return false;
    }
  }

  /**
   * Get batch certification details from the contract.
   */
  async getCertification(batchId: number): Promise<BatchInfo | null> {
    try {
      const result = await this.contract.getCertification(batchId);
      return {
        batchId,
        merkleRoot: result[0], // bytes32 with 0x prefix
        timestamp: new Date(Number(result[1]) * 1000),
        metadataUri: result[2],
        itemCount: Number(result[3]),
        issuer: result[4],
      };
    } catch {
      return null;
    }
  }

  /**
   * Get next batch ID from the contract.
   */
  async getNextBatchId(): Promise<number> {
    const id = await this.contract.nextBatchId();
    return Number(id);
  }

  // ============================================
  // UTILITIES
  // ============================================

  getExplorerUrl(txHash: string): string {
    return `${this.networkConfig.explorer}/tx/${txHash}`;
  }

  getContractUrl(): string {
    return `${this.networkConfig.explorer}/address/${CONTRACT_ADDRESS}`;
  }

  getContractAddress(): string {
    return CONTRACT_ADDRESS;
  }

  getNetwork(): string {
    return this.networkName;
  }
}

// ============================================
// SINGLETON
// ============================================

let defaultService: BlockchainService | null = null;

export function getBlockchainService(
  network?: string,
  privateKey?: string
): BlockchainService {
  if (!defaultService || privateKey) {
    defaultService = new BlockchainService(network, privateKey);
  }
  return defaultService;
}

export { NETWORKS, CONTRACT_ADDRESS, CONTRACT_ABI };
