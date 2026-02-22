/**
 * Main injection logic
 * 
 * inject() is the core GitChain API.
 * It resolves containers, verifies proofs, and formats for LLM consumption.
 */

import type { Container, Citation, ChainProof } from "@0711/core";
import type { InjectOptions, InjectedContext } from "./types";
import { resolveContainers } from "./resolver";
import { formatForLLM } from "./formatter";
import { verifyProofs } from "./verifier";
import { estimateTokens } from "./utils";

/**
 * Inject verified context for AI agents
 * 
 * @example
 * ```typescript
 * const context = await inject({
 *   containers: [
 *     "0711:product:bosch:7736606982:v3",
 *     "0711:knowledge:etim:EC012034:v1"
 *   ],
 *   verify: true,
 *   format: "markdown"
 * });
 * 
 * // Use in agent
 * const response = await agent.chat({
 *   systemPrompt: `Verified context:\n${context.formatted}`,
 *   userMessage: "What is the COP?"
 * });
 * ```
 */
export async function inject(options: InjectOptions): Promise<InjectedContext> {
  const {
    containers: containerIds,
    verify = true,
    format = "markdown",
    includeHistory = false,
    includeCitations = true,
    maxTokens,
    cacheTtl,
  } = options;

  // 1. Resolve container IDs to actual containers
  const containers = await resolveContainers(containerIds, {
    resolveLatest: true,
    includeDeps: false,
  });

  // 2. Collect all citations
  const citations: Citation[] = [];
  if (includeCitations) {
    for (const container of containers) {
      if (container.citations) {
        citations.push(...container.citations);
      }
    }
  }

  // 3. Collect all chain proofs
  const proofs: ChainProof[] = [];
  for (const container of containers) {
    if (container.chain) {
      proofs.push(container.chain);
    }
  }

  // 4. Verify proofs if requested
  let verified = false;
  let errors: string[] = [];
  
  if (verify && proofs.length > 0) {
    const verificationResult = await verifyProofs(proofs);
    verified = verificationResult.allValid;
    errors = verificationResult.errors;
  } else if (!verify) {
    verified = true; // Skip verification
  }

  // 5. Format for LLM consumption
  const formatted = formatForLLM(containers, {
    format,
    includeCitations,
    includeProofs: verify,
    maxTokens,
  });

  // 6. Estimate tokens
  const tokenCount = estimateTokens(formatted);

  return {
    containers,
    citations,
    proofs,
    formatted,
    tokenCount,
    verified,
    verifiedAt: new Date().toISOString(),
    errors: errors.length > 0 ? errors : undefined,
  };
}
