# 0711 Product Container Standard v1.0

## THE STANDARD FOR ELECTRICAL INDUSTRY PRODUCT DATA

**Specification**: 0711-PCS-1.0
**Date**: 2026-02-23
**Author**: 0711 Intelligence
**Blueprint**: Bosch Thermotechnik (23,141 products, 30,156 media files, 194K ETIM features)
**Compliance**: ETIM 10/11, eClass 15, BMEcat 5.0, EU DPP (ESPR 2024/1781), GS1 Digital Link

---

## 1. CORE PRINCIPLE

> **No naked data.** Every value carries its source, trust level, citation, and commit hash.
> One product = one container. All data, all media, all citations, all history — in one place.

A Product Container is a **versioned, blockchain-anchored, Git-tracked envelope** that holds ALL data about a single product from multiple contributors, each with explicit trust and provenance.

---

## 2. CONTAINER ID FORMAT

```
0711:{type}:{namespace}:{identifier}:{version}
```

| Segment | Description | Example |
|---------|-------------|---------|
| `0711` | Standard prefix (immutable) | `0711` |
| `type` | Container type | `product` |
| `namespace` | Manufacturer/owner namespace | `bosch`, `siemens`, `abb` |
| `identifier` | Primary product ID (SNR, GTIN, or manufacturer_aid) | `8738208680` |
| `version` | Semantic version or `latest` | `v3`, `latest` |

**Examples:**
```
0711:product:bosch:8738208680:v3          # Bosch heat pump, version 3
0711:product:siemens:6ES7214-1AG40:v1     # Siemens PLC module
0711:product:abb:2CDS253001R0504:v2       # ABB circuit breaker
0711:product:schneider:A9F74206:latest     # Schneider MCB, latest
```

**Regex:**
```
^0711:product:[a-z0-9-]+:[a-zA-Z0-9._-]+:(v\d+|latest)$
```

---

## 3. THE DATAATOM — Smallest Unit of Truth

Every single piece of data in a container is a **DataAtom** — a value wrapped in mandatory provenance metadata.

```typescript
interface DataAtom<T = unknown> {
  // === THE VALUE ===
  value: T;                          // The actual data (string, number, boolean, object)
  unit?: string;                     // SI unit or ETIM unit code (EU570001)
  lang?: string;                     // ISO 639-1 language code

  // === PROVENANCE (MANDATORY) ===
  source: DataAtomSource;            // Who contributed this data
  trust: TrustLevel;                 // Derived from source type (1-8)
  commit: string;                    // Git commit hash (SHA-256)
  created_at: string;                // ISO 8601 timestamp
  updated_at?: string;               // Last modification

  // === CITATION (Required for trust < "certified") ===
  citation?: DataAtomCitation;       // Document reference proving this value

  // === VERIFICATION (Upgrades trust) ===
  verification?: DataAtomVerification;

  // === AUDIT TRAIL ===
  supersedes?: string[];             // IDs of previous atoms this replaces
}
```

### 3.1 Trust Hierarchy (8 Levels)

Trust is the backbone of the standard. When multiple sources provide the same field, **highest trust wins automatically**.

| Priority | Level | Source Type | Description | Example |
|----------|-------|------------|-------------|---------|
| 1 | `highest` | `manufacturer` | Manufacturer original data | Bosch official datasheet |
| 2 | `high` | `classification` | Classification standards | ETIM 10.0, eClass 15.0 |
| 3 | `certified` | `certification` | Certification bodies | TUV, CE, DPP, ErP labels |
| 4 | `verified` | `ai_verified` | AI + Human confirmed | Claude extracted + human reviewed |
| 5 | `medium` | `ai_generated` | AI generated (unverified) | Claude OCR extraction, unreviewed |
| 6 | `customer` | `customer_extension` | Customer/marketplace additions | Amazon attributes, custom fields |
| 7 | `generated` | `builder_output` | Tool/pipeline output | Auto-generated descriptions |
| 8 | `community` | `community` | Community contributions | User corrections, reviews |

### 3.2 Citation Structure

Every AI-extracted or derived value MUST have a citation back to its source document.

```typescript
interface DataAtomCitation {
  document: string;           // Container ID or filename
                              // e.g., "0711:document:bosch:bodbed_6720869205:v1"
  page?: number;              // Page number in source
  section?: string;           // Section heading
  excerpt?: string;           // Exact quoted text from source
  confidence: number;         // 0.0 - 1.0 (extraction confidence)
  method?: ExtractionMethod;  // How the value was extracted
  status?: CitationStatus;    // Verification status
}

type ExtractionMethod = 'ocr' | 'pdf_parse' | 'table_extraction' | 'nlp' | 'manual';
type CitationStatus = 'confirmed' | 'likely' | 'conflict' | 'not_found';
```

### 3.3 Verification (Upgrades Trust)

When a human or automated process reviews an atom, verification upgrades its trust level.

```typescript
interface DataAtomVerification {
  verified_by: string;        // Contributor ID (human or system)
  verified_at: string;        // ISO 8601 timestamp
  method: VerificationMethod;
  notes?: string;
}

type VerificationMethod =
  | 'human_review'            // Manual check by expert
  | 'automated'               // Automated validation rules
  | 'cross_reference'         // Verified against second source
  | 'multi_source';           // Multiple independent sources agree
```

