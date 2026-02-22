/**
 * C2PA convenience functions
 */

import { getC2PAService } from "./service";
import type { Container } from "@0711/core";
import type { C2PAConfig, SignatureResult, VerificationResult, C2PAManifest } from "./types";

/**
 * Sign container content
 */
export async function signContent(
  container: Container,
  config?: Partial<C2PAConfig>
): Promise<SignatureResult> {
  const service = getC2PAService(config);
  return service.signContainer(container);
}

/**
 * Verify signed content
 */
export async function verifyContent(
  data: Buffer,
  config?: Partial<C2PAConfig>
): Promise<VerificationResult> {
  const service = getC2PAService(config);
  return service.verifyManifest(data);
}

/**
 * Extract manifest from signed content
 */
export function extractManifest(
  data: Buffer,
  config?: Partial<C2PAConfig>
): C2PAManifest | null {
  const service = getC2PAService(config);
  return service.extractManifest(data);
}
