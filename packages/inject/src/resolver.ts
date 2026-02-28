/**
 * Container resolution via GitChain API
 */

import type { Container, ContainerType } from "@0711/core";
import type { ResolverOptions } from "./types.js";
import { cacheGet, cacheSet } from "./cache.js";

const API_URL = process.env.GITCHAIN_API_URL || "https://api-gitchain.0711.io";

/**
 * Resolve container IDs to container data via API
 */
export async function resolveContainers(
  containerIds: string[],
  options: ResolverOptions = {}
): Promise<Container[]> {
  const { apiUrl = API_URL, apiKey, useCache = true, cacheTtl = 300 } = options;
  const containers: Container[] = [];

  for (const id of containerIds) {
    // Check cache first
    if (useCache) {
      const cached = await cacheGet<Container>(id);
      if (cached && cached.id) {
        containers.push(cached);
        continue;
      }
    }

    // Resolve via API
    const container = await resolveFromApi(id, apiUrl, apiKey);
    if (container) {
      containers.push(container);
      
      // Cache result
      if (useCache) {
        await cacheSet(id, container, cacheTtl);
      }
    }
  }

  return containers;
}

async function resolveFromApi(
  id: string,
  apiUrl: string,
  apiKey?: string
): Promise<Container | null> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${apiUrl}/api/containers/${encodeURIComponent(id)}`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Container not found: ${id}`);
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as Container;
  } catch (error) {
    console.error(`Failed to resolve container ${id}:`, error);
    return null;
  }
}

/**
 * Pre-warm the cache for a list of containers
 */
export async function warmCache(
  containerIds: string[],
  options: ResolverOptions = {}
): Promise<void> {
  await resolveContainers(containerIds, { ...options, useCache: true });
}

/**
 * Get container metadata without full data
 */
export async function getContainerMeta(
  id: string,
  options: ResolverOptions = {}
): Promise<{ id: string; type: ContainerType; name: string; version: number } | null> {
  const container = await resolveContainers([id], options);
  if (!container[0]) return null;
  
  return {
    id: container[0].id,
    type: container[0].type,
    name: container[0].meta.name,
    version: container[0].version,
  };
}
