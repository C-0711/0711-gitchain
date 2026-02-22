/**
 * DPP Compliance Validation Rules
 * Comprehensive validation for EU Digital Product Passport
 */

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  score: number
}

export interface ValidationError {
  code: string
  field: string
  message: string
  severity: 'critical' | 'error'
}

export interface ValidationWarning {
  code: string
  field: string
  message: string
  recommendation: string
}

// Validation Rules
const RULES = {
  // Identity Rules
  productId: {
    required: true,
    pattern: /^[A-Za-z0-9\-_]+$/,
    minLength: 5,
    maxLength: 50,
  },
  productName: {
    required: true,
    minLength: 3,
    maxLength: 200,
  },
  manufacturer: {
    required: true,
    minLength: 2,
  },
  
  // Feature Rules
  features: {
    minCount: 10,
    minFillRate: 0.5,
    requiredCodes: ['EF000008', 'EF000040', 'EF000049'], // Width, Height, Depth
  },
  
  // Citation Rules
  citations: {
    minCount: 5,
    requiredConfidence: 0.8,
  },
  
  // Energy Rules
  energyClass: {
    validValues: ['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
  },
}

export function validateDPPCompliance(dpp: any): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  let score = 100
  
  // Product Identity
  if (!dpp.product?.identifier) {
    errors.push({
      code: 'MISSING_ID',
      field: 'product.identifier',
      message: 'Product identifier is required',
      severity: 'critical',
    })
    score -= 20
  }
  
  if (!dpp.product?.name) {
    errors.push({
      code: 'MISSING_NAME',
      field: 'product.name',
      message: 'Product name is required',
      severity: 'error',
    })
    score -= 10
  }
  
  if (!dpp.product?.manufacturer) {
    errors.push({
      code: 'MISSING_MANUFACTURER',
      field: 'product.manufacturer',
      message: 'Manufacturer is required for EU compliance',
      severity: 'error',
    })
    score -= 10
  }
  
  // Specifications
  const specCount = dpp.specifications?.length || 0
  if (specCount < RULES.features.minCount) {
    warnings.push({
      code: 'LOW_SPEC_COUNT',
      field: 'specifications',
      message: `Only ${specCount} specifications found`,
      recommendation: `Include at least ${RULES.features.minCount} specifications for full compliance`,
    })
    score -= 5
  }
  
  // Fill Rate
  const filledSpecs = dpp.specifications?.filter((s: any) => s.value)?.length || 0
  const fillRate = specCount > 0 ? filledSpecs / specCount : 0
  if (fillRate < RULES.features.minFillRate) {
    warnings.push({
      code: 'LOW_FILL_RATE',
      field: 'specifications',
      message: `Fill rate is ${(fillRate * 100).toFixed(1)}%`,
      recommendation: 'Increase specification coverage to at least 50%',
    })
    score -= 5
  }
  
  // Energy Class
  if (dpp.sustainability?.energyClass) {
    if (!RULES.energyClass.validValues.includes(dpp.sustainability.energyClass)) {
      errors.push({
        code: 'INVALID_ENERGY_CLASS',
        field: 'sustainability.energyClass',
        message: 'Invalid energy efficiency class',
        severity: 'error',
      })
      score -= 10
    }
  } else {
    warnings.push({
      code: 'MISSING_ENERGY_CLASS',
      field: 'sustainability.energyClass',
      message: 'Energy class not specified',
      recommendation: 'Add energy efficiency class for EU compliance',
    })
    score -= 5
  }
  
  // Citations/Provenance
  const citationCount = dpp.provenance?.citations?.length || 0
  if (citationCount < RULES.citations.minCount) {
    warnings.push({
      code: 'LOW_CITATION_COUNT',
      field: 'provenance.citations',
      message: `Only ${citationCount} citations found`,
      recommendation: 'Add more source citations for better traceability',
    })
    score -= 5
  }
  
  // Blockchain
  if (!dpp.blockchain?.contractAddress) {
    warnings.push({
      code: 'NO_BLOCKCHAIN',
      field: 'blockchain',
      message: 'Not anchored to blockchain',
      recommendation: 'Anchor to blockchain for immutable provenance',
    })
    score -= 5
  }
  
  return {
    valid: errors.filter(e => e.severity === 'critical').length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  }
}

export default { validateDPPCompliance }
