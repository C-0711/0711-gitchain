/**
 * Core types for GitChain containers
 */

// Container types - Universal Knowledge Containers
export type ContainerType =
  | "product"     // Product data + ETIM + media
  | "session"     // AI conversation history
  | "project"     // Codebase + dev context
  | "legal"       // Contracts, cases, compliance
  | "tax"         // Declarations, receipts
  | "marketing"   // Campaigns, assets, copy
  | "docs"        // Internal documentation/knowledge base
  | "campaign"    // Marketing campaigns (legacy, use marketing)
  | "memory"      // Agent learning (legacy, use session)
  | "knowledge"   // Domain facts (legacy, use docs)
  | "custom";     // User-defined container types

// Container namespace patterns
// Format: {company}:{type}:{identifier...}
// Examples:
//   bosch:product:compress:7739622385
//   bosch:session:christoph:vaultclaw-ui
//   bosch:project:etim-api
//   bosch:legal:case:patent-2024
//   bosch:tax:2025:corporate
//   bosch:marketing:launch-2026
//   bosch:docs:onboarding

// Visibility levels
export type ContainerVisibility =
  | "private"          // Only owner + explicitly shared
  | "org"              // Anyone in company can view
  | "public_unlisted"  // Anyone with link can view
  | "public";          // Discoverable in search/browse

// Ownership levels
export type OwnerType = "user" | "team" | "org";

// Container-level roles
export type ContainerRole = "maintainer" | "editor" | "reviewer" | "viewer" | "agent";

// Organization-level roles
export type OrgRole = "owner" | "admin" | "maintainer" | "member" | "viewer" | "guest";

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

// ===========================================
// NEW CONTAINER TYPES (Enterprise Model)
// ===========================================

// Session container - AI conversation history
export interface SessionContainer extends Container {
  type: "session";
  data: {
    name: string;
    userId: string;
    agentId?: string;
    turns: SessionTurn[];
    artifacts?: SessionArtifact[];
    context?: Record<string, unknown>;
    parentSessionId?: string;  // For resumed sessions
    status: "active" | "completed" | "archived";
  };
}

export interface SessionTurn {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: string;
  tokens?: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  duration?: number;
}

export interface SessionArtifact {
  type: "code" | "file" | "decision" | "note";
  name: string;
  content: string;
  language?: string;
  path?: string;
  createdAt: string;
}

// Legal container - Contracts, cases, compliance
export interface LegalContainer extends Container {
  type: "legal";
  data: {
    name: string;
    documentType: "contract" | "case" | "compliance" | "policy" | "nda" | "other";
    parties?: string[];
    effectiveDate?: string;
    expirationDate?: string;
    status: "draft" | "active" | "expired" | "terminated";
    clauses?: LegalClause[];
    attachments?: string[];
    confidentialityLevel?: "public" | "internal" | "confidential" | "restricted";
  };
}

export interface LegalClause {
  id: string;
  title: string;
  content: string;
  type?: string;
  aiExtracted?: boolean;
}

// Tax container - Declarations, receipts
export interface TaxContainer extends Container {
  type: "tax";
  data: {
    name: string;
    year: number;
    taxType: "corporate" | "vat" | "income" | "property" | "other";
    jurisdiction: string;
    status: "draft" | "submitted" | "accepted" | "rejected" | "amended";
    filingDate?: string;
    dueDate?: string;
    amount?: number;
    currency?: string;
    documents?: TaxDocument[];
  };
}

export interface TaxDocument {
  type: "receipt" | "declaration" | "assessment" | "correspondence";
  filename: string;
  date: string;
  amount?: number;
}

// Marketing container - Campaigns, assets, content
export interface MarketingContainer extends Container {
  type: "marketing";
  data: {
    name: string;
    contentType: "copy" | "asset" | "campaign" | "landing_page" | "email" | "social";
    channel?: string;  // website, amazon, instagram, linkedin, etc.
    targetAudience?: string;
    language?: string;
    status: "draft" | "review" | "approved" | "published" | "archived";
    content?: string;
    assets?: MarketingAsset[];
    sourceContainers?: string[];  // Product containers this content is based on
    approvedBy?: string;
    publishedAt?: string;
  };
}

export interface MarketingAsset {
  type: "image" | "video" | "document" | "audio";
  filename: string;
  url?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
}

// Docs container - Internal documentation
export interface DocsContainer extends Container {
  type: "docs";
  data: {
    name: string;
    docType: "guide" | "reference" | "tutorial" | "faq" | "changelog" | "other";
    content: string;
    format: "markdown" | "html" | "text";
    category?: string;
    tags?: string[];
    lastReviewedAt?: string;
    lastReviewedBy?: string;
  };
}

// ===========================================
// HELPER TYPES
// ===========================================

// Supported file types for import
export type SupportedFileType =
  // Documents
  | "pdf" | "docx" | "xlsx" | "pptx" | "txt" | "md" | "html"
  // Data
  | "json" | "xml" | "csv" | "yaml" | "bmcat"
  // Images
  | "jpg" | "jpeg" | "png" | "webp" | "svg" | "tiff" | "raw"
  // 3D/CAD
  | "step" | "stl" | "obj" | "gltf" | "dwg" | "dxf"
  // Video
  | "mp4" | "mov" | "webm"
  // Audio
  | "mp3" | "wav" | "m4a"
  // Archives
  | "zip" | "tar" | "gz"
  // Code (any extension)
  | "code";

// Container ID parser
export function parseContainerId(containerId: string): {
  prefix: string;
  type: string;
  namespace: string;
  identifier: string;
  version?: number;
} | null {
  const parts = containerId.split(":");
  if (parts.length < 4) return null;

  const [prefix, type, namespace, ...rest] = parts;
  const lastPart = rest[rest.length - 1];

  // Check if last part is a version number
  const versionMatch = lastPart?.match(/^v?(\d+)$/);
  let identifier: string;
  let version: number | undefined;

  if (versionMatch && rest.length > 1) {
    version = parseInt(versionMatch[1]);
    identifier = rest.slice(0, -1).join(":");
  } else {
    identifier = rest.join(":");
  }

  return { prefix, type, namespace, identifier, version };
}

// Build container ID
export function buildContainerId(
  type: string,
  namespace: string,
  identifier: string,
  version?: number
): string {
  const base = `0711:${type}:${namespace}:${identifier}`;
  return version ? `${base}:v${version}` : base;
}
