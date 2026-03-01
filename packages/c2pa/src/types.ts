/**
 * C2PA types
 */

export interface C2PAConfig {
  /** Signing certificate (legacy, unused in HMAC mode) */
  certificate?: {
    path: string;
    password?: string;
  };
  /** HMAC signing key (hex string). Falls back to C2PA_SIGNING_KEY env var. */
  signingKey?: string;
  /** Signer identity */
  signer: {
    name: string;
    url: string;
  };
  /** Claim generator */
  claimGenerator: string;
  /** Maximum age in milliseconds for timestamp validity (default: 365 days) */
  maxTimestampAge?: number;
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

/**
 * Envelope wrapping a manifest with its HMAC signature.
 * This is what gets serialized for storage/transmission.
 */
export interface SignedManifestEnvelope {
  /** Version of the envelope format */
  version: 1;
  /** The manifest content */
  manifest: C2PAManifest;
  /** HMAC-SHA256 signature of the canonical manifest JSON (hex) */
  hmacSignature: string;
  /** SHA-256 hash of the signing key used (hex, for key identification) */
  keyFingerprint: string;
}

export interface SignatureResult {
  success: boolean;
  manifest: C2PAManifest;
  signedData: Buffer;
  envelope: SignedManifestEnvelope;
  error?: string;
  warnings?: string[];
}

export interface VerificationResult {
  valid: boolean;
  manifest?: C2PAManifest;
  certificateChain?: string[];
  errors?: string[];
  warnings?: string[];
}

/**
 * Serialize a SignedManifestEnvelope to JSON string
 */
export function serializeEnvelope(envelope: SignedManifestEnvelope): string {
  return JSON.stringify(envelope);
}

/**
 * Deserialize a JSON string to SignedManifestEnvelope
 * Returns null if the JSON is invalid or doesn't match the expected shape.
 */
export function deserializeEnvelope(json: string): SignedManifestEnvelope | null {
  try {
    const parsed = JSON.parse(json);
    if (
      parsed &&
      parsed.version === 1 &&
      typeof parsed.hmacSignature === "string" &&
      typeof parsed.keyFingerprint === "string" &&
      parsed.manifest &&
      typeof parsed.manifest.claimId === "string"
    ) {
      return parsed as SignedManifestEnvelope;
    }
    return null;
  } catch {
    return null;
  }
}
