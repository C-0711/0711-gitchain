/**
 * Container to Digital Product Passport (DPP) Transformer
 * Converts 0711 Product Containers to EU DPP format
 */

import { createHash } from 'crypto'

// EU DPP Schema based on ESPR (Ecodesign for Sustainable Products Regulation)
export interface DigitalProductPassport {
  // Identification
  passportId: string
  version: string
  issuedAt: string
  validUntil?: string
  
  // Product Identity
  product: {
    identifier: string // GTIN, supplier_pid
    name: string
    manufacturer: string
    model?: string
    batchNumber?: string
    serialNumber?: string
  }
  
  // Sustainability Information
  sustainability: {
    carbonFootprint?: {
      value: number
      unit: string
      scope: string
    }
    recyclability?: {
      percentage: number
      materials: MaterialComposition[]
    }
    energyClass?: string
    durability?: {
      expectedLifespan: number
      unit: string
    }
  }
  
  // Technical Specifications
  specifications: DPPSpecification[]
  
  // Compliance & Certifications
  compliance: {
    regulations: string[]
    certifications: Certification[]
    declarations: Declaration[]
  }
  
  // Supply Chain
  supplyChain?: {
    origin: string
    manufacturingLocation?: string
    components?: SupplyChainComponent[]
  }
  
  // Documentation
  documents: DPPDocument[]
  
  // Blockchain Anchoring
  blockchain?: {
    network: string
    contractAddress: string
    tokenId?: string
    transactionHash?: string
    timestamp?: string
  }
  
  // Provenance
  provenance: {
    citations: Citation[]
    auditTrail: AuditEntry[]
    contentHash: string
  }
}

export interface MaterialComposition {
  material: string
  percentage: number
  recyclable: boolean
  hazardous: boolean
}

export interface DPPSpecification {
  code: string
  name: string
  value: string
  unit?: string
  source: string
  confidence: 'confirmed' | 'likely' | 'conflict' | 'not_found'
}

export interface Certification {
  name: string
  issuer: string
  validFrom: string
  validUntil?: string
  certificateId?: string
  verificationUrl?: string
}

export interface Declaration {
  type: string
  statement: string
  date: string
  signatory?: string
}

export interface SupplyChainComponent {
  name: string
  supplier?: string
  origin?: string
  sustainabilityScore?: number
}

export interface DPPDocument {
  type: string
  title: string
  url?: string
  hash?: string
  pages?: number
}

export interface Citation {
  featureCode: string
  documentId: string
  pageNumber?: number
  quote?: string
  extractionMethod: string
}

export interface AuditEntry {
  timestamp: string
  action: string
  actor: string
  details?: string
}

// Container interface (from 0711 Product Container)
export interface ProductContainer {
  product: {
    supplier_pid: string
    product_name: string
    description_short?: string
    description_long?: string
    product_line?: string
    etim_class_code?: string
    fill_rate?: number
  }
  coverage: {
    filled: number
    total: number
  }
  features: ContainerFeature[]
  citations?: ContainerCitation[]
  media?: ContainerMedia[]
}

export interface ContainerFeature {
  code: string
  name: string
  value: string | null
  unit?: string
  source: string
  status: string
  audit_confidence: string
  audit_method?: string
}

export interface ContainerCitation {
  feature_code: string
  document_id: string
  page_number?: number
  quote?: string
  confidence: string
}

export interface ContainerMedia {
  type: string
  url: string
  filename?: string
}

/**
 * Transform a Product Container into a Digital Product Passport
 */
