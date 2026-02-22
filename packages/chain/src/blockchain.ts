/**
 * Blockchain service for GitChain
 * 
 * Interacts with the deployed ContentChain smart contract.
 * Contract: 0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7 (Base Mainnet)
 */

import { ethers } from "ethers";

// Contract ABI (minimal for our needs)
const CONTRACT_ABI = [
  "function registerContentBatch(bytes32 merkleRoot, string metadataUri) external returns (uint256 batchId)",
  "function verifyContent(uint256 batchId, bytes32 contentHash, bytes32[] calldata merkleProof) external view returns (bool)",
  "function getBatch(uint256 batchId) external view returns (bytes32 merkleRoot, string memory metadataUri, uint256 timestamp, address registrar)",
  "function batchCount() external view returns (uint256)",
  "event BatchRegistered(uint256 indexed batchId, bytes32 merkleRoot, string metadataUri, address indexed registrar)",
];

// Contract address on Base Mainnet
const CONTRACT_ADDRESS = "0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7";

// Network configs
const NETWORKS = {
  "base-mainnet": {
    rpc: "https://mainnet.base.org",
    chainId: 8453,
    explorer: "https://basescan.org",
  },
  "base-sepolia": {
    rpc: "https://sepolia.base.org",
    chainId: 84532,
    explorer: "https://sepolia.basescan.org",
  },
};

export interface BatchInfo {
  batchId: number;
  merkleRoot: string;
  metadataUri: string;
  timestamp: Date;
  registrar: string;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private signer?: ethers.Wallet;
  private network: string;

  constructor(network = "base-mainnet", privateKey?: string) {
    const config = NETWORKS[network as keyof typeof NETWORKS];
    if (!config) {
      throw new Error(\`Unknown network: \${network}\`);
    }

    this.network = network;
    this.provider = new ethers.JsonRpcProvider(config.rpc);
    
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
    } else {
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
    }
  }

  /**
   * Register a batch of content hashes
   */
  async registerBatch(
    merkleRoot: string,
    metadataUri: string
  ): Promise<{ batchId: number; txHash: string }> {
    if (!this.signer) {
      throw new Error("Signer required for write operations");
    }

    const tx = await this.contract.registerContentBatch(merkleRoot, metadataUri);
    const receipt = await tx.wait();

    // Find BatchRegistered event
    const event = receipt.logs.find(
      (log: any) => log.topics[0] === ethers.id("BatchRegistered(uint256,bytes32,string,address)")
    );

    const batchId = event ? parseInt(event.topics[1], 16) : 0;

    return {
      batchId,
      txHash: receipt.hash,
    };
  }

  /**
   * Verify content against a batch
   */
  async verifyContent(
    batchId: number,
    contentHash: string,
    merkleProof: string[]
  ): Promise<boolean> {
    return this.contract.verifyContent(batchId, contentHash, merkleProof);
  }

  /**
   * Get batch information
   */
  async getBatch(batchId: number): Promise<BatchInfo | null> {
    try {
      const [merkleRoot, metadataUri, timestamp, registrar] = await this.contract.getBatch(batchId);
      
      return {
        batchId,
        merkleRoot,
        metadataUri,
        timestamp: new Date(Number(timestamp) * 1000),
        registrar,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get total batch count
   */
  async getBatchCount(): Promise<number> {
    const count = await this.contract.batchCount();
    return Number(count);
  }

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl(txHash: string): string {
    const config = NETWORKS[this.network as keyof typeof NETWORKS];
    return \`\${config.explorer}/tx/\${txHash}\`;
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return CONTRACT_ADDRESS;
  }
}

// Singleton instance
let defaultService: BlockchainService | null = null;

export function getBlockchainService(
  network = "base-mainnet",
  privateKey?: string
): BlockchainService {
  if (!defaultService || privateKey) {
    defaultService = new BlockchainService(network, privateKey);
  }
  return defaultService;
}
