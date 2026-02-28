// DPP-06: Compliance Validation Rules Engine
// Path: 0711-studio/src/lib/dpp/validator.ts

import { EU_DPP_REQUIREMENTS, getRequirementsForSector, type EUDPPRequirement } from './eu-regulation.js';

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  coverage: {
    total: number;
    filled: number;
    mandatory: number;
    mandatoryFilled: number;
  };
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error';
  requirement?: EUDPPRequirement;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  severity: 'warning';
  suggestion?: string;
}

export interface DPPData {
  [key: string]: any;
}

class DPPValidator {
  private sector: string;
  private requirements: EUDPPRequirement[];

  constructor(sector: string = 'hvac') {
    this.sector = sector;
    this.requirements = getRequirementsForSector(sector);
  }

  validate(data: DPPData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    let totalFields = 0;
    let filledFields = 0;
    let mandatoryFields = 0;
    let mandatoryFilledFields = 0;

    for (const req of this.requirements) {
      totalFields++;
      const value = data[req.field];
      const hasValue = value !== undefined && value !== null && value !== '';

      if (req.mandatory) {
        mandatoryFields++;
        if (hasValue) {
          mandatoryFilledFields++;
        } else {
          errors.push({
            field: req.field,
            code: 'MISSING_MANDATORY',
            message: `Missing mandatory field: ${req.description}`,
            severity: 'error',
            requirement: req,
          });
        }
      }

      if (hasValue) {
        filledFields++;
        
        // Type validation
        const typeError = this.validateType(value, req);
        if (typeError) {
          errors.push(typeError);
        }

        // Rule validation
        if (req.validationRule) {
          const ruleError = this.validateRule(value, req);
          if (ruleError) {
            errors.push(ruleError);
          }
        }

        // Content quality warnings
        const qualityWarnings = this.checkQuality(value, req);
        warnings.push(...qualityWarnings);
      }
    }

    // Calculate compliance score
    const mandatoryScore = mandatoryFields > 0 
      ? (mandatoryFilledFields / mandatoryFields) * 60 
      : 60;
    const optionalScore = (totalFields - mandatoryFields) > 0
      ? ((filledFields - mandatoryFilledFields) / (totalFields - mandatoryFields)) * 30
      : 30;
    const errorPenalty = Math.min(errors.length * 5, 30);
    
    const score = Math.max(0, Math.round(mandatoryScore + optionalScore - errorPenalty));

    return {
      valid: errors.length === 0,
      score,
      errors,
      warnings,
      coverage: {
        total: totalFields,
        filled: filledFields,
        mandatory: mandatoryFields,
        mandatoryFilled: mandatoryFilledFields,
      },
    };
  }

  private validateType(value: any, req: EUDPPRequirement): ValidationError | null {
    switch (req.dataType) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            field: req.field,
            code: 'INVALID_TYPE',
            message: `${req.field} must be a string`,
            severity: 'error',
            requirement: req,
          };
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            field: req.field,
            code: 'INVALID_TYPE',
            message: `${req.field} must be a number`,
            severity: 'error',
            requirement: req,
          };
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field: req.field,
            code: 'INVALID_TYPE',
            message: `${req.field} must be a boolean`,
            severity: 'error',
            requirement: req,
          };
        }
        break;
      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          return {
            field: req.field,
            code: 'INVALID_URL',
            message: `${req.field} must be a valid URL`,
            severity: 'error',
            requirement: req,
          };
        }
        break;
      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return {
            field: req.field,
            code: 'INVALID_DATE',
            message: `${req.field} must be a valid date`,
            severity: 'error',
            requirement: req,
          };
        }
        break;
    }
    return null;
  }

  private validateRule(value: any, req: EUDPPRequirement): ValidationError | null {
    if (!req.validationRule) return null;

    // Pattern matching
    if (req.validationRule.startsWith('^')) {
      const regex = new RegExp(req.validationRule);
      if (!regex.test(String(value))) {
        return {
          field: req.field,
          code: 'PATTERN_MISMATCH',
          message: `${req.field} format is invalid`,
          severity: 'error',
          requirement: req,
        };
      }
    }

    // Numeric range validation
    if (req.dataType === 'number') {
      const numValue = Number(value);
      
      if (req.validationRule.includes('>=') && req.validationRule.includes('<=')) {
        const match = req.validationRule.match(/>= (\d+) && <= (\d+)/);
        if (match) {
          const [, min, max] = match;
          if (numValue < Number(min) || numValue > Number(max)) {
            return {
              field: req.field,
              code: 'OUT_OF_RANGE',
              message: `${req.field} must be between ${min} and ${max}`,
              severity: 'error',
              requirement: req,
            };
          }
        }
      } else if (req.validationRule.includes('>= 0')) {
        if (numValue < 0) {
          return {
            field: req.field,
            code: 'NEGATIVE_VALUE',
            message: `${req.field} cannot be negative`,
            severity: 'error',
            requirement: req,
          };
        }
      }
    }

    return null;
  }

  private checkQuality(value: any, req: EUDPPRequirement): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (req.dataType === 'string' && typeof value === 'string') {
      if (value.length < 3) {
        warnings.push({
          field: req.field,
          code: 'SHORT_VALUE',
          message: `${req.field} seems too short`,
          severity: 'warning',
          suggestion: 'Consider providing more detailed information',
        });
      }
    }

    if (req.dataType === 'number' && req.field.includes('Percentage')) {
      if (value === 0) {
        warnings.push({
          field: req.field,
          code: 'ZERO_PERCENTAGE',
          message: `${req.field} is 0%`,
          severity: 'warning',
          suggestion: 'Verify this value is accurate',
        });
      }
    }

    return warnings;
  }

  private isValidUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }
}

// Factory function
export function createValidator(sector: string): DPPValidator {
  return new DPPValidator(sector);
}

// Quick validation function
export function validateDPP(data: DPPData, sector: string = 'hvac'): ValidationResult {
  const validator = createValidator(sector);
  return validator.validate(data);
}

export default DPPValidator;
