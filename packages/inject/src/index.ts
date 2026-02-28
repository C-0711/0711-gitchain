/**
 * @0711/inject - Context injection for AI agents
 * 
 * The core innovation of GitChain: verified, traceable context injection.
 * 
 * @example
 * ```typescript
 * import { inject } from "@0711/inject";
 * 
 * const context = await inject({
 *   containers: ["0711:product:bosch:7736606982:v3"],
 *   verify: true,
 *   format: "markdown",
 * });
 * 
 * // Use context.formatted in your LLM prompt
 * // Every fact is verified and traceable
 * ```
 */

export { inject, injectBatch, createInject } from "./injector.js";
export { resolveContainers, warmCache } from "./resolver.js";
export { formatContext } from "./formatter.js";
export { verifyContainers, verifyHash } from "./verifier.js";
export { cacheGet, cacheSet, cacheDelete, invalidateContainer, closeCache } from "./cache.js";

export type {
  Container,
  InjectOptions,
  InjectedContext,
  Citation,
  ChainProof,
  VerificationResult,
  ResolverOptions,
} from "./types.js";