**Trust upgrade path:**
```
ai_generated (medium=5)
  → human_review → ai_verified (verified=4)
  → cross_reference → certification (certified=3)
```

---

## 4. THE LAYER SYSTEM — Multiple Contributors, One Container

A container holds data from multiple contributors organized in **layers**. Each layer represents one contributor's data contribution.

```
Container: 0711:product:bosch:8738208680:v3
│
├── Layer 000-core         Trust: HIGHEST    Contributor: Robert Bosch GmbH
├── Layer 001-etim         Trust: HIGH       Contributor: ETIM International
├── Layer 002-eclass       Trust: HIGH       Contributor: eClass e.V.
├── Layer 003-certification Trust: CERTIFIED Contributor: TUV Rheinland
├── Layer 004-ai-enrichment Trust: MEDIUM    Contributor: 0711 AI Pipeline
├── Layer 005-dpp          Trust: CERTIFIED  Contributor: EU DPP Registry
└── Layer 006-community    Trust: COMMUNITY  Contributor: Installer feedback
```

```typescript
interface ContainerLayer {
  id: string;                    // "000-core", "001-etim"
  name: string;                  // "Manufacturer Core Data"
  type: SourceType;              // "manufacturer", "classification", etc.
  contributor_id: string;        // "bosch", "etim-international"
  trust_level: TrustLevel;       // Derived from source type
  requires_verification: boolean; // Must human review before trust upgrade?
  schema_version?: string;       // Version of the layer schema

  // Statistics
  atom_count: number;            // Total atoms in this layer
  verified_count: number;        // Atoms that passed verification
  commit_hash: string;           // Git commit reference

  created_at: string;
  updated_at: string;
}
```

**Conflict Resolution Rule:**
When two layers provide the same field, the atom with the **higher trust level** is the active value. If trust levels are equal, the **most recently verified** atom wins. Conflicts are surfaced for human review.

---

## 5. CONTAINER SCHEMA — The Full Product Envelope

### 5.1 Container Manifest

```typescript
interface ProductContainer {
  // === IDENTITY ===
  id: string;                        // "0711:product:bosch:8738208680:v3"
  type: 'product';
  namespace: string;                 // "bosch"
  identifier: string;               // "8738208680"
  version: number;                   // 3

  // === PRODUCT IDENTITY ===
  identity: {
    supplier_pid: string;            // Primary supplier product ID
    manufacturer_aid?: string;       // Manufacturer article ID
    gtin?: string;                   // GS1 GTIN/EAN
    gtin_type?: 'EAN-13' | 'UPC-A' | 'GTIN-14';
    brand: string;                   // "Bosch"
    manufacturer: string;            // "Robert Bosch GmbH"
    product_name: string;            // "Compress 7000i AW"
    product_line?: string;           // "CS7000iAW"
    product_master_id?: string;      // PM grouping ID
  };

  // === CLASSIFICATION ===
  classification: {
    etim?: {
      class_code: string;            // "EC012034"
      class_name: string;            // "Wärmepumpe Luft/Wasser"
      version: string;               // "10.0"
      group_code?: string;           // "EG000049"
      group_name?: string;           // "Heizgeräte"
    };
    eclass?: {
      irdi: string;                  // "0173-1#01-AKJ020#012"
      code: string;                  // "27-10-92-02"
      name: string;                  // "Wärmepumpe Luft/Wasser"
      version: string;               // "15.0"
    };
    unspsc?: string;                 // UN Standard Products and Services Code
    customs_tariff?: string;         // HS/CN code for trade
  };

  // === TECHNICAL FEATURES ===
  features: DataAtom[];              // All ETIM/eClass features as atoms
                                     // (see Section 5.2)

  // === MEDIA & DOCUMENTS ===
  media: MediaManifest;              // All linked media files
                                     // (see Section 5.3)

  // === DOCUMENTS & EXTRACTED CONTENT ===
  documents: DocumentManifest;       // PDFs with OCR content
                                     // (see Section 5.4)

  // === GENERATED CONTENT ===
  content: ContentManifest;          // B2B/B2C factsheet content
                                     // (see Section 5.5)

  // === DIGITAL PRODUCT PASSPORT ===
  dpp?: DigitalProductPassport;      // EU ESPR compliance
                                     // (see Section 5.6)

  // === RELATIONSHIPS ===
  relationships: {
    siblings: string[];              // Other containers in same PM group
    accessories: string[];           // Compatible accessories
    replaces?: string[];             // Predecessor products
    replaced_by?: string[];          // Successor products
  };

  // === PROVENANCE ===
  layers: ContainerLayer[];          // All contributing layers
  contributors: Contributor[];       // All contributing entities
  stats: ContainerStats;

  // === VERSIONING ===
  content_hash: string;              // SHA-256 of container data
  commit_history: CommitInfo[];      // Git-like version history
  anchor?: BlockchainAnchor;         // On-chain proof
}
```

### 5.2 Technical Features (ETIM/eClass)

Based on ETIM 10.0 with 88 features per heat pump class (EC012034):

