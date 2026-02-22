/**
 * Container resolution
 * 
 * Resolves container IDs to actual container data from Git repositories
 */

import type { Container } from "@0711/core";
import { parseContainerId } from "@0711/core";
import { GitRepository } from "@0711/git";
import type { ResolverOptions } from "./types";
import { cacheGet, cacheSet } from "./cache";

// Default Git config
const gitConfig = {
  baseDir: process.env.GITCHAIN_DATA_DIR || "/data/gitchain/repos",
  authorName: "GitChain",
  authorEmail: "system@gitchain.0711.io",
};

/**
 * Resolve container IDs to container data
 */
export async function resolveContainers(
  containerIds: string[],
  options: ResolverOptions = {}
): Promise<Container[]> {
  const { resolveLatest = true } = options;
  const containers: Container[] = [];

  for (const id of containerIds) {
    const container = await resolveContainer(id, resolveLatest);
    if (container) {
      containers.push(container);
    } else {
      console.warn(`[GitChain] Container not found: ${id}`);
    }
  }

  return containers;
}

/**
 * Resolve a single container
 */
async function resolveContainer(
  id: string,
  resolveLatest: boolean
): Promise<Container | null> {
  const parsed = parseContainerId(id);
  const cacheKey = `container:${id}`;

  // Check cache first
  const cached = await cacheGet<Container>(cacheKey);
  if (cached) {
    return cached;
  }

  // Load from Git
  try {
    const repoNamespace = `${parsed.type}/${parsed.namespace}`;
    const repo = new GitRepository(repoNamespace, gitConfig);
    
    let data: object | null;
    let version: number;
    
    if (parsed.version === "latest" || resolveLatest) {
      // Get latest version
      data = await repo.readContainer(parsed.identifier);
      const history = await repo.getHistory(parsed.identifier, 1000);
      version = history.length;
    } else {
      // Get specific version
      const history = await repo.getHistory(parsed.identifier, 1000);
      const targetIndex = history.length - (parsed.version as number);
      
      if (targetIndex < 0 || targetIndex >= history.length) {
        return null;
      }
      
      const commit = history[targetIndex];
      data = await repo.readAtCommit(parsed.identifier, commit.hash);
      version = parsed.version as number;
    }

    if (!data) {
      return null;
    }

    // Build container object
    const container: Container = {
      id: `0711:${parsed.type}:${parsed.namespace}:${parsed.identifier}:v${version}`,
      type: parsed.type,
      namespace: parsed.namespace,
      identifier: parsed.identifier,
      version,
      meta: (data as any).meta || {
        name: parsed.identifier,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: "unknown",
      },
      data: (data as any).data || data,
      citations: (data as any).citations,
      media: (data as any).media,
    };

    // Add Git info
    const history = await repo.getHistory(parsed.identifier, 1);
    if (history.length > 0) {
      container.git = {
        repository: repoNamespace,
        branch: "main",
        commit: history[0].hash,
        commitMessage: history[0].message,
        commitAt: history[0].timestamp.toISOString(),
      };
    }

    // Cache the result
    await cacheSet(cacheKey, container, 300);

    return container;
  } catch (err) {
    console.error(`[GitChain] Error resolving container ${id}:`, err);
    return null;
  }
}

/**
 * Clear resolver cache
 */
export function clearCache(): void {
  // Cache is managed by cache.ts
}

/**
 * Pre-warm cache with containers
 */
export async function warmCache(containers: Container[]): Promise<void> {
  for (const container of containers) {
    await cacheSet(`container:${container.id}`, container, 300);
  }
}
