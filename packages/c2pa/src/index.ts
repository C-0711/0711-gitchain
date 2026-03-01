/**
 * @0711/c2pa - Content Authenticity Initiative (C2PA) integration
 *
 * Sign and verify container content using C2PA standard.
 * Provides provenance and authenticity for digital assets.
 *
 * Signing uses HMAC-SHA256 with a configurable key (C2PA_SIGNING_KEY env var
 * or signingKey in config). Falls back to an auto-generated dev key with a
 * console warning if no key is configured.
 */

export { C2PAService, getC2PAService } from "./service.js";
export { signContent, verifyContent, extractManifest } from "./operations.js";
export { serializeEnvelope, deserializeEnvelope } from "./types.js";
export type {
  C2PAConfig,
  C2PAManifest,
  C2PAAssertion,
  C2PAIngredient,
  C2PAAction,
  SignatureResult,
  SignedManifestEnvelope,
  VerificationResult,
} from "./types.js";
