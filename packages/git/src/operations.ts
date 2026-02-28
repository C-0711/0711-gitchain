/**
 * Git operations for containers
 */

import { GitRepository } from "./repository.js";
import type { GitConfig, CommitInfo, DiffResult, DiffChange } from "./types.js";

const defaultConfig: GitConfig = {
  baseDir: process.env.GITCHAIN_DATA_DIR || "/data/gitchain/repos",
  authorName: "GitChain",
  authorEmail: "system@gitchain.0711.io",
};

/**
 * Commit a container update
 */
export async function commitContainer(
  type: string,
  namespace: string,
  identifier: string,
  content: object,
  message?: string,
  config: Partial<GitConfig> = {}
): Promise<{ hash: string; version: number }> {
  const fullConfig = { ...defaultConfig, ...config };
  const repoNamespace = `${type}/${namespace}`;
  const repo = new GitRepository(repoNamespace, fullConfig);

  const hash = await repo.writeContainer(identifier, content, message);
  const history = await repo.getHistory(identifier, 1000);

  return {
    hash,
    version: history.length,
  };
}

/**
 * Get commit history for a container
 */
export async function getHistory(
  type: string,
  namespace: string,
  identifier?: string,
  limit = 50,
  config: Partial<GitConfig> = {}
): Promise<CommitInfo[]> {
  const fullConfig = { ...defaultConfig, ...config };
  const repoNamespace = `${type}/${namespace}`;
  const repo = new GitRepository(repoNamespace, fullConfig);

  return repo.getHistory(identifier, limit);
}

/**
 * Get diff between two versions
 */
export async function getDiff(
  type: string,
  namespace: string,
  identifier: string,
  fromCommit: string,
  toCommit: string,
  config: Partial<GitConfig> = {}
): Promise<DiffResult> {
  const fullConfig = { ...defaultConfig, ...config };
  const repoNamespace = `${type}/${namespace}`;
  const repo = new GitRepository(repoNamespace, fullConfig);

  const fromContent = await repo.readAtCommit(identifier, fromCommit);
  const toContent = await repo.readAtCommit(identifier, toCommit);

  const changes = computeChanges(fromContent, toContent);
  const history = await repo.getHistory(identifier, 1000);

  // Find version numbers
  const fromIndex = history.findIndex((c) => c.hash === fromCommit);
  const toIndex = history.findIndex((c) => c.hash === toCommit);

  return {
    containerId: `0711:${type}:${namespace}:${identifier}`,
    fromVersion: history.length - fromIndex,
    toVersion: history.length - toIndex,
    changes,
  };
}

/**
 * Compute changes between two objects
 */
function computeChanges(
  from: object | null,
  to: object | null,
  prefix = ""
): DiffChange[] {
  const changes: DiffChange[] = [];

  if (!from && !to) return changes;

  if (!from) {
    // All added
    for (const [key, value] of Object.entries(to || {})) {
      const path = prefix ? `${prefix}.${key}` : key;
      changes.push({ path, type: "added", newValue: value });
    }
    return changes;
  }

  if (!to) {
    // All removed
    for (const [key, value] of Object.entries(from)) {
      const path = prefix ? `${prefix}.${key}` : key;
      changes.push({ path, type: "removed", oldValue: value });
    }
    return changes;
  }

  const fromObj = from as Record<string, unknown>;
  const toObj = to as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(fromObj), ...Object.keys(toObj)]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const oldVal = fromObj[key];
    const newVal = toObj[key];

    if (!(key in fromObj)) {
      changes.push({ path, type: "added", newValue: newVal });
    } else if (!(key in toObj)) {
      changes.push({ path, type: "removed", oldValue: oldVal });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (typeof oldVal === "object" && typeof newVal === "object") {
        changes.push(
          ...computeChanges(oldVal as object, newVal as object, path)
        );
      } else {
        changes.push({ path, type: "modified", oldValue: oldVal, newValue: newVal });
      }
    }
  }

  return changes;
}
