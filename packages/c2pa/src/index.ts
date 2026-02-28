/**
 * @0711/c2pa - Content Authenticity Initiative (C2PA) integration
 * 
 * Sign and verify container content using C2PA standard.
 * Provides provenance and authenticity for digital assets.
 */

export { C2PAService, getC2PAService } from "./service.js";
export { signContent, verifyContent, extractManifest } from "./operations.js";
export type { C2PAConfig, C2PAManifest, SignatureResult, VerificationResult } from "./types.js";
