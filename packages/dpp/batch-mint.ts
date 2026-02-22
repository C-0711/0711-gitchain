// DPP-07: Gas Optimization for Batch Minting
// Path: 0711-studio/src/lib/dpp/batch-mint.ts

import { ethers } from 'ethers';

// Content Chain ABI (simplified for batch operations)
const CONTENT_CHAIN_ABI = [
  "function mintBatch(bytes32[] calldata contentHashes, string[] calldata metadataURIs) external returns (uint256[] memory)",
  "function mint(bytes32 contentHash, string calldata metadataURI) external returns (uint256)",
  "function verifyBatch(bytes32[] calldata contentHashes) external view returns (bool[] memory)",
  "function getGasEstimate(uint256 batchSize) external view returns (uint256)",
];

interface BatchMintOptions {
  maxBatchSize?: number;      // Max items per transaction (default: 50)
  gasLimit?: number;          // Gas limit override
  maxGasPrice?: bigint;       // Max gas price in wei
  priorityFee?: bigint;       // Priority fee (EIP-1559)
  retryAttempts?: number;     // Retry failed batches
  delayBetweenBatches?: number; // ms between batches
}

interface MintItem {
  contentHash: string;
  metadataURI: string;
}

interface BatchResult {
  success: boolean;
  batchIndex: number;
  tokenIds?: number[];
  txHash?: string;
  gasUsed?: bigint;
  error?: string;
}

interface BatchMintResult {
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  totalGasUsed: bigint;
  batches: BatchResult[];
  estimatedCost: string;
}

export class BatchMinter {
  private contract: ethers.Contract;
  private signer: ethers.Signer;
  private options: Required<BatchMintOptions>;

  constructor(
    contractAddress: string,
    signer: ethers.Signer,
    options: BatchMintOptions = {}
  ) {
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddress, CONTENT_CHAIN_ABI, signer);
    this.options = {
      maxBatchSize: options.maxBatchSize || 50,
      gasLimit: options.gasLimit || 0, // 0 = auto-estimate
      maxGasPrice: options.maxGasPrice || ethers.parseUnits('50', 'gwei'),
      priorityFee: options.priorityFee || ethers.parseUnits('1.5', 'gwei'),
      retryAttempts: options.retryAttempts || 3,
      delayBetweenBatches: options.delayBetweenBatches || 2000,
    };
  }

  async estimateGas(items: MintItem[]): Promise<{
    totalGas: bigint;
    gasPerItem: bigint;
    estimatedCostETH: string;
    batches: number;
  }> {
    const numBatches = Math.ceil(items.length / this.options.maxBatchSize);
    
    // Estimate gas for first batch
    const firstBatch = items.slice(0, Math.min(items.length, this.options.maxBatchSize));
    const contentHashes = firstBatch.map(i => ethers.keccak256(ethers.toUtf8Bytes(i.contentHash)));
    const metadataURIs = firstBatch.map(i => i.metadataURI);
    
    let gasEstimate: bigint;
    try {
      gasEstimate = await this.contract.mintBatch.estimateGas(contentHashes, metadataURIs);
    } catch {
      // Fallback estimate: ~100k base + ~30k per item
      gasEstimate = BigInt(100000) + BigInt(30000 * firstBatch.length);
    }

    const gasPerItem = gasEstimate / BigInt(firstBatch.length);
    const totalGas = gasPerItem * BigInt(items.length) + BigInt(50000 * numBatches); // overhead per batch
    
    const feeData = await this.signer.provider!.getFeeData();
    const gasPrice = feeData.gasPrice || this.options.maxGasPrice;
    const estimatedCostWei = totalGas * gasPrice;
    
    return {
      totalGas,
      gasPerItem,
      estimatedCostETH: ethers.formatEther(estimatedCostWei),
      batches: numBatches,
    };
  }

  async mintBatch(items: MintItem[]): Promise<BatchMintResult> {
    const results: BatchResult[] = [];
    let totalGasUsed = BigInt(0);
    let successfulItems = 0;
    let failedItems = 0;

    // Split into batches
    const batches: MintItem[][] = [];
    for (let i = 0; i < items.length; i += this.options.maxBatchSize) {
      batches.push(items.slice(i, i + this.options.maxBatchSize));
    }

    console.log(`[BatchMinter] Processing ${items.length} items in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      let result = await this.processBatch(batch, i);
      
      // Retry failed batches
      let retries = 0;
      while (!result.success && retries < this.options.retryAttempts) {
        console.log(`[BatchMinter] Retrying batch ${i} (attempt ${retries + 1})`);
        await this.delay(this.options.delayBetweenBatches * (retries + 1));
        result = await this.processBatch(batch, i);
        retries++;
      }

      results.push(result);
      
      if (result.success) {
        successfulItems += batch.length;
        totalGasUsed += result.gasUsed || BigInt(0);
      } else {
        failedItems += batch.length;
      }

      // Delay between batches to avoid nonce issues
      if (i < batches.length - 1) {
        await this.delay(this.options.delayBetweenBatches);
      }
    }

    const feeData = await this.signer.provider!.getFeeData();
    const gasPrice = feeData.gasPrice || this.options.maxGasPrice;
    const estimatedCost = ethers.formatEther(totalGasUsed * gasPrice);

    return {
      totalItems: items.length,
      successfulItems,
      failedItems,
      totalGasUsed,
      batches: results,
      estimatedCost,
    };
  }

  private async processBatch(batch: MintItem[], batchIndex: number): Promise<BatchResult> {
    try {
      const contentHashes = batch.map(i => 
        ethers.keccak256(ethers.toUtf8Bytes(i.contentHash))
      );
      const metadataURIs = batch.map(i => i.metadataURI);

      // Get current gas price
      const feeData = await this.signer.provider!.getFeeData();
      const gasPrice = feeData.gasPrice || this.options.maxGasPrice;
      
      if (gasPrice > this.options.maxGasPrice) {
        throw new Error(`Gas price ${ethers.formatUnits(gasPrice, 'gwei')} gwei exceeds max`);
      }

      // Estimate gas for this batch
      let gasLimit = this.options.gasLimit;
      if (!gasLimit) {
        const estimate = await this.contract.mintBatch.estimateGas(contentHashes, metadataURIs);
        gasLimit = Number((estimate * BigInt(120)) / BigInt(100)); // 20% buffer
      }

      // Execute transaction
      const tx = await this.contract.mintBatch(contentHashes, metadataURIs, {
        gasLimit,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: this.options.priorityFee,
      });

      console.log(`[BatchMinter] Batch ${batchIndex} tx: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      // Extract token IDs from events (simplified)
      const tokenIds = receipt.logs
        .filter((log: any) => log.topics.length > 0)
        .map((log: any, idx: number) => idx + 1);

      return {
        success: true,
        batchIndex,
        tokenIds,
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed,
      };
    } catch (error: any) {
      console.error(`[BatchMinter] Batch ${batchIndex} failed:`, error.message);
      return {
        success: false,
        batchIndex,
        error: error.message,
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Helper function for quick batch minting
export async function mintDPPBatch(
  contractAddress: string,
  signer: ethers.Signer,
  items: MintItem[],
  options?: BatchMintOptions
): Promise<BatchMintResult> {
  const minter = new BatchMinter(contractAddress, signer, options);
  return minter.mintBatch(items);
}

export default BatchMinter;
