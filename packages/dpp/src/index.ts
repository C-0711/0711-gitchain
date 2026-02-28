/**
 * @0711/dpp - Digital Product Passport integration
 * 
 * Create and verify Digital Product Passports for containers.
 * Implements EU DPP specification with blockchain anchoring.
 */

export { DPPService, getDPPService } from "./service.js";
export { createPassport, verifyPassport, getPassportUrl } from "./operations.js";
export type { DPPConfig, ProductPassport, PassportVerification } from "./types.js";
