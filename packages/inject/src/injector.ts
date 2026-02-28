/**
 * Core inject() function - THE INNOVATION
 * 
 * Retrieves verified containers and formats them for AI agent consumption.
 * Every fact is traceable, every output is verified.
 */

import type { Container } from "@0711/core";
import type { InjectOptions, InjectedContext, Citation } from "./types.js";
import { resolveContainers } from "./resolver.js";
import { formatContext } from "./formatter.js";
import { verifyContainers } from "./verifier.js";

/**
 * Inject verified context from containers into AI agent
 * 
 * @example
 * ```typescript
 * const context = await inject({
 *   containers: ["0711:product:bosch:7736606982:v3"],
 *   verify: true,
 *   format: "markdown",
 * });
 * 
 * // Use context.formatted in your LLM prompt
 * ```
 */
export async function inject(options: InjectOptions): Promise<InjectedContext> {
  const {
    containers: containerIds,
    verify = true,
    format = "markdown",
    includeCitations = true,
    includeHistory = false,
    maxTokens,
  } = options;

  // 1. Resolve container IDs to actual data
  const containers = await resolveContainers(containerIds, {
    resolveLatest: containerIds.some((id) => id.includes(":latest")),
    includeHistory,
  });

  if (containers.length === 0) {
    return {
      containers: [],
      citations: [],
      proofs: [],
      formatted: "",
      tokenCount: 0,
      verified: false,
      verifiedAt: new Date().toISOString(),
    };
  }

  // 2. Optionally verify blockchain proofs
  let proofs: InjectedContext["proofs"] = [];
  let verified = false;

  if (verify) {
    const verification = await verifyContainers(containers);
    proofs = verification.proofs;
    verified = verification.allVerified;
  }

  // 3. Collect all citations
  const citations: Citation[] = [];
  if (includeCitations) {
    for (const container of containers) {
      if (container.citations) {
        for (const citation of container.citations) {
          citations.push({
            containerId: container.id,
            ...citation,
          });
        }
      }
    }
  }

  // 4. Format for LLM consumption
  const formatted = formatContext(containers, {
    format,
    includeCitations,
    includeProofs: verify,
    maxTokens,
  });

  // 5. Estimate token count (rough: 4 chars ≈ 1 token)
  const tokenCount = Math.ceil(formatted.length / 4);

  return {
    containers,
    citations,
    proofs,
    formatted,
    tokenCount,
    verified,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Inject multiple container sets in parallel
 */
export async function injectBatch(
  optionsList: InjectOptions[]
): Promise<InjectedContext[]> {
  return Promise.all(optionsList.map(inject));
}

/**
 * Create a bound inject function with default options
 */
export function createInject(defaults: Partial<InjectOptions>) {
  return (options: Partial<InjectOptions> & { containers: string[] }) =>
    inject({ ...defaults, ...options });
}

// Export types
export type { InjectOptions, InjectedContext, Citation };
