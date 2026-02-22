// Digital Product Passport Types
// Based on EU ESPR (Ecodesign for Sustainable Products Regulation)

export interface DigitalProductPassport {
  // === Identification ===
  id: string;                    // Unique DPP ID
  version: string;               // DPP schema version
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  
  // === Product Information ===
  product: {
    id: string;                  // Internal product ID (e.g., supplier_pid)
    gtin?: string;               // Global Trade Item Number (EAN/UPC)
    name: string;                // Product name
    description: string;         // Product description
    manufacturer: string;        // Manufacturer name
    brand: string;               // Brand name
    model: string;               // Model identifier
    category: string;            // Product category
    productLine?: string;        // Product line (e.g., CS7001iAW)
    etimClass?: string;          // ETIM class code (e.g., EC012034)
    imageUrl?: string;           // Product image URL
  };
  
  // === Sustainability Data ===
  sustainability?: {
    carbonFootprint?: number;    // kg CO2e per unit
    recycledContent?: number;    // Percentage (0-100)
    recyclability?: number;      // Percentage (0-100)
    durability?: number;         // Expected lifespan in years
    repairabilityScore?: number; // Score (1-10)
    energyClass?: string;        // A+++ to G (best available)
    energyClass35?: string;      // Energy class at 35°C
    energyClass55?: string;      // Energy class at 55°C
    energyConsumption?: number;  // kWh per year
    waterConsumption?: number;   // Liters per year
    // Heat pump specific
    scop35?: number;             // SCOP at 35°C
    scop55?: number;             // SCOP at 55°C
    cop?: number;                // COP at 7/35°C
    refrigerant?: string;        // Refrigerant type (e.g., R290)
    gwp?: number;                // Global Warming Potential
  };
  
  // === Technical Specifications ===
  specifications?: {
    dimensions?: {
      width?: number;            // mm
      height?: number;           // mm
      depth?: number;            // mm
      weight?: number;           // kg
      unit?: string;             // dimension unit
      weightUnit?: string;       // weight unit
    };
    performance?: Record<string, string | number>;
    materials?: Array<{
      name: string;
      percentage: number;
      recyclable: boolean;
    }>;
  };
  
  // === Data Quality ===
  dataQuality?: {
    filledFeatures: number;      // Number of filled ETIM features
    totalFeatures: number;       // Total required features
    coverage: number;            // Percentage (0-100)
    sources?: Record<string, number>; // Features by source (datasheet, database, etc.)
  };
  
  // === Compliance & Certifications ===
  compliance: {
    ecgt?: {
      passed: boolean;
      score: number;
      checkedAt: string;
      violations?: string[];
    };
    pii?: {
      passed: boolean;
      score: number;
      checkedAt: string;
    };
    aiAct?: {
      compliant: boolean;
      provenance: boolean;
      checkedAt: string;
    };
    c2pa?: {
      signed: boolean;
      manifestId?: string;
      signedAt?: string;
    };
    certifications?: Array<{
      name: string;              // e.g., "CE", "Energy Star", "TÜV"
      issuer: string;
      validUntil?: string;
      documentUrl?: string;
    }>;
  };
  
  // === Content Chain (Blockchain) ===
  contentChain?: {
    enabled: boolean;
    batchId?: number;
    merkleRoot?: string;
    merkleProof?: string[];
    txHash?: string;
    blockNumber?: number;
    network: string;             // e.g., "base-mainnet"
    contractAddress: string;
    ipfsCid?: string;
    verificationUrl?: string;
  };
  
  // === Generation Context ===
  generation?: {
    prompt?: string;             // AI generation prompt (hashed)
    modelId?: string;            // AI model used
    operatorId?: string;         // Who generated
    organizationId?: string;     // Organization
    timestamp?: string;          // When generated
  };
  
  // === Verification ===
  verification: {
    qrCodeUrl: string;           // QR code image URL
    verifyUrl: string;           // Public verification URL
    contentHash: string;         // SHA-256 hash of DPP content
  };
}

export interface DPPCreateRequest {
  productId: string;             // Product identifier (from MCP/database)
  includeAI?: boolean;           // Include AI generation data
  includeSustainability?: boolean;
  includeCompliance?: boolean;
  signC2PA?: boolean;            // Sign with C2PA
  certifyBlockchain?: boolean;   // Anchor to blockchain
  organizationId?: string;
  operatorId?: string;
}

export interface DPPCreateResponse {
  success: boolean;
  dpp?: DigitalProductPassport;
  qrCodeDataUrl?: string;        // Base64 QR code image
  error?: string;
}

export interface DPPVerifyResponse {
  success: boolean;
  verified: boolean;
  dpp?: DigitalProductPassport;
  blockchainVerified?: boolean;
  c2paVerified?: boolean;
  tamperedFields?: string[];
  error?: string;
}