```typescript
interface FeatureAtom extends DataAtom {
  // ETIM identification
  field_path: string;                // "etim.EF020090"
  field_name: string;                // "Nennheizleistung"

  // Value (polymorphic)
  value: string | number | boolean;
  value_type: 'text' | 'numeric' | 'boolean' | 'enum';
  unit?: string;                     // "kW", "mm", "Hz"

  // ETIM-specific
  etim_feature_code?: string;        // "EF020090"
  etim_value_code?: string;          // "EV000123" (for enumerated values)
  etim_unit_code?: string;           // "EU570001"

  // eClass cross-reference
  eclass_irdi?: string;              // "0173-1#02-AAJ957#005"
  eclass_property_name?: string;     // "Nennwärmeleistung"
}
```

**Real Example (from Bosch blueprint):**
```json
{
  "field_path": "etim.EF020090",
  "field_name": "Nennheizleistung",
  "value": 7.0,
  "value_type": "numeric",
  "unit": "kW",
  "etim_feature_code": "EF020090",
  "source": {
    "type": "ai_verified",
    "contributor_id": "bombas@0711.io",
    "layer_id": "002-ai-enrichment"
  },
  "trust": "verified",
  "citation": {
    "document": "0711:document:bosch:bodbed_6720869205:v1",
    "page": 2,
    "excerpt": "Heizleistung bei A7/W35: 7,0 kW",
    "confidence": 0.95,
    "method": "ocr",
    "status": "confirmed"
  },
  "commit": "sha256:7e1d3f9a..."
}
```

### 5.3 Media Manifest

Based on Bosch's 15 document types and 30,156 physical files:

```typescript
interface MediaManifest {
  total_files: number;
  total_size_bytes: number;

  // === IMAGES ===
  images: {
    product_front: MediaReference;       // B_ base image (print)
    product_web: MediaReference;         // B_ base image (web)
    angle_30: MediaReference;            // U-Type angle view
    in_situ: MediaReference;             // Installation photo
    packaging: MediaReference;           // X_ packaging image
    sectional_view: MediaReference;      // Cutaway diagram
    supplementary: MediaReference[];     // Additional images
  };

  // === CAD / TECHNICAL DRAWINGS ===
  cad: {
    model_3d: MediaReference[];          // 3C: 3D CAD (DXF, DWG, STP, STEP)
    drawing_front: MediaReference[];     // 2F: Front/elevation (DXF, DWG)
    drawing_side: MediaReference[];      // 2S: Side view (DXF, DWG)
    drawing_ortho: MediaReference[];     // 2D: Orthogonal (DXF, DWG)
    dimensions?: {                       // Extracted from CAD
      height_mm: number;
      width_mm: number;
      depth_mm: number;
    };
  };

  // === DOCUMENTS ===
  documents: {
    datasheet: MediaReference[];         // DB: Technical data sheets (PDF)
    installation_manual: MediaReference[]; // MA: Montageanleitung (PDF)
    operating_manual: MediaReference[];  // IS: Betriebsanleitung (PDF)
    electrical_docs: MediaReference[];   // EL: Electrical documentation (PDF)
    parts_list: MediaReference[];        // PA: Parts/accessories (PDF)
    service_bulletin: MediaReference[];  // SB: Service bulletins (PDF)
    safety_docs: MediaReference[];       // GG: Safety/warranty (PDF)
    warranty: MediaReference[];          // WA: Warranty documents (PDF)
  };

  // === VIDEO ===
  video: MediaReference[];              // VI: Product videos (MP4)
}

interface MediaReference {
  filename: string;                     // "bob_00335430_druck.jpg"
  container_ref?: string;               // "0711:document:bosch:bob_00335430:v1"
  media_type: string;                   // MIME type
  file_size_bytes?: number;
  document_type_code: string;           // Bosch code: "B_", "DB", "MA", etc.
  usage: string;                        // "print", "web", "technical"
  description?: string;
  sort_order: number;

  // For PDFs: extracted content
  extracted_content?: {
    full_text: string;                  // OCR text
    page_count: number;
    extraction_method: string;          // "pixtral_ocr", "pdfplumber"
    extraction_quality: string;         // "high", "medium", "low"
    extracted_specs?: Record<string, any>; // Structured specs found
    sections?: string[];                // Document section headings
  };
}
```

**Document Type Registry (extensible by manufacturer):**

| Code | Category | MIME Types | Description |
|------|----------|-----------|-------------|
| `B_` | image | image/jpeg, image/png | Base product image |
| `X_` | image | image/png | Supplementary/packaging image |
| `2D` | cad | application/acad, application/dxf | 2D orthogonal drawing |
| `2F` | cad | application/acad, application/dxf | 2D front/elevation view |
| `2S` | cad | application/acad, application/dxf | 2D side view |
| `3C` | cad | application/dxf, model/step | 3D CAD model |
| `DB` | document | application/pdf | Technical data sheet |
| `EL` | document | application/pdf | Electrical documentation |
| `IS` | document | application/pdf | Operating manual |
| `MA` | document | application/pdf | Installation manual |
| `PA` | document | application/pdf | Parts/accessories list |
| `SB` | document | application/pdf | Service bulletin |
| `GG` | document | application/pdf | Safety/warranty documentation |
| `WA` | document | application/pdf | Warranty information |
| `VI` | video | video/mp4 | Product video |
| `CE` | document | application/pdf | CE declaration of conformity |
| `EP` | document | application/pdf | ErP/Energy label |
| `DP` | document | application/pdf | Digital Product Passport |
| `BIM` | model | application/ifc | BIM model (IFC format) |

