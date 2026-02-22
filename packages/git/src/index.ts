/**
 * @0711/git - Git versioning layer for GitChain containers
 * 
 * Provides Git-based version control for containers using isomorphic-git.
 */

export { GitRepository } from "./repository";
export { commitContainer, getHistory, getDiff } from "./operations";
export { createNamespace, listNamespaces } from "./namespace";
export type { GitConfig, CommitInfo, DiffResult } from "./types";
