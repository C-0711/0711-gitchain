/**
 * SDK Types
 */

export interface GitChainConfig {
  /** API endpoint */
  apiUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** Request timeout in ms */
  timeout?: number;
}

export interface Container {
  id: string;
  type: string;
  namespace: string;
  identifier: string;
  version: number;
  meta: {
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    author: string;
  };
  data: Record<string, unknown>;
  citations?: Array<{
    documentId: string;
    page?: number;
    quote?: string;
    confidence: string;
  }>;
  chain?: {
    network: string;
    batchId: number;
    txHash?: string;
  };
}

export interface InjectOptions {
  containers: string[];
  verify?: boolean;
  format?: "markdown" | "json" | "yaml";
  includeCitations?: boolean;
  maxTokens?: number;
}

export interface InjectResult {
  containers: Container[];
  formatted: string;
  tokenCount: number;
  verified: boolean;
  verifiedAt: string;
  citations?: Array<{
    documentId: string;
    page?: number;
    quote?: string;
    confidence: string;
  }>;
}