export function containerToDPP(
  container: ProductContainer,
  options: {
    manufacturer?: string
    blockchainNetwork?: string
    contractAddress?: string
  } = {}
): DigitalProductPassport {
  const now = new Date().toISOString()
  
  // Generate passport ID
  const passportId = generatePassportId(container.product.supplier_pid)
  
  // Extract specifications from features
  const specifications: DPPSpecification[] = container.features
    .filter(f => f.value !== null)
    .map(f => ({
      code: f.code,
      name: f.name,
      value: String(f.value),
      unit: f.unit,
      source: f.source,
      confidence: f.audit_confidence as DPPSpecification['confidence'],
    }))
  
  // Extract energy class if available
  const energyClassFeature = container.features.find(f => 
    f.name.toLowerCase().includes('energieeffizienz') ||
    f.name.toLowerCase().includes('energy class')
  )
  
  // Extract dimensions for sustainability
  const weightFeature = container.features.find(f => f.code === 'EF000167')
  
  // Build citations for provenance
  const citations: Citation[] = (container.citations || []).map(c => ({
    featureCode: c.feature_code,
    documentId: c.document_id,
    pageNumber: c.page_number,
    quote: c.quote,
    extractionMethod: 'claude_citation_audit_v1',
  }))
  
  // Build documents list from media
  const documents: DPPDocument[] = (container.media || []).map(m => ({
    type: m.type,
    title: m.filename || m.url.split('/').pop() || 'Document',
    url: m.url,
  }))
  
  // Calculate content hash for integrity
  const contentHash = calculateContentHash(container)
  
  const dpp: DigitalProductPassport = {
    passportId,
    version: '1.0',
    issuedAt: now,
    
    product: {
      identifier: container.product.supplier_pid,
      name: container.product.product_name,
      manufacturer: options.manufacturer || 'Unknown',
      model: container.product.product_line,
    },
    
    sustainability: {
      energyClass: energyClassFeature?.value || undefined,
      durability: weightFeature ? {
        expectedLifespan: 15,
        unit: 'years',
      } : undefined,
    },
    
    specifications,
    
    compliance: {
      regulations: ['EU 2024/1781 (ESPR)', 'EU 811/2013'],
      certifications: [],
      declarations: [],
    },
    
    documents,
    
    blockchain: options.contractAddress ? {
      network: options.blockchainNetwork || 'base',
      contractAddress: options.contractAddress,
    } : undefined,
    
    provenance: {
      citations,
      auditTrail: [{
        timestamp: now,
        action: 'DPP_CREATED',
        actor: '0711-Intelligence',
        details: 'Digital Product Passport created from Product Container',
      }],
      contentHash,
    },
  }
  
  return dpp
}

/**
 * Generate unique passport ID
 */
function generatePassportId(productId: string): string {
  const timestamp = Date.now().toString(36)
  const hash = createHash('sha256')
    .update(productId + timestamp)
    .digest('hex')
    .substring(0, 8)
  return `DPP-${timestamp}-${hash.toUpperCase()}`
}

/**
 * Calculate content hash for integrity verification
 */
function calculateContentHash(container: ProductContainer): string {
  const content = JSON.stringify({
    product: container.product,
    features: container.features.map(f => ({
      code: f.code,
      value: f.value,
    })),
  })
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Validate DPP against EU requirements
 */
export function validateDPP(dpp: DigitalProductPassport): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required fields
  if (!dpp.passportId) errors.push('Missing passport ID')
  if (!dpp.product.identifier) errors.push('Missing product identifier')
  if (!dpp.product.name) errors.push('Missing product name')
  if (!dpp.product.manufacturer) errors.push('Missing manufacturer')
  
  // Recommended fields
  if (!dpp.sustainability.energyClass) warnings.push('Missing energy class')
  if (!dpp.sustainability.carbonFootprint) warnings.push('Missing carbon footprint')
  if (dpp.specifications.length < 10) warnings.push('Low specification count')
  if (dpp.provenance.citations.length === 0) warnings.push('No provenance citations')
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Generate QR code data for DPP
 */
export function generateDPPQRData(dpp: DigitalProductPassport): string {
  // EU DPP QR format: URL to verification portal
  const baseUrl = 'https://dpp.0711.io/verify'
  return `${baseUrl}/${dpp.passportId}`
}