### 5.4 Document Manifest

Documents that have been processed for content extraction:

```typescript
interface DocumentManifest {
  total_documents: number;
  total_pages: number;
  extraction_coverage: number;         // 0.0-1.0

  documents: ProcessedDocument[];
}

interface ProcessedDocument {
  filename: string;
  document_type: string;               // "datasheet", "installation_manual"
  document_type_code: string;          // "DB", "MA"
  language: string;                    // "de", "en"

  // Extraction results
  content_text: string;                // Full OCR text
  content_length: number;
  page_count: number;
  extraction_method: string;           // "pixtral_ocr", "tesseract", "pdfplumber"
  extraction_quality: number;          // 0.0-1.0
  extracted_specs: Record<string, any>;
  extracted_sections: string[];

  // Provenance
  source: DataAtomSource;
  processed_at: string;
}
```

### 5.5 Content Manifest (Generated Factsheets)

Marketing content generated from technical data, following content rules:

```typescript
interface ContentManifest {
  version: string;                     // "V6.2" (content rules version)

  b2b: {
    main_claim: string;                // Max 100 chars, 1 brand mention
    headline: string;                  // Max 100 chars
    short_description: string;         // Max 250 chars
    highlights: string[];              // 5x, max 120 chars each
    benefits: Benefit[];               // 3x, each with headline + 4 reasons
    product_description: string[];     // Max 15 lines, 200 chars each
    equipment: string[];               // Max 15 lines, variant-specific
    notes: string[];                   // Max 3 lines, 200 chars each
    application: string[];             // Max 3 lines, 200 chars each
  };

  b2c: {
    main_claim: string;                // Consumer version, no technical values
    headline: string;
    short_description: string;
    highlights: string[];              // No kW, dB, SCOP numbers
    benefits: Benefit[];               // Outcome-focused
    derived_from: 'b2b' | 'website';
  };

  content_rules: {
    terminology_applied: boolean;
    character_limits_validated: boolean;
    forbidden_patterns_checked: boolean;
    brand_mentions_validated: boolean;
  };
}

interface Benefit {
  headline: string;                    // Max 120 chars
  reason_why: string[];                // 4x, max 120 chars each
}
```

### 5.6 Digital Product Passport (EU ESPR Compliance)

Required by EU Regulation 2024/1781, mandatory for energy-related products from 2027+:

```typescript
interface DigitalProductPassport {
  dpp_version: string;                 // "1.0.0"
  regulation: string;                  // "EU 2024/1781 (ESPR)"

  // === IDENTIFICATION ===
  identification: {
    gtin: string;                      // GS1 GTIN
    gs1_digital_link?: string;         // "https://id.gs1.org/01/04054025..."
    batch_id?: string;
    serial_number?: string;
    manufacturer_name: string;
    manufacturing_date?: string;
    manufacturing_country?: string;    // ISO 3166-1
  };

  // === SUSTAINABILITY ===
  sustainability: {
    energy_class?: string;             // "A+++"
    energy_regulation?: string;        // "EU 811/2013"
    scop_35?: number;                  // Seasonal COP at 35C
    scop_55?: number;                  // Seasonal COP at 55C
    gwp?: number;                      // Global Warming Potential
    refrigerant_type?: string;         // "R290", "R410A"
    refrigerant_charge_kg?: number;
    co2_equivalent_tonnes?: number;
    recyclability_percent?: number;
    recycled_content_percent?: number;
  };

  // === REPAIRABILITY ===
  repairability: {
    repair_score?: number;             // 0-10 repairability index
    spare_parts_availability_years?: number;
    disassembly_instructions?: string; // Container ref to document
    critical_raw_materials?: string[];
  };

  // === COMPLIANCE ===
  compliance: {
    ce_marking: boolean;
    ce_declaration_ref?: string;       // Container ref to CE document
    certifications: Certification[];
    test_reports?: string[];           // Container refs
  };

  // === CARBON FOOTPRINT ===
  carbon_footprint?: {
    manufacturing_kg_co2e?: number;
    transport_kg_co2e?: number;
    use_phase_kg_co2e?: number;        // Over expected lifetime
    end_of_life_kg_co2e?: number;
    total_kg_co2e?: number;
    calculation_method?: string;
    reference_standard?: string;       // "ISO 14067" or "PEF"
  };

  // === HASH & VERIFICATION ===
  content_hash: string;                // SHA-256
  anchored: boolean;
  anchor_ref?: string;                 // Blockchain proof reference
}

interface Certification {
  name: string;                        // "CE", "TUV", "ErP"
  body: string;                        // "TUV Rheinland"
  certificate_id?: string;
  valid_from?: string;
  valid_until?: string;
  document_ref?: string;               // Container ref to certificate PDF
}
```

---

## 6. VERSION CONTROL — Git for Product Data

Every change to a container creates a **commit** with full audit trail.

