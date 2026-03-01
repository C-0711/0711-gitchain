/**
 * @0711/dpp - Digital Product Passport integration
 *
 * Create and verify Digital Product Passports for containers.
 * Implements EU DPP specification with blockchain anchoring.
 */

export { DPPService, getDPPService } from "./service.js";
export { createPassport, verifyPassport, getPassportUrl, generateQRCode } from "./operations.js";
export type {
  DPPConfig,
  ProductPassport,
  PassportVerification,
  VerificationStatus,
} from "./types.js";
export { computeContentHash, computeMerkleRoot } from "./service.js";
