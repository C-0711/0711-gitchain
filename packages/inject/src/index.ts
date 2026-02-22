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

export { inject, injectBatch, createInject } from "./injector";
export { resolveContainers, warmCache } from "./resolver";
export { formatContext } from "./formatter";
export { verifyContainers, verifyHash } from "./verifier";
export { cacheGet, cacheSet, cacheDelete, invalidateContainer, closeCache } from "./cache";

export type {
  Container,
  InjectOptions,
  InjectedContext,
  Citation,
  ChainProof,
  VerificationResult,
  ResolverOptions,
} from "./types";