```typescript
interface CommitInfo {
  hash: string;                        // SHA-256 hash
  message: string;                     // "AI enrichment: 88 features extracted"
  author: string;                      // Contributor name
  author_id: string;                   // Contributor ID
  email?: string;
  timestamp: string;                   // ISO 8601
  parents: string[];                   // Parent commit hashes (DAG)
}
```

### Workflow: How Product Data Evolves

```
IMPORT BRANCH                          PRODUCTION (ANCHORED)
──────────────                         ─────────────────────

  1. Manufacturer imports core data
  ├── commit: "Initial import from Bosch ARGE"
  │   → Layer 000-core (trust: highest)
  │   → Identity, dimensions, weight, GTIN
  │   → 17 media files attached
  │
  2. ETIM classification applied
  ├── commit: "ETIM 10.0 classification: EC012034"
  │   → Layer 001-etim (trust: high)
  │   → 88 EF codes mapped
  │
  3. AI enrichment runs
  ├── commit: "AI extracted 88 features from 4 PDFs"
  │   → Layer 004-ai-enrichment (trust: medium)
  │   → 138 citations created
  │   → 55 confirmed, 30 conflicts flagged
  │
  4. Human reviews conflicts
  ├── commit: "Resolved 30 conflicts, verified 55 citations"
  │   → Trust upgraded: medium → verified
  │   → Conflicts resolved: accept_document or keep_current
  │
  5. Quality gate ─────────────────────► MERGE TO MAIN
                                         │
                                         ├── Content hash computed
                                         ├── Merkle tree built
                                         ├── Anchored to Base Mainnet
                                         └── Container v3 is now
                                              IMMUTABLE & VERIFIABLE

  6. New datasheet arrives (v4)
  ├── commit: "Updated from new datasheet 2026"
  │   → v4 created (v3 preserved)
  │   → New citations override old ones
  │   → supersedes[] tracks history
  │
  7. Re-anchor ────────────────────────► NEW MERKLE ROOT ON-CHAIN
```

---

## 7. BLOCKCHAIN ANCHORING

Every approved container version is anchored to an EVM-compatible blockchain (default: Base Mainnet).

```
┌─────────────────────────────────┐
│ Container v3 data               │
└────────────┬────────────────────┘
             │ SHA-256
             ▼
┌─────────────────────────────────┐
│ Content Hash: 0xa4f2b8c...      │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐  ┌──────────┐
│ Hash A   │  │ Hash B   │  (batch of containers)
└────┬─────┘  └────┬─────┘
     └──────┬──────┘
            │ Merkle Tree
            ▼
┌─────────────────────────────────┐
│ Merkle Root                     │
└────────────┬────────────────────┘
             │ registerBatch()
             ▼
┌─────────────────────────────────┐
│ Base Mainnet (Chain ID: 8453)   │
│ Contract: 0xAd31465A5618F...    │
│                                 │
│ verifyContent(                  │
│   batchId,                      │
│   contentHash,                  │
│   merkleProof[]                 │
│ ) → true/false                  │
└─────────────────────────────────┘
```

```typescript
interface BlockchainAnchor {
  network: string;                // "base-mainnet"
  chain_id: number;               // 8453
  contract_address: string;       // "0xAd31465A5618..."
  batch_id: number;               // Batch number
  content_hash: string;           // SHA-256 of container data
  merkle_root: string;            // Root of batch Merkle tree
  merkle_proof: string[];         // Proof path for this container
  tx_hash: string;                // Transaction hash
  block_number: number;           // Block number
  anchored_at: string;            // ISO 8601 timestamp
}
```

**Supported chains** (via connector architecture):
- Base Mainnet (default, low cost)
- Ethereum Mainnet (highest security)
- Polygon PoS (high throughput)
- Arbitrum (L2 scaling)

---

## 8. THE inject() API — Verified Context for AI

The single entry point for any AI agent, MCP tool, or application to get verified product data.

```typescript
async function inject(options: InjectOptions): Promise<InjectedContext>

interface InjectOptions {
  containers: string[];              // Container IDs to inject
  verify?: boolean;                  // Verify blockchain proofs (default: true)
  format?: 'markdown' | 'json' | 'yaml';
  trust_min?: TrustLevel;           // Minimum trust filter (default: "medium")
  layers?: string[];                 // Specific layers only
  include_citations?: boolean;       // Include source citations (default: true)
  include_media?: boolean;           // Include media references (default: true)
  include_history?: boolean;         // Include version history
  max_tokens?: number;               // Token budget for LLM context
  lang?: string;                     // Preferred language (ISO 639-1)
}

interface InjectedContext {
  containers: ProductContainer[];
  citations: DataAtomCitation[];
  proofs: BlockchainAnchor[];
  formatted: string;                 // LLM-ready formatted output
  token_count: number;
  verified: boolean;
  verified_at: string;
  meta: {
    requested_at: string;
    processing_ms: number;
    cache_hit: boolean;
    layers_applied: string[];
    trust_filter: TrustLevel;
  };
}
```

**Example call:**
```typescript
const context = await inject({
  containers: ["0711:product:bosch:8738208680:v3"],
  verify: true,
  trust_min: "verified",
  format: "markdown",
  include_citations: true
});

// Returns verified, formatted context:
// - All features with trust >= "verified"
// - All citations with document references
// - Blockchain proof attached
// - Token count for LLM budget management
```

---

