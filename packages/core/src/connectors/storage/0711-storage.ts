/**
 * 0711-Storage Connector
 * 
 * Native integration with 0711's sovereign object storage.
 * Content-addressable, deduplicated, S3-compatible.
 */

import type {
  StorageConnector,
  StorageConfig,
  ObjectMetadata,
  PutResult,
  ListOptions,
  ListResult,
  StorageStats,
  HealthCheckResult,
} from "../types";

interface Storage0711Config extends StorageConfig {
  type: "0711-storage";
  endpoint: string;
  bucket: string;
  presign?: boolean;
  presignExpiry?: number;
}

export class Storage0711Connector implements StorageConnector {
  readonly name = "0711-Storage";
  readonly type = "0711-storage";

  private config!: Storage0711Config;
  private baseUrl!: string;

  async init(config: StorageConfig): Promise<void> {
    this.config = config as Storage0711Config;
    this.baseUrl = this.config.endpoint.replace(/\/$/, "");

    // Ensure bucket exists
    await this.ensureBucket();
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      const data = await res.json();
      return {
        healthy: data.status === "healthy",
        latencyMs: Date.now() - start,
        message: data.status,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async close(): Promise<void> {
    // No persistent connections to close
  }

  private async ensureBucket(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/buckets/${this.config.bucket}`, {
        method: "PUT",
      });
    } catch {
      // Bucket might already exist, ignore
    }
  }

  async put(
    key: string,
    data: Buffer,
    metadata?: ObjectMetadata
  ): Promise<PutResult> {
    const url = `${this.baseUrl}/buckets/${this.config.bucket}/objects/${key}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": metadata?.contentType || "application/octet-stream",
        "Content-Length": String(data.length),
        ...(metadata?.custom || {}),
      },
      body: data,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to put object: ${error}`);
    }

    const result = await res.json();
    return {
      key,
      etag: result.etag || "",
      size: data.length,
      versionId: result.versionId,
    };
  }

  async get(key: string): Promise<Buffer> {
    const url = `${this.baseUrl}/buckets/${this.config.bucket}/objects/${key}`;

    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Object not found: ${key}`);
      }
      throw new Error(`Failed to get object: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async head(key: string): Promise<ObjectMetadata | null> {
    const url = `${this.baseUrl}/buckets/${this.config.bucket}/objects/${key}`;

    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error(`Failed to head object: ${res.statusText}`);
    }

    return {
      contentType: res.headers.get("content-type") || undefined,
      contentLength: parseInt(res.headers.get("content-length") || "0", 10),
      etag: res.headers.get("etag")?.replace(/"/g, "") || undefined,
      lastModified: res.headers.get("last-modified")
        ? new Date(res.headers.get("last-modified")!)
        : undefined,
    };
  }

  async delete(key: string): Promise<void> {
    const url = `${this.baseUrl}/buckets/${this.config.bucket}/objects/${key}`;

    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Failed to delete object: ${res.statusText}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const metadata = await this.head(key);
    return metadata !== null;
  }

  async list(prefix: string, options?: ListOptions): Promise<ListResult> {
    const params = new URLSearchParams();
    if (prefix) params.set("prefix", prefix);
    if (options?.maxKeys) params.set("max_keys", String(options.maxKeys));
    if (options?.continuationToken) {
      params.set("continuation_token", options.continuationToken);
    }

    const url = `${this.baseUrl}/buckets/${this.config.bucket}?${params}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to list objects: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      objects: (data.objects || []).map((obj: any) => ({
        key: obj.key,
        size: obj.size,
        lastModified: new Date(obj.last_modified || obj.created_at),
        etag: obj.etag,
      })),
      isTruncated: data.is_truncated || false,
      continuationToken: data.continuation_token,
    };
  }

  async presignGet(key: string, expiresIn?: number): Promise<string> {
    const url = `${this.baseUrl}/presign`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "GET",
        bucket: this.config.bucket,
        key,
        expires_in: expiresIn || this.config.presignExpiry || 3600,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate presigned URL: ${res.statusText}`);
    }

    const data = await res.json();
    return data.url;
  }

  async presignPut(
    key: string,
    contentType?: string,
    expiresIn?: number
  ): Promise<string> {
    const url = `${this.baseUrl}/presign`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "PUT",
        bucket: this.config.bucket,
        key,
        content_type: contentType || "application/octet-stream",
        expires_in: expiresIn || this.config.presignExpiry || 3600,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate presigned URL: ${res.statusText}`);
    }

    const data = await res.json();
    return data.url;
  }

  async getStats(): Promise<StorageStats> {
    const url = `${this.baseUrl}/stats`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to get stats: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      bucketCount: data.buckets || 1,
      objectCount: data.objects || 0,
      totalBytes: data.total_bytes || 0,
      dedupRatio: data.dedup_ratio,
    };
  }
}

/**
 * Factory function for connector registry
 */
export async function create0711StorageConnector(
  config: StorageConfig
): Promise<StorageConnector> {
  const connector = new Storage0711Connector();
  await connector.init(config);
  return connector;
}
