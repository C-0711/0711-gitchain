/**
 * DPP convenience functions
 */

import type { Container } from "@0711/core";

import { getDPPService } from "./service.js";
import type { DPPConfig, ProductPassport, PassportVerification } from "./types.js";

/**
 * Create a Digital Product Passport
 */
export async function createPassport(
  container: Container,
  config?: Partial<DPPConfig>
): Promise<ProductPassport> {
  const service = getDPPService(config);
  return service.createPassport(container);
}

/**
 * Verify a Digital Product Passport
 */
export async function verifyPassport(
  passport: ProductPassport,
  config?: Partial<DPPConfig>
): Promise<PassportVerification> {
  const service = getDPPService(config);
  return service.verifyPassport(passport);
}

/**
 * Generate a QR code SVG for a passport
 */
export async function generateQRCode(
  passportId: string,
  config?: Partial<DPPConfig>
): Promise<string> {
  const service = getDPPService(config);
  return service.generateQRCode(passportId);
}

/**
 * Get passport URL
 */
export function getPassportUrl(passportId: string, config?: Partial<DPPConfig>): string {
  const service = getDPPService(config);
  return service.getPassportUrl(passportId);
}
