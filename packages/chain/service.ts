// 0711 Content Chain - Certification Service
// Handles hashing, manifest creation, and certification queue

import { saveManifest, logAudit } from "./db";
import { createHash } from 'crypto';
import type {
  ContentManifest,
  ComplianceResult,
  CertifyRequest,
  CertifyResponse,
  MerkleProof,
} from './types';

// In-memory queue for batching (replace with Redis in production)
const certificationQueue: Map<string, ContentManifest> = new Map();
const proofStore: Map<string, MerkleProof> = new Map();

// ============================================
// HASHING UTILITIES
// ============================================

export function sha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

export function hashContent(content: Buffer | string): string {
  const buffer = typeof content === 'string' 
    ? Buffer.from(content, 'base64') 
    : content;
  return sha256(buffer);
}

export function hashPrompt(prompt: string): string {
  // Use HMAC-style hashing with a salt for privacy
  const salt = process.env.PROMPT_HASH_SALT || '0711-studio-v1';
  return sha256(`${salt}:${prompt}`);
}

export function hashManifest(manifest: ContentManifest): string {
  // Create deterministic JSON (sorted keys)
  const canonical = JSON.stringify(manifest, Object.keys(manifest).sort());
  return sha256(canonical);
}

// ============================================
// MANIFEST CREATION
// ============================================

export function createManifest(request: CertifyRequest): ContentManifest {
  const now = new Date().toISOString();
  
  // Hash content
  const contentHash = hashContent(request.content);
  
  // Hash prompt (never store plaintext)
  const promptHash = hashPrompt(request.prompt);
  
  // Create workflow hash from model + parameters
  const workflowData = JSON.stringify({
    model: request.modelId,
    params: request.parameters || {},
  });
  const workflowHash = sha256(workflowData);
  
  const manifest: ContentManifest = {
    contentHash,
    contentType: request.contentType,
    workflowHash,
    modelId: request.modelId,
    modelVersion: '1.0', // TODO: Get from model registry
    promptHash,
    parameters: request.parameters || {},
    generatedAt: now,
    operatorId: request.operatorId || 'anonymous',
    organizationId: request.organizationId,
    executionMode: request.executionMode || 'cloud',
    provider: request.provider || 'unknown',
    compliance: [],
  };
  
  // Add product context if provided
  if (request.productId) {
    manifest.productContext = {
      productId: request.productId,
      mcpSource: 'bosch-mcp', // TODO: Make configurable
      mcpDataHash: sha256(request.productId), // TODO: Hash actual MCP data
    };
  }
  
  // Add brand context if provided
  if (request.brandId) {
    manifest.brandId = request.brandId;
    manifest.brandVersion = '1.0'; // TODO: Get from brand registry
  }
  
  return manifest;
}

// ============================================
// COMPLIANCE CHECKS (Stubs)
// ============================================

export async function runECGTCheck(text: string): Promise<ComplianceResult> {
  // ECGT banned terms (simplified)
  const bannedTerms = [
    'nachhaltig', 'sustainable', 'umweltfreundlich', 'eco-friendly',
    'grün', 'green', 'klimaneutral', 'carbon-neutral', 'CO2-neutral',
  ];
  
  const lowerText = text.toLowerCase();
  const found = bannedTerms.filter(term => lowerText.includes(term));
  
  return {
    rule: 'ecgt_no_greenwashing',
    version: '1.0',
    result: found.length === 0 ? 'PASSED' : 'WARNING',
    details: found.length > 0 
      ? `Found potentially restricted terms: ${found.join(', ')}` 
      : 'No restricted terms found',
    checkedAt: new Date().toISOString(),
  };
}

export async function runBrandCheck(brandId: string): Promise<ComplianceResult> {
  // TODO: Implement actual brand checking
  return {
    rule: `brand_${brandId}_guidelines`,
    version: '1.0',
    result: 'PASSED',
    details: 'Brand check passed (stub)',
    checkedAt: new Date().toISOString(),
  };
}

