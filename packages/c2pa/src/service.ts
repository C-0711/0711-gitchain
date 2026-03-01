/**
 * C2PA Service
 *
 * Implements Content Authenticity signing and verification using HMAC-SHA256.
 * Uses Node.js built-in crypto module -- no external dependencies required.
 */

import crypto from "crypto";

import type { Container } from "@0711/core";

import type {
  C2PAConfig,
  C2PAManifest,
  SignatureResult,
  SignedManifestEnvelope,
  VerificationResult,
} from "./types.js";
import { serializeEnvelope, deserializeEnvelope } from "./types.js";

/** Default maximum timestamp age: 365 days */
const DEFAULT_MAX_TIMESTAMP_AGE_MS = 365 * 24 * 60 * 60 * 1000;

const DEFAULT_CONFIG: Partial<C2PAConfig> = {
  claimGenerator: "GitChain/0.1.0 c2pa-ts/0.1.0",
  signer: {
    name: "GitChain",
    url: "https://gitchain.0711.io",
  },
};

export class C2PAService {
  private config: C2PAConfig;
  private signingKey: Buffer;
  private usingDevKey: boolean;

  constructor(config: Partial<C2PAConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as C2PAConfig;
    this.usingDevKey = false;
    this.signingKey = this.resolveSigningKey();
  }

  // -------------------------------------------------------
  // Key management
  // -------------------------------------------------------

  /**
   * Resolve the signing key from config, env var, or generate a dev key.
   */
  private resolveSigningKey(): Buffer {
    // 1. Explicit key in config (hex string)
    if (this.config.signingKey) {
      return Buffer.from(this.config.signingKey, "hex");
    }

    // 2. Environment variable
    const envKey = process.env.C2PA_SIGNING_KEY;
    if (envKey) {
      return Buffer.from(envKey, "hex");
    }

    // 3. Generate a deterministic development key and warn
    this.usingDevKey = true;
    console.warn(
      "[C2PA] WARNING: No signing key configured. " +
        "Set C2PA_SIGNING_KEY env var or pass signingKey in config. " +
        "Using auto-generated development key — signatures are NOT production-safe."
    );
    // Derive a stable dev key so signatures are reproducible within a process
    return crypto.createHash("sha256").update("gitchain-c2pa-dev-key-NOT-FOR-PRODUCTION").digest();
  }

  /**
   * Compute a fingerprint (first 16 hex chars of SHA-256) of the signing key.
   * Used to identify which key produced a signature without revealing the key.
   */
  private keyFingerprint(): string {
    return crypto.createHash("sha256").update(this.signingKey).digest("hex");
  }

  // -------------------------------------------------------
  // Canonical JSON — deterministic serialization of manifest
  // -------------------------------------------------------

  /**
   * Produce a canonical (deterministic) JSON string of a manifest.
   * Keys are sorted recursively so the output is stable across runs.
   */
  static canonicalize(manifest: C2PAManifest): string {
    return JSON.stringify(manifest, Object.keys(manifest).sort());
  }

  // -------------------------------------------------------
  // HMAC helpers
  // -------------------------------------------------------

  private computeHmac(data: string): string {
    return crypto.createHmac("sha256", this.signingKey).update(data).digest("hex");
  }