## 9. REAL-WORLD BLUEPRINT — Bosch SNR 8738208680

### Complete Container (all layers populated)

```
0711:product:bosch:8738208680:v3
│
├── LAYER 000-core (HIGHEST) ── Robert Bosch GmbH
│   ├── identity.snr = "8738208680"
│   ├── identity.gtin = "[from ARGE]"
│   ├── identity.brand = "Bosch"
│   ├── identity.product_line = "CS7000iAW"
│   ├── identity.product_name = "Compress 7000i AW"
│   ├── identity.product_master_id = "174329966"
│   │
│   ├── media.product_front = "bob_00335430_druck.jpg"
│   ├── media.product_web = "bob_00335430_web.jpg"
│   ├── media.title = "box_00336400_druck.png"
│   ├── media.casing = "box_00369075_druck.png"
│   ├── media.refrigerant_circuit = "box_00481727_druck.png"
│   │
│   ├── cad.3d = ["bo3c_o543675v92.dxf", "bo3c_o543675v93.dwg"]
│   ├── cad.front = ["bo2f_o543672v92.dxf", "bo2f_o543672v93.dwg"]
│   ├── cad.side = ["bo2s_o543673v92.dxf", "bo2s_o543673v93.dwg"]
│   ├── cad.ortho = ["bo2d_o543674v92.dxf", "bo2d_o543674v93.dwg"]
│   │
│   ├── documents.datasheet_1 = "bodbsp_6720871915.pdf"
│   ├── documents.datasheet_2 = "bodbed_6720869205.pdf"
│   ├── documents.electrical = "boelel_8738208680.pdf"
│   └── documents.parts = "bopapd_6721836891.pdf"
│
├── LAYER 001-etim (HIGH) ── ETIM International
│   ├── etim.class_code = "EC012034"
│   ├── etim.class_name = "Wärmepumpe Luft/Wasser"
│   ├── etim.version = "10.0"
│   └── (88 EF code definitions for this class)
│
├── LAYER 002-ai-enrichment (MEDIUM → VERIFIED after review)
│   │  Contributor: Fleet Admiral Bombas (bombas@0711.io)
│   │
│   ├── etim.EF000007 = {value: 1, name: "Phasen"}
│   │   └── citation: {doc: "bodbed_6720869205.pdf", p:1, status: "confirmed"}
│   │
│   ├── etim.EF000050 = {value: 50, unit: "Hz", name: "Frequenz"}
│   │   └── citation: {doc: "bodbed_6720869205.pdf", p:1, status: "confirmed"}
│   │
│   ├── etim.EF020090 = {value: 7.0, unit: "kW", name: "Nennheizleistung"}
│   │   └── citation: {doc: "bodbed_6720869205.pdf", p:2,
│   │                   excerpt: "Heizleistung bei A7/W35: 7,0 kW",
│   │                   confidence: 0.95, status: "confirmed"}
│   │
│   ├── etim.EF000008 = {value: 900, unit: "mm", name: "Breite"}
│   │   └── citation: {doc: "bodbed_6720869205.pdf", p:1,
│   │                   excerpt: "Breite: 930 mm",
│   │                   confidence: 0.72, status: "conflict",
│   │                   document_value: 930}  ← CONFLICT: doc≠DB
│   │
│   ├── ... (88 total features, 138 total citations)
│   │
│   └── CITATION SUMMARY:
│       ├── 55 confirmed ✓  (trust → verified)
│       ├──  6 likely ?     (needs human review)
│       ├── 30 conflict !   (document ≠ database)
│       └── 39 not_found ~  (no document evidence)
│
├── LAYER 003-document-content (HIGH)
│   │  Contributor: OCR Pipeline
│   │
│   ├── doc.bodbed_6720869205 = {
│   │     full_text: "[4 pages of technical data]",
│   │     page_count: 4,
│   │     method: "pixtral_ocr",
│   │     quality: "high",
│   │     specs: {cooling: "13 kW", heating: "7 kW", ...}
│   │   }
│   └── doc.boelel_8738208680 = { ... }
│
├── LAYER 004-factsheet (GENERATED)
│   │  Contributor: FactSheet Generator v2.8
│   │
│   ├── b2b.main_claim = "Bosch CS7000iAW Monoblock ..."
│   ├── b2b.highlights = [5x technical selling points]
│   ├── b2b.equipment = [15x variant-specific equipment]
│   ├── b2c.main_claim = "[consumer version, no specs]"
│   └── b2c.highlights = [5x consumer benefits]
│
├── SIBLINGS: [8738208681, 8738208682, 8738208683]
│   └── Features with source "sibling_clone" reference origin
│
├── COMMIT HISTORY:
│   ├── v1: "Initial import from Bosch ARGE" (bosch)
│   ├── v2: "AI enrichment: 88 features, 138 citations" (bombas@0711.io)
│   └── v3: "Human review: 55 confirmed, 30 conflicts resolved" (christoph@0711.io)
│
└── BLOCKCHAIN ANCHOR:
    ├── Network: Base Mainnet (#8453)
    ├── Contract: 0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7
    ├── Content Hash: sha256(container_v3_data)
    ├── Merkle Proof: [hash_a, hash_b, hash_c]
    ├── TX: 0x7f3a5b2c...
    └── Block: #18234567
```