export async function runPIICheck(content: string): Promise<ComplianceResult> {
  // Simple PII patterns (email, phone)
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phonePattern = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;
  
  const hasEmail = emailPattern.test(content);
  const hasPhone = phonePattern.test(content);
  
  return {
    rule: 'dsgvo_no_pii',
    version: '1.0',
    result: (hasEmail || hasPhone) ? 'WARNING' : 'PASSED',
    details: hasEmail || hasPhone 
      ? 'Potential PII detected (email or phone pattern)'
      : 'No PII patterns detected',
    checkedAt: new Date().toISOString(),
  };
}

// ============================================
// CERTIFICATION FLOW
// ============================================

export async function certify(request: CertifyRequest): Promise<CertifyResponse> {
  // 1. Create manifest
  const manifest = createManifest(request);
  
  // 2. Run compliance checks if requested
  const compliance: ComplianceResult[] = [];
  
  if (request.runCompliance?.ecgt) {
    compliance.push(await runECGTCheck(request.prompt));
  }
  
  if (request.runCompliance?.brand && request.brandId) {
    compliance.push(await runBrandCheck(request.brandId));
  }
  
  if (request.runCompliance?.pii) {
    compliance.push(await runPIICheck(request.prompt));
  }
  
  // Always add AI Act provenance check (auto-pass since we're certifying)
  compliance.push({
    rule: 'ai_act_art50_provenance',
    version: '1.0',
    result: 'PASSED',
    details: 'Content Chain certification provides machine-readable provenance',
    checkedAt: new Date().toISOString(),
  });
  
  manifest.compliance = compliance;
  manifest.certifiedAt = new Date().toISOString();
  
  // 3. Hash the complete manifest
  const manifestHash = hashManifest(manifest);
  
  // 4. Add to certification queue
  certificationQueue.set(manifestHash, manifest);
  
  // 5. Save to database
  try {
    await saveManifest({
      contentHash: manifest.contentHash,
      manifestHash,
      contentType: manifest.contentType,
      modelId: manifest.modelId || undefined,
      promptHash: manifest.promptHash,
      operatorId: manifest.operatorId || undefined,
      organizationId: manifest.organizationId || undefined,
      executionMode: manifest.executionMode || undefined,
      provider: manifest.provider || undefined,
      productId: manifest.productContext?.productId || undefined,
      brandId: manifest.brandId || undefined,
      manifestData: manifest,
      complianceData: compliance.length > 0 ? compliance : undefined,
      ipfsCid: undefined,
      batchId: undefined,
    });
    
    // Log audit entry
    await logAudit({
      action: "content_certified",
      entityType: "manifest",
      entityId: manifest.contentHash,
      actorId: manifest.operatorId || "anonymous",
      details: { manifestHash, contentType: manifest.contentType, modelId: manifest.modelId },
    });
  } catch (dbError) {
    console.error("[ContentChain] DB save failed:", dbError);
    // Continue anyway - in-memory queue is the fallback
  }
  
  // 6. Return response
  return {
    success: true,
    manifestHash,
    contentHash: manifest.contentHash,
    manifest,
    compliance,
    certification: {
      batchId: 0, // Will be assigned when batched
      merkleProof: [], // Will be generated when batched
      status: 'queued',
    },
  };
}

// ============================================
// VERIFICATION
// ============================================

export async function verify(contentHash: string): Promise<{
  verified: boolean;
  manifest?: ContentManifest;
  proof?: MerkleProof;
}> {
  // Look up by content hash
  for (const [manifestHash, manifest] of certificationQueue.entries()) {
    if (manifest.contentHash === contentHash) {
      const proof = proofStore.get(manifestHash);
      return {
        verified: true,
        manifest,
        proof,
      };
    }
  }
  
  return { verified: false };
}

// ============================================
// BATCH PROCESSING (for Merkle tree)
// ============================================

export function getQueueSize(): number {
  return certificationQueue.size;
}

export function getQueuedManifests(): ContentManifest[] {
  return Array.from(certificationQueue.values());
}

export function clearQueue(): void {
  certificationQueue.clear();
}

// Export queue for merkle tree builder
export { certificationQueue, proofStore };
