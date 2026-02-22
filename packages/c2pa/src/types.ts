/**
 * C2PA types
 */

export interface C2PAConfig {
  /** Signing certificate */
  certificate: {
    path: string;
    password?: string;
  };
  /** Signer identity */
  signer: {
    name: string;
    url: string;
  };
  /** Claim generator */
  claimGenerator: string;
}

export interface C2PAManifest {
  /** Claim UUID */
  claimId: string;
  /** Format (e.g., "c2pa") */
  format: string;
  /** Instance ID */
  instanceId: string;
  /** Title */
  title: string;
  /** Claim generator */
  claimGenerator: string;
  /** Signature info */
  signature: {
    issuer: string;
    time: string;
    algorithm: string;
  };
  /** Assertions */
  assertions: C2PAAssertion[];
  /** Ingredients */
  ingredients?: C2PAIngredient[];
  /** Actions */
  actions?: C2PAAction[];
}

export interface C2PAAssertion {
  label: string;
  data: Record<string, unknown>;
  hash?: string;
}

export interface C2PAIngredient {
  title: string;
  format: string;
  instanceId: string;
  documentId?: string;
  relationship: "parentOf" | "componentOf" | "inputTo";
}

export interface C2PAAction {
  action: string;
  when?: string;
  softwareAgent?: string;
  parameters?: Record<string, unknown>;
}

export interface SignatureResult {
  success: boolean;
  manifest: C2PAManifest;
  signedData: Buffer;
  error?: string;
}

export interface VerificationResult {
  valid: boolean;
  manifest?: C2PAManifest;
  certificateChain?: string[];
  errors?: string[];
  warnings?: string[];
}
