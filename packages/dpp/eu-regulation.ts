// DPP-05: EU DPP Regulation Mapping
// Path: 0711-studio/src/lib/dpp/eu-regulation.ts

/**
 * EU Digital Product Passport Regulation Mapping
 * Based on EU Ecodesign for Sustainable Products Regulation (ESPR)
 * and Battery Regulation requirements
 */

export interface EUDPPRequirement {
  id: string;
  category: string;
  field: string;
  description: string;
  mandatory: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'url' | 'object';
  validationRule?: string;
  sourceRegulation: string;
  applicableSectors: string[];
}

// Core EU DPP requirements from ESPR
export const EU_DPP_REQUIREMENTS: EUDPPRequirement[] = [
  // Product Identification
  {
    id: 'dpp.id.unique',
    category: 'identification',
    field: 'uniqueProductIdentifier',
    description: 'Unique product identifier (GTIN, serial number)',
    mandatory: true,
    dataType: 'string',
    validationRule: '^[0-9]{8,14}$|^[A-Z0-9-]+$',
    sourceRegulation: 'ESPR Art. 8(2)(a)',
    applicableSectors: ['all'],
  },
  {
    id: 'dpp.id.manufacturer',
    category: 'identification',
    field: 'manufacturerName',
    description: 'Name of manufacturer or importer',
    mandatory: true,
    dataType: 'string',
    sourceRegulation: 'ESPR Art. 8(2)(b)',
    applicableSectors: ['all'],
  },
  {
    id: 'dpp.id.model',
    category: 'identification',
    field: 'modelIdentifier',
    description: 'Model, batch or serial number',
    mandatory: true,
    dataType: 'string',
    sourceRegulation: 'ESPR Art. 8(2)(c)',
    applicableSectors: ['all'],
  },
  
  // Sustainability & Environment
  {
    id: 'dpp.env.carbonFootprint',
    category: 'sustainability',
    field: 'carbonFootprint',
    description: 'Carbon footprint (kg CO2 equivalent)',
    mandatory: true,
    dataType: 'number',
    validationRule: '>= 0',
    sourceRegulation: 'ESPR Art. 8(2)(h)',
    applicableSectors: ['electronics', 'textiles', 'batteries', 'construction'],
  },
  {
    id: 'dpp.env.recycledContent',
    category: 'sustainability',
    field: 'recycledContentPercentage',
    description: 'Percentage of recycled material',
    mandatory: true,
    dataType: 'number',
    validationRule: '>= 0 && <= 100',
    sourceRegulation: 'ESPR Art. 8(2)(i)',
    applicableSectors: ['electronics', 'textiles', 'construction'],
  },
  {
    id: 'dpp.env.durability',
    category: 'sustainability',
    field: 'expectedLifetimeYears',
    description: 'Expected product lifetime in years',
    mandatory: false,
    dataType: 'number',
    sourceRegulation: 'ESPR Art. 8(2)(d)',
    applicableSectors: ['electronics', 'appliances'],
  },
  {
    id: 'dpp.env.repairabilityScore',
    category: 'sustainability',
    field: 'repairabilityScore',
    description: 'Repairability index (0-10)',
    mandatory: true,
    dataType: 'number',
    validationRule: '>= 0 && <= 10',
    sourceRegulation: 'ESPR Art. 8(2)(e)',
    applicableSectors: ['electronics', 'appliances'],
  },
  
  // Hazardous Substances
  {
    id: 'dpp.hazard.substances',
    category: 'compliance',
    field: 'substancesOfConcern',
    description: 'List of substances of concern (SVHC)',
    mandatory: true,
    dataType: 'object',
    sourceRegulation: 'ESPR Art. 8(2)(f)',
    applicableSectors: ['all'],
  },
  {
    id: 'dpp.hazard.reachCompliant',
    category: 'compliance',
    field: 'reachCompliant',
    description: 'REACH regulation compliance',
    mandatory: true,
    dataType: 'boolean',
    sourceRegulation: 'REACH Regulation',
    applicableSectors: ['all'],
  },
  
  // End of Life
  {
    id: 'dpp.eol.recyclability',
    category: 'endOfLife',
    field: 'recyclabilityPercentage',
    description: 'Percentage that can be recycled',
    mandatory: true,
    dataType: 'number',
    validationRule: '>= 0 && <= 100',
    sourceRegulation: 'ESPR Art. 8(2)(j)',
    applicableSectors: ['electronics', 'batteries', 'packaging'],
  },
  {
    id: 'dpp.eol.disassemblyInstructions',
    category: 'endOfLife',
    field: 'disassemblyInstructionsUrl',
    description: 'URL to disassembly instructions',
    mandatory: false,
    dataType: 'url',
    sourceRegulation: 'ESPR Art. 8(2)(k)',
    applicableSectors: ['electronics', 'appliances'],
  },
  
  // Supply Chain
  {
    id: 'dpp.supply.countryOfOrigin',
    category: 'supplyChain',
    field: 'countryOfOrigin',
    description: 'Country of manufacture',
    mandatory: true,
    dataType: 'string',
    validationRule: '^[A-Z]{2}$', // ISO 3166-1 alpha-2
    sourceRegulation: 'ESPR Art. 8(2)(l)',
    applicableSectors: ['all'],
  },
  
  // Battery-specific (EU Battery Regulation)
  {
    id: 'dpp.battery.capacity',
    category: 'battery',
    field: 'batteryCapacity',
    description: 'Battery capacity in Wh',
    mandatory: true,
    dataType: 'number',
    sourceRegulation: 'Battery Regulation Art. 13',
    applicableSectors: ['batteries'],
  },
  {
    id: 'dpp.battery.stateOfHealth',
    category: 'battery',
    field: 'stateOfHealth',
    description: 'Battery state of health (%)',
    mandatory: true,
    dataType: 'number',
    validationRule: '>= 0 && <= 100',
    sourceRegulation: 'Battery Regulation Art. 14',
    applicableSectors: ['batteries'],
  },
];

// Sector-specific requirement sets
export const SECTOR_REQUIREMENTS: Record<string, string[]> = {
  'electronics': ['dpp.id.*', 'dpp.env.*', 'dpp.hazard.*', 'dpp.eol.*', 'dpp.supply.*'],
  'textiles': ['dpp.id.*', 'dpp.env.carbonFootprint', 'dpp.env.recycledContent', 'dpp.hazard.*', 'dpp.supply.*'],
  'batteries': ['dpp.id.*', 'dpp.env.*', 'dpp.battery.*', 'dpp.hazard.*', 'dpp.eol.*'],
  'construction': ['dpp.id.*', 'dpp.env.carbonFootprint', 'dpp.env.recycledContent', 'dpp.hazard.*'],
  'hvac': ['dpp.id.*', 'dpp.env.*', 'dpp.hazard.*', 'dpp.eol.*'], // Heating/cooling equipment
};

// Get applicable requirements for a product sector
export function getRequirementsForSector(sector: string): EUDPPRequirement[] {
  return EU_DPP_REQUIREMENTS.filter(req => 
    req.applicableSectors.includes('all') || req.applicableSectors.includes(sector)
  );
}

// Check if a field is mandatory for a sector
export function isMandatoryForSector(field: string, sector: string): boolean {
  const req = EU_DPP_REQUIREMENTS.find(r => r.field === field);
  if (!req) return false;
  if (!req.mandatory) return false;
  return req.applicableSectors.includes('all') || req.applicableSectors.includes(sector);
}

export default EU_DPP_REQUIREMENTS;
