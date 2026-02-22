// DPP-05: EU DPP Regulation Mapping
// Based on EU ESPR (Ecodesign for Sustainable Products Regulation)

export interface DPPRegulation {
  id: string;
  name: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  effectiveDate: string;
  productCategories: string[];
}

export const EU_DPP_REGULATIONS: DPPRegulation[] = [
  {
    id: "ESPR-2024",
    name: "Ecodesign for Sustainable Products Regulation",
    description: "EU framework for sustainable product requirements and digital product passports",
    effectiveDate: "2024-07-18",
    productCategories: ["*"],
    requiredFields: [
      "unique_product_identifier",
      "global_trade_identification_number",
      "manufacturer_identification",
      "facility_identification",
      "product_name",
      "product_model",
    ],
    optionalFields: [
      "carbon_footprint",
      "recycled_content",
      "recyclability_score",
      "expected_lifespan",
      "repair_score",
    ],
  },
  {
    id: "BATTERIES-2023",
    name: "EU Battery Regulation",
    description: "Specific DPP requirements for batteries",
    effectiveDate: "2027-02-18",
    productCategories: ["batteries", "ev_batteries", "industrial_batteries"],
    requiredFields: [
      "battery_model",
      "battery_category",
      "chemistry",
      "capacity_kwh",
      "state_of_health",
      "carbon_footprint_manufacturing",
      "recycled_cobalt_content",
      "recycled_lithium_content",
      "recycled_nickel_content",
      "recycled_lead_content",
    ],
    optionalFields: [
      "expected_lifetime_cycles",
      "round_trip_efficiency",
    ],
  },
  {
    id: "TEXTILES-2027",
    name: "EU Textile Products Regulation",
    description: "DPP requirements for textile products",
    effectiveDate: "2027-01-01",
    productCategories: ["textiles", "clothing", "footwear"],
    requiredFields: [
      "fiber_composition",
      "country_of_manufacturing",
      "size_information",
      "care_instructions",
      "presence_of_substances_of_concern",
    ],
    optionalFields: [
      "durability_score",
      "recyclability_information",
      "microfiber_release",
    ],
  },
  {
    id: "CONSTRUCTION-2028",
    name: "Construction Products Regulation",
    description: "DPP requirements for construction products",
    effectiveDate: "2028-01-01",
    productCategories: ["construction", "building_materials", "hvac"],
    requiredFields: [
      "product_declaration",
      "ce_marking",
      "performance_characteristics",
      "essential_characteristics",
      "intended_use",
      "manufacturer_declaration",
    ],
    optionalFields: [
      "environmental_product_declaration",
      "recycled_content",
      "end_of_life_information",
    ],
  },
];

export interface ComplianceCheck {
  regulation: string;
  compliant: boolean;
  missingRequired: string[];
  presentOptional: string[];
  score: number; // 0-100
}

export function checkDPPCompliance(
  productData: Record<string, any>,
  productCategory: string
): ComplianceCheck[] {
  const results: ComplianceCheck[] = [];

  for (const regulation of EU_DPP_REGULATIONS) {
    // Check if regulation applies to this category
    if (
      !regulation.productCategories.includes("*") &&
      !regulation.productCategories.includes(productCategory)
    ) {
      continue;
    }

    const missingRequired: string[] = [];
    const presentOptional: string[] = [];

    // Check required fields
    for (const field of regulation.requiredFields) {
      if (!productData[field] && productData[field] !== 0) {
        missingRequired.push(field);
      }
    }

    // Check optional fields
    for (const field of regulation.optionalFields) {
      if (productData[field] || productData[field] === 0) {
        presentOptional.push(field);
      }
    }

    // Calculate compliance score
    const requiredScore =
      ((regulation.requiredFields.length - missingRequired.length) /
        regulation.requiredFields.length) *
      80;
    const optionalScore =
      regulation.optionalFields.length > 0
        ? (presentOptional.length / regulation.optionalFields.length) * 20
        : 20;

    results.push({
      regulation: regulation.id,
      compliant: missingRequired.length === 0,
      missingRequired,
      presentOptional,
      score: Math.round(requiredScore + optionalScore),
    });
  }

  return results;
}

export function getApplicableRegulations(productCategory: string): DPPRegulation[] {
  return EU_DPP_REGULATIONS.filter(
    (reg) =>
      reg.productCategories.includes("*") ||
      reg.productCategories.includes(productCategory)
  );
}

export function generateComplianceReport(
  productData: Record<string, any>,
  productCategory: string
): string {
  const checks = checkDPPCompliance(productData, productCategory);
  const lines: string[] = [
    "# DPP Compliance Report",
    `Product Category: ${productCategory}`,
    `Generated: ${new Date().toISOString()}`,
    "",
  ];

  for (const check of checks) {
    lines.push(`## ${check.regulation}`);
    lines.push(`Status: ${check.compliant ? "✅ COMPLIANT" : "❌ NOT COMPLIANT"}`);
    lines.push(`Score: ${check.score}/100`);

    if (check.missingRequired.length > 0) {
      lines.push("### Missing Required Fields:");
      check.missingRequired.forEach((f) => lines.push(`- ${f}`));
    }

    if (check.presentOptional.length > 0) {
      lines.push("### Present Optional Fields:");
      check.presentOptional.forEach((f) => lines.push(`- ${f}`));
    }

    lines.push("");
  }

  return lines.join("\n");
}