---

## 10. DATABASE SCHEMA (PostgreSQL)

```sql
-- ============================================================
-- 0711 PRODUCT CONTAINER STANDARD — Database Schema v1.0
-- ============================================================

-- Trust levels (ordered by priority)
CREATE TYPE trust_level AS ENUM (
  'highest', 'high', 'certified', 'verified',
  'medium', 'customer', 'generated', 'community'
);

-- Source types (map to trust levels)
CREATE TYPE source_type AS ENUM (
  'manufacturer', 'classification', 'certification',
  'ai_verified', 'ai_generated', 'customer_extension',
  'builder_output', 'community'
);

-- Extraction methods
CREATE TYPE extraction_method AS ENUM (
  'ocr', 'pdf_parse', 'table_extraction', 'nlp', 'manual'
);

-- Verification methods
CREATE TYPE verification_method AS ENUM (
  'human_review', 'automated', 'cross_reference', 'multi_source'
);

-- Citation status
CREATE TYPE citation_status AS ENUM (
  'confirmed', 'likely', 'conflict', 'not_found'
);

-- ============================================================
-- CONTAINERS
-- ============================================================
CREATE TABLE containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id TEXT UNIQUE NOT NULL,         -- "0711:product:bosch:8738208680:v3"
  type VARCHAR(50) NOT NULL DEFAULT 'product',
  namespace VARCHAR(100) NOT NULL,           -- "bosch"
  identifier VARCHAR(255) NOT NULL,          -- "8738208680"
  version INTEGER DEFAULT 1,

  -- Product identity
  data JSONB NOT NULL,                       -- Full container manifest
  meta JSONB DEFAULT '{}'::jsonb,            -- Additional metadata

  -- Integrity
  content_hash VARCHAR(64),                  -- SHA-256
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(namespace, identifier, version)
);

-- ============================================================
-- CONTRIBUTORS
-- ============================================================
CREATE TABLE contributors (
  id TEXT PRIMARY KEY,                       -- "bosch", "bombas@0711.io"
  name TEXT NOT NULL,                        -- "Robert Bosch GmbH"
  role VARCHAR(50) NOT NULL,                 -- "manufacturer", "ai_agent"
  organization TEXT,
  email TEXT,
  trust_default trust_level NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LAYERS
-- ============================================================
CREATE TABLE container_layers (
  id TEXT NOT NULL,                          -- "000-core", "001-etim"
  container_id UUID NOT NULL REFERENCES containers(id),
  name TEXT NOT NULL,                        -- "Manufacturer Core Data"
  type source_type NOT NULL,
  contributor_id TEXT NOT NULL REFERENCES contributors(id),
  trust_level trust_level NOT NULL,
  requires_verification BOOLEAN DEFAULT FALSE,
  schema_version TEXT,
  description TEXT,
  commit_hash TEXT NOT NULL,
  atom_count INTEGER DEFAULT 0,
  verified_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (container_id, id)
);

-- ============================================================
-- ATOMS (DataAtoms — smallest unit of product data)
-- ============================================================
CREATE TABLE container_atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id),
  layer_id TEXT NOT NULL,

  -- Field identification
  field_path TEXT NOT NULL,                  -- "etim.EF020090", "media.product_front"
  field_name TEXT,                           -- "Nennheizleistung"

  -- Value
  value JSONB NOT NULL,
  value_type TEXT NOT NULL,                  -- "string", "number", "boolean", "array"
  unit TEXT,                                 -- "kW", "mm"
  lang TEXT,                                 -- "de", "en"

  -- Provenance
  source_type source_type NOT NULL,
  contributor_id TEXT NOT NULL REFERENCES contributors(id),
  trust_level trust_level NOT NULL,
  commit_hash TEXT NOT NULL,

  -- ETIM-specific
  etim_feature_code TEXT,                    -- "EF020090"
  etim_value_code TEXT,                      -- "EV000123"
  etim_unit_code TEXT,                       -- "EU570001"
  eclass_irdi TEXT,                          -- "0173-1#02-AAJ957#005"

  -- Citation
  citation_document TEXT,
  citation_page INTEGER,
  citation_section TEXT,
  citation_excerpt TEXT,
  citation_confidence NUMERIC(4,3),          -- 0.000-1.000
  citation_method extraction_method,
  citation_status citation_status,

  -- Verification
  verified_by TEXT REFERENCES contributors(id),
  verified_at TIMESTAMPTZ,
  verification_method verification_method,
  verification_notes TEXT,

  -- Audit trail
  supersedes UUID[],                         -- Previous atom IDs
  superseded_by UUID,
  is_current BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for fast field lookups
  FOREIGN KEY (container_id, layer_id) REFERENCES container_layers(container_id, id)
);

-- ============================================================
-- VERSION HISTORY (Git-like commits)
-- ============================================================
CREATE TABLE container_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id),
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  meta JSONB,
  message TEXT,                              -- "AI enrichment: 88 features"
  author_id TEXT REFERENCES contributors(id),
  commit_hash VARCHAR(64) NOT NULL,
  parent_hash VARCHAR(64),                   -- DAG parent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(container_id, version)
);

-- ============================================================
-- BLOCKCHAIN ANCHORING
-- ============================================================
CREATE TABLE blockchain_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id SERIAL,
  merkle_root VARCHAR(66) NOT NULL,
  metadata_uri TEXT,
  tx_hash VARCHAR(66),
  block_number BIGINT,
  network VARCHAR(50) DEFAULT 'base-mainnet',
  chain_id INTEGER DEFAULT 8453,
  contract_address TEXT,
  container_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  anchored_at TIMESTAMPTZ
);

CREATE TABLE container_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id),
  batch_id UUID NOT NULL REFERENCES blockchain_batches(id),
  content_hash VARCHAR(64) NOT NULL,
  merkle_proof JSONB,
  proof_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(container_id, batch_id)
);

-- ============================================================
-- MEDIA REGISTRY
-- ============================================================
CREATE TABLE container_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id),
  filename TEXT NOT NULL,
  document_type_code VARCHAR(10) NOT NULL,   -- "B_", "DB", "MA", "3C"
  media_category VARCHAR(20) NOT NULL,       -- "image", "document", "cad", "video"
  mime_type TEXT,
  file_size_bytes BIGINT,
  usage TEXT,                                -- "print", "web", "technical"
  description TEXT,
  sort_order INTEGER DEFAULT 0,

  -- Extracted content (for PDFs)
  content_text TEXT,
  page_count INTEGER,
  extraction_method TEXT,
  extraction_quality NUMERIC(3,2),
  extracted_specs JSONB,
  extracted_sections TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_containers_namespace ON containers(namespace, identifier);
CREATE INDEX idx_containers_type ON containers(type);
CREATE INDEX idx_atoms_container ON container_atoms(container_id);
CREATE INDEX idx_atoms_field ON container_atoms(field_path);
CREATE INDEX idx_atoms_etim ON container_atoms(etim_feature_code) WHERE etim_feature_code IS NOT NULL;
CREATE INDEX idx_atoms_trust ON container_atoms(trust_level);
CREATE INDEX idx_atoms_current ON container_atoms(container_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_media_container ON container_media(container_id);
CREATE INDEX idx_commits_container ON container_commits(container_id);
CREATE INDEX idx_anchors_container ON container_anchors(container_id);
```

