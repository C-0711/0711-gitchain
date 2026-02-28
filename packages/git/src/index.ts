/**
 * @0711/git - Git versioning layer for GitChain containers
 * 
 * Provides Git-based version control for containers using isomorphic-git.
 */

export { GitRepository } from "./repository.js";
export { commitContainer, getHistory, getDiff } from "./operations.js";
export { createNamespace, listNamespaces } from "./namespace.js";
export type { GitConfig, CommitInfo, DiffResult } from "./types.js";
