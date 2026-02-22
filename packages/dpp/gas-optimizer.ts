// DPP-07: Gas Optimization for Batch Minting
interface BatchMintConfig {
  maxBatchSize: number;
  gasLimit: number;
}

interface MintResult {
  success: boolean;
  txHash?: string;
  gasUsed?: number;
  passportIds: string[];
}

const DEFAULT_CONFIG: BatchMintConfig = {
  maxBatchSize: 50,
  gasLimit: 3000000
};

export class GasOptimizer {
  private config: BatchMintConfig;

  constructor(config: Partial<BatchMintConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  estimateBatchGas(count: number): number {
    return 21000 + count * 50000;
  }

  getOptimalBatchSize(totalCount: number): number {
    const maxByGas = Math.floor((this.config.gasLimit - 21000) / 50000);
    return Math.min(totalCount, this.config.maxBatchSize, maxByGas);
  }

  async processBatchMinting(
    passports: Array<{ contentHash: string; metadataUri: string }>,
    mintFn: (batch: typeof passports) => Promise<MintResult>
  ): Promise<MintResult[]> {
    const results: MintResult[] = [];
    const batchSize = this.getOptimalBatchSize(passports.length);
    
    for (let i = 0; i < passports.length; i += batchSize) {
      const batch = passports.slice(i, i + batchSize);
      const result = await mintFn(batch);
      results.push(result);
      if (i + batchSize < passports.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return results;
  }

  estimateTotalCost(count: number, gasPriceGwei: number): { gas: number; costEth: number; batches: number } {
    const batchSize = this.getOptimalBatchSize(count);
    const batches = Math.ceil(count / batchSize);
    const gas = this.estimateBatchGas(batchSize) * batches;
    return { gas, costEth: gas * gasPriceGwei / 1e9, batches };
  }
}