---

## 11. STANDARDS COMPLIANCE MATRIX

| Standard | Version | How 0711-PCS Implements It |
|----------|---------|---------------------------|
| **ETIM** | 10.0/11.0 | Features stored as atoms with `etim_feature_code`, `etim_value_code`, `etim_unit_code` |
| **eClass** | 15.0 | Cross-referenced via `eclass_irdi` on atoms; parallel classification in `classification.eclass` |
| **BMEcat** | 5.0 | Import/export via connector; `supplier_pid`, `gtin`, feature groups map directly |
| **GS1 Digital Link** | Current | `identity.gtin` + `dpp.identification.gs1_digital_link` for QR/NFC access |
| **EU ESPR (DPP)** | 2024/1781 | Full `DigitalProductPassport` section with sustainability, repairability, carbon footprint |
| **IEC 61360 (AAS)** | Submodels | eClass IRDIs reference AAS submodels: technical_data, digital_nameplate, carbon_footprint |
| **ISO 14067** | Carbon | `dpp.carbon_footprint` section with PCF calculation method reference |
| **CE/ErP** | EU 811/813 | `dpp.compliance.certifications` with certificate references |
| **C2PA** | Content auth | Future: Media files signed with C2PA for authenticity |

---

## 12. ADOPTION PATH FOR MANUFACTURERS

### Step 1: Import Existing Data
```
ARGE/PIM/ERP → bosch-import.ts → Container(000-core)
```

### Step 2: Apply Classification
```
ETIM/eClass mapping → Container(001-etim, 002-eclass)
```

### Step 3: AI Enrichment
```
PDF datasheets → OCR → AI extraction → Container(004-ai-enrichment)
138 citations per product with page-level document references
```

### Step 4: Human Review
```
Conflict center UI → Resolve 30 conflicts → Trust upgrade: medium → verified
```

### Step 5: Generate Content
```
Features + Catalog → B2B factsheet → B2C derivation → Container(005-factsheet)
```

### Step 6: Anchor & Publish
```
Approved container → SHA-256 → Merkle tree → Base Mainnet → Immutable proof
```

### Step 7: Distribute via inject()
```
AI agents / MCP tools / PIM systems → inject() → Verified product context
```

---

## APPENDIX A: Bosch Blueprint Statistics

| Metric | Value |
|--------|-------|
| Total Products (SNRs) | 23,141 |
| Product Masters (PMs) | 210+ |
| Product Families | 44 |
| ETIM Features per Product | 88 (EC012034) |
| Citations per Product | ~138 (avg) |
| Physical Media Files | 30,156 |
| Total Media Size | 11.92 GB |
| File Types | JPG, PNG, PDF, DWG, DXF, MP4 |
| Document Type Codes | 15 (B_, X_, 2D, 2F, 2S, 3C, DB, EL, IS, MA, PA, SB, GG, WA, VI) |
| Content Rules Version | V6.2 |
| Blockchain Contract | `0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7` (Base Mainnet) |

---

*0711 Intelligence — THE STANDARD FOR ELECTRICAL INDUSTRY PRODUCT DATA*
