/**
 * Core types for GitChain containers
 */

// Container types
export type ContainerType = "product" | "campaign" | "project" | "memory" | "knowledge";

// Base container interface
export interface Container {
  id: string;                    // 0711:type:namespace:identifier:version
  type: ContainerType;
  namespace: string;
  identifier: string;
  version: number;
  
  meta: ContainerMeta;
  data: Record<string, unknown>;
  citations?: Citation[];
  media?: MediaRef[];
  
  git?: GitInfo;
  chain?: ChainProof;
}

export interface ContainerMeta {
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  schema?: string;              // JSON-LD schema reference
  tags?: string[];
}

export interface Citation {
  featureCode?: string;
  documentId: string;
  documentType?: string;
  page?: number;
  quote?: string;
  confidence: "confirmed" | "likely" | "conflict" | "not_found";
  auditedAt?: string;
  auditedBy?: string;
}

export interface MediaRef {
  type: "image" | "document" | "video" | "cad";
  filename: string;
  url?: string;
  ipfsCid?: string;
  hash?: string;
  mimeType?: string;
}

export interface GitInfo {
  repository: string;
  branch: string;
  commit: string;
  commitMessage?: string;
  commitAt: string;
  history?: GitCommit[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
}

export interface ChainProof {
  network: string;              // "base-mainnet"
  contractAddress: string;
  batchId: number;
  merkleRoot: string;
  merkleProof: string[];
  txHash?: string;
  blockNumber?: number;
  timestamp?: string;
}

// Product-specific container
export interface ProductContainer extends Container {
  type: "product";
  data: {
    supplierPid: string;
    name: string;
    descriptionShort?: string;
    descriptionLong?: string;
    productLine?: string;
    etimClass?: string;
    features: ProductFeature[];
  };
}

export interface ProductFeature {
  code: string;
  name: string;
  value: string | number | boolean | null;
  unit?: string;
  source?: string;
  confidence?: string;
}

// Campaign container
export interface CampaignContainer extends Container {
  type: "campaign";
  data: {
    name: string;
    objective: string;
    startDate?: string;
    endDate?: string;
    targetAudience?: string;
    channels?: string[];
    assets?: string[];
    kpis?: Record<string, unknown>;
  };
}

// Project container
export interface ProjectContainer extends Container {
  type: "project";
  data: {
    name: string;
    client?: string;
    status: "active" | "completed" | "paused";
    startDate?: string;
    decisions?: ProjectDecision[];
    artifacts?: string[];
    context?: string;
  };
}

export interface ProjectDecision {
  date: string;
  decision: string;
  rationale?: string;
  participants?: string[];
}

// Memory container (agent learning)
export interface MemoryContainer extends Container {
  type: "memory";
  data: {
    agentId: string;
    sessionId?: string;
    learnings: MemoryEntry[];
    preferences?: Record<string, unknown>;
  };
}

export interface MemoryEntry {
  timestamp: string;
  type: "fact" | "preference" | "correction" | "insight";
  content: string;
  source?: string;
}

// Knowledge container (domain facts)
export interface KnowledgeContainer extends Container {
  type: "knowledge";
  data: {
    domain: string;
    topic: string;
    facts: KnowledgeFact[];
    rules?: KnowledgeRule[];
  };
}

export interface KnowledgeFact {
  statement: string;
  confidence: number;
  source?: string;
  validFrom?: string;
  validUntil?: string;
}

export interface KnowledgeRule {
  condition: string;
  consequence: string;
  priority?: number;
}
