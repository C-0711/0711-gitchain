// DPP-06: Compliance Validation Rules
export interface ValidationRule {
  id: string;
  name: string;
  severity: "error" | "warning" | "info";
  validate: (data: any) => { passed: boolean; message: string };
}

export const DPP_VALIDATION_RULES: ValidationRule[] = [
  {
    id: "unique-id-format",
    name: "Unique ID Format",
    severity: "error",
    validate: (data) => ({
      passed: !!(data.passportId || data.unique_product_identifier),
      message: data.passportId ? "Valid ID" : "Missing product ID"
    })
  },
  {
    id: "manufacturer-info",
    name: "Manufacturer Information", 
    severity: "error",
    validate: (data) => ({
      passed: !!(data.manufacturer?.name || data.manufacturer_name),
      message: data.manufacturer?.name ? "Manufacturer present" : "Missing manufacturer"
    })
  },
  {
    id: "sustainability-data",
    name: "Sustainability Metrics",
    severity: "warning",
    validate: (data) => {
      const metrics = ["carbon_footprint", "recycled_content", "recyclability_score"];
      const present = metrics.filter(m => data[m] !== undefined).length;
      return { passed: present >= 1, message: present + " sustainability metrics" };
    }
  }
];

export function validateDPP(data: any) {
  return DPP_VALIDATION_RULES.map(rule => ({
    ruleId: rule.id,
    passed: rule.validate(data).passed,
    severity: rule.severity,
    message: rule.validate(data).message
  }));
}
