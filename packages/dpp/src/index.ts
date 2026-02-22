/**
 * @0711/dpp - Digital Product Passport integration
 * 
 * Create and verify Digital Product Passports for containers.
 * Implements EU DPP specification with blockchain anchoring.
 */

export { DPPService, getDPPService } from "./service";
export { createPassport, verifyPassport, getPassportUrl } from "./operations";
export type { DPPConfig, ProductPassport, PassportVerification } from "./types";
