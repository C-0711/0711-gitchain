// 0711 Content Chain - Blockchain Service
// Connects to Base L2 and manages on-chain certifications

import { ethers } from 'ethers';
import type { BatchResult } from './merkle';
import { updateBatchStatus } from './merkle';

// ============================================
// CONTRACT ABI (minimal for our functions)
// ============================================

const CONTRACT_ABI = [
  "function certifyBatch(bytes32 _merkleRoot, string calldata _metadataURI, uint256 _itemCount, uint8 _schemaVersion) external returns (uint256)",
  "function verifyCertification(uint256 _batchId, bytes32 _contentManifestHash, bytes32[] calldata _merkleProof) external view returns (bool)",
  "function getCertification(uint256 _batchId) external view returns (bytes32, uint256, string, uint256, address)",
  "function nextBatchId() external view returns (uint256)",
  "event BatchCertified(uint256 indexed batchId, bytes32 merkleRoot, uint256 itemCount, string metadataURI, address indexed issuer)"
];

// ============================================
// CONFIGURATION
// ============================================

interface BlockchainConfig {
  rpcUrl: string;
  contractAddress: string;
  privateKey: string;
  network: 'base-sepolia' | 'base-mainnet';
}

const NETWORKS: Record<string, BlockchainConfig> = {
  'base-sepolia': {
    rpcUrl: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    contractAddress: process.env.CONTENT_CERTIFICATE_ADDRESS_SEPOLIA || '',
    privateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
    network: 'base-sepolia',
  },
  'base-mainnet': {
    rpcUrl: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
    contractAddress: process.env.CONTENT_CERTIFICATE_ADDRESS_MAINNET || '',
    privateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
    network: 'base-mainnet',
  },
};

// ============================================
// BLOCKCHAIN CLIENT
// ============================================

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private config: BlockchainConfig;

  constructor(network?: 'base-sepolia' | 'base-mainnet') {
    const selectedNetwork = network || (process.env.CONTENT_CERTIFICATE_ADDRESS_MAINNET ? 'base-mainnet' : 'base-sepolia');
    this.config = NETWORKS[selectedNetwork];
    
    if (!this.config.contractAddress) {
      console.warn(`[Blockchain] Contract not deployed on ${network}`);
    }
    
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.wallet = new ethers.Wallet(this.config.privateKey || ethers.Wallet.createRandom().privateKey, this.provider);
    this.contract = new ethers.Contract(
      this.config.contractAddress || ethers.ZeroAddress,
      CONTRACT_ABI,
      this.wallet
    );
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

  async getStatus(): Promise<{
    connected: boolean;
    network: string;
    contractDeployed: boolean;
    walletAddress: string;
    balance: string;
  }> {
    const connected = await this.isConnected();
    let balance = '0';
    
    if (connected) {
      try {
        const wei = await this.provider.getBalance(this.wallet.address);
        balance = ethers.formatEther(wei);
      } catch {}
    }
    
    return {
      connected,
      network: this.config.network,
      contractDeployed: !!this.config.contractAddress,
      walletAddress: this.wallet.address,
      balance,
    };
  }

  // ============================================
  // CERTIFICATION
  // ============================================

  async certifyBatch(batch: BatchResult, metadataURI: string): Promise<{
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    onChainBatchId?: number;
    error?: string;
  }> {
    if (!this.config.contractAddress) {
      return { success: false, error: 'Contract not deployed' };
    }

    try {
      // Convert merkle root to bytes32
      const merkleRootBytes = '0x' + batch.merkleRoot;
      
      // Call contract
      const tx = await this.contract.certifyBatch(
        merkleRootBytes,
        metadataURI,
        batch.itemCount,
        1 // schemaVersion
      );
      
      console.log(`[Blockchain] Tx submitted: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Parse event to get on-chain batch ID
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'BatchCertified';
        } catch {
          return false;
        }
      });
      
      let onChainBatchId: number | undefined;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        onChainBatchId = Number(parsed?.args[0]);
      }
      
      // Update local batch status
      updateBatchStatus(batch.batchId, 'confirmed', tx.hash, receipt.blockNumber, metadataURI);
      
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        onChainBatchId,
      };
      
    } catch (error) {
      console.error('[Blockchain] Certification error:', error);
      updateBatchStatus(batch.batchId, 'failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verifyCertification(
    batchId: number,
    manifestHash: string,
    proof: string[]
  ): Promise<boolean> {
    if (!this.config.contractAddress) {
      throw new Error('Contract not deployed');
    }

    const manifestHashBytes = '0x' + manifestHash;
    const proofBytes = proof.map(p => '0x' + p);
    
    return this.contract.verifyCertification(batchId, manifestHashBytes, proofBytes);
  }

  async getCertification(batchId: number): Promise<{
    merkleRoot: string;
    timestamp: number;
    metadataURI: string;
    itemCount: number;
    issuer: string;
  } | null> {
    if (!this.config.contractAddress) {
      return null;
    }

    try {
      const result = await this.contract.getCertification(batchId);
      return {
        merkleRoot: result[0].slice(2), // Remove 0x prefix
        timestamp: Number(result[1]),
        metadataURI: result[2],
        itemCount: Number(result[3]),
        issuer: result[4],
      };
    } catch {
      return null;
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let blockchainService: BlockchainService | null = null;

export function getBlockchainService(network?: 'base-sepolia' | 'base-mainnet'): BlockchainService {
  if (!blockchainService) {
    blockchainService = new BlockchainService(network);
  }
  return blockchainService;
}

// Export for direct use
export { NETWORKS };