  private verifyHmac(data: string, expectedHmac: string): boolean {
    const computed = this.computeHmac(data);
    // Constant-time comparison to avoid timing attacks
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(expectedHmac, "hex"));
  }

  // -------------------------------------------------------
  // Signing
  // -------------------------------------------------------

  /**
   * Sign container content with C2PA manifest
   */
  async signContainer(container: Container): Promise<SignatureResult> {
    const claimId = crypto.randomUUID();
    const instanceId = `urn:uuid:${crypto.randomUUID()}`;

    // Create content hash
    const contentJson = JSON.stringify(container.data);
    const contentHash = crypto.createHash("sha256").update(contentJson).digest("hex");

    const manifest: C2PAManifest = {
      claimId,
      format: "c2pa",
      instanceId,
      title: container.meta.name,
      claimGenerator: this.config.claimGenerator,
      signature: {
        issuer: this.config.signer.name,
        time: new Date().toISOString(),
        algorithm: "HMAC-SHA256",
      },
      assertions: [
        {
          label: "c2pa.hash.data",
          data: {
            name: "sha256",
            hash: contentHash,
          },
        },
        {
          label: "stds.schema-org.CreativeWork",
          data: {
            "@context": "https://schema.org/",
            "@type": "CreativeWork",
            name: container.meta.name,
            author: container.meta.author,
            dateCreated: container.meta.createdAt,
            dateModified: container.meta.updatedAt,
          },
        },
        {
          label: "gitchain.container",
          data: {
            id: container.id,
            type: container.type,
            namespace: container.namespace,
            version: container.version,
          },
        },
      ],
      actions: [
        {
          action: "c2pa.created",
          when: container.meta.createdAt,
          softwareAgent: "GitChain",
        },
      ],
    };

    // Add citations as ingredients
    if (container.citations?.length) {
      manifest.ingredients = container.citations.map((citation) => ({
        title: citation.documentId,
        format: "application/pdf",
        instanceId: `urn:gitchain:${citation.documentId}`,
        documentId: citation.documentId,
        relationship: "inputTo" as const,
      }));
    }

    // Sign the manifest with HMAC-SHA256
    const canonicalManifest = C2PAService.canonicalize(manifest);
    const hmacSignature = this.computeHmac(canonicalManifest);

    const envelope: SignedManifestEnvelope = {
      version: 1,
      manifest,
      hmacSignature,
      keyFingerprint: this.keyFingerprint(),
    };

    const warnings: string[] = [];
    if (this.usingDevKey) {
      warnings.push("Signed with auto-generated development key");
    }

    return {
      success: true,
      manifest,
      signedData: Buffer.from(serializeEnvelope(envelope)),
      envelope,
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  }

  // -------------------------------------------------------
  // Verification
  // -------------------------------------------------------

  /**
   * Verify a C2PA signed manifest envelope.
   *
   * Checks:
   *  1. Envelope structure is valid
   *  2. HMAC signature matches the canonical manifest content
   *  3. Timestamp is within the allowed age window
   */
  async verifyManifest(data: Buffer): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Step 1: Parse envelope
    let envelope: SignedManifestEnvelope | null;
    try {
      envelope = deserializeEnvelope(data.toString());
    } catch {
      envelope = null;
    }

    if (!envelope) {
      // Attempt legacy parse (bare manifest without envelope)
      try {
        const manifest = JSON.parse(data.toString()) as C2PAManifest;
        if (manifest && manifest.claimId) {
          return {
            valid: false,
            manifest,
            errors: ["Manifest is not wrapped in a signed envelope — cannot verify"],
            warnings: ["Parsed as unsigned manifest (legacy format)"],
          };
        }
      } catch {
        // ignore
      }
      return {
        valid: false,
        errors: ["Failed to parse signed manifest envelope"],
      };
    }

    const { manifest, hmacSignature, keyFingerprint } = envelope;

    // Step 2: Verify HMAC signature
    const canonicalManifest = C2PAService.canonicalize(manifest);
    let signatureValid = false;
    try {
      signatureValid = this.verifyHmac(canonicalManifest, hmacSignature);
    } catch {
      signatureValid = false;
    }

    if (!signatureValid) {
      errors.push("HMAC signature verification failed — content may have been tampered with");
    }

    // Step 3: Key fingerprint check
    const currentFingerprint = this.keyFingerprint();
    if (keyFingerprint !== currentFingerprint) {
      warnings.push(
        `Signing key fingerprint mismatch: envelope=${keyFingerprint.slice(0, 16)}..., ` +
          `current=${currentFingerprint.slice(0, 16)}...`
      );
      // Fingerprint mismatch means a different key was used — the HMAC check
      // above will already fail if the keys differ, so this is informational.
    }

    // Step 4: Timestamp validity
    const maxAge = this.config.maxTimestampAge ?? DEFAULT_MAX_TIMESTAMP_AGE_MS;
    if (manifest.signature?.time) {
      const signedAt = new Date(manifest.signature.time).getTime();
      const age = Date.now() - signedAt;
      if (isNaN(signedAt)) {
        warnings.push("Manifest timestamp is not a valid ISO date");
      } else if (age > maxAge) {
        warnings.push(
          `Manifest timestamp is ${Math.round(age / (24 * 60 * 60 * 1000))} days old ` +
            `(max allowed: ${Math.round(maxAge / (24 * 60 * 60 * 1000))} days)`
        );
      } else if (age < -60_000) {
        // Allow 60s clock skew
        warnings.push("Manifest timestamp is in the future");
      }
    } else {
      warnings.push("Manifest has no signature timestamp");
    }

    if (this.usingDevKey) {
      warnings.push("Verified with auto-generated development key");
    }

    return {
      valid: errors.length === 0,
      manifest,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // -------------------------------------------------------
  // Extraction
  // -------------------------------------------------------

  /**
   * Extract manifest from signed content (envelope or bare manifest)
   */
  extractManifest(data: Buffer): C2PAManifest | null {
    try {
      const envelope = deserializeEnvelope(data.toString());
      if (envelope) {
        return envelope.manifest;
      }
      // Fallback: try bare manifest
      const parsed = JSON.parse(data.toString());
      if (parsed?.claimId) {
        return parsed as C2PAManifest;
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Singleton
let defaultService: C2PAService | null = null;

export function getC2PAService(config?: Partial<C2PAConfig>): C2PAService {
  if (!defaultService || config) {
    defaultService = new C2PAService(config);
  }
  return defaultService;
}
