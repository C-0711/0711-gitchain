/**
 * Cache layer for inject operations
 * 
 * Uses Redis for distributed caching of container lookups
 */

import Redis from "ioredis";

interface CacheConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  defaultTtl: number;  // seconds
  enabled: boolean;
}

const defaultConfig: CacheConfig = {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
  defaultTtl: 300,  // 5 minutes
  enabled: process.env.GITCHAIN_CACHE_ENABLED !== "false",
};

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!defaultConfig.enabled) return null;
  
  if (!redis && defaultConfig.redis) {
    try {
      redis = new Redis({
        host: defaultConfig.redis.host,
        port: defaultConfig.redis.port,
        password: defaultConfig.redis.password,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    } catch {
      console.warn("[GitChain] Redis connection failed, caching disabled");
      return null;
    }
  }
  return redis;
}

/**
 * Get from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const data = await client.get(`gitchain:${key}`);
    if (data) {
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.warn("[GitChain Cache] Get error:", err);
  }
  return null;
}

/**
 * Set in cache
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttl = defaultConfig.defaultTtl
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.setex(`gitchain:${key}`, ttl, JSON.stringify(value));
  } catch (err) {
    console.warn("[GitChain Cache] Set error:", err);
  }
}

/**
 * Delete from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(`gitchain:${key}`);
  } catch (err) {
    console.warn("[GitChain Cache] Delete error:", err);
  }
}

/**
 * Invalidate all cache entries for a container
 */
export async function invalidateContainer(containerId: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const keys = await client.keys(`gitchain:container:${containerId}*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    console.warn("[GitChain Cache] Invalidate error:", err);
  }
}

/**
 * Close Redis connection
 */
export async function closeCache(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
