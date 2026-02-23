/**
 * GitChain Container Service
 * 
 * CRUD operations for containers with real database.
 */

import crypto from "crypto";

// ===========================================
// TYPES
// ===========================================

export interface Container {
  id: string;
  container_id: string;
  type: string;
  namespace: string;
  namespace_id: string | null;
  identifier: string;
  version: number;
  data: Record<string, unknown>;
  meta: Record<string, unknown>;
  content_hash: string | null;
  is_verified: boolean;
  verified_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ContainerFile {
  id: string;
  container_id: string;
  storage_key: string;
  filename: string;
  content_type: string | null;
  size: number | null;
  checksum: string | null;
  created_at: Date;
}

export interface ContainerCommit {
  id: string;
  container_id: string;
  version: number;
  data: Record<string, unknown>;
  meta: Record<string, unknown> | null;
  message: string | null;
  author_id: string | null;
  commit_hash: string;
  parent_hash: string | null;
  created_at: Date;
}

export interface CreateContainerInput {
  type: string;
  namespace: string;
  identifier: string;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
  userId?: string;
}

export interface UpdateContainerInput {
  data?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  message?: string;
  userId?: string;
}

export interface ListContainersOptions {
  type?: string;
  namespace?: string;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

export interface ListContainersResult {
  containers: Container[];
  total: number;
  limit: number;
  offset: number;
}

// ===========================================
// DATABASE INTERFACE
// ===========================================

interface DatabaseConnector {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  insert<T>(table: string, data: Record<string, unknown>): Promise<T>;
  execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }>;
  transaction<T>(fn: (tx: DatabaseConnector) => Promise<T>): Promise<T>;
}

// ===========================================
// HELPERS
// ===========================================

function generateContentHash(data: Record<string, unknown>): string {
  const json = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(json).digest("hex");
}

function generateCommitHash(
  containerId: string,
  version: number,
  data: Record<string, unknown>,
  parentHash: string | null
): string {
  const content = JSON.stringify({ containerId, version, data, parentHash });
  return crypto.createHash("sha256").update(content).digest("hex");
}

function buildContainerId(type: string, namespace: string, identifier: string, version: number): string {
  return `0711:${type}:${namespace}:${identifier}:v${version}`;
}

function parseContainerId(containerId: string): { type: string; namespace: string; identifier: string; version: number } | null {
  const match = containerId.match(/^0711:(\w+):([^:]+):([^:]+):v(\d+)$/);
  if (!match) return null;
  return {
    type: match[1],
    namespace: match[2],
    identifier: match[3],
    version: parseInt(match[4], 10),
  };
}

// ===========================================
// CONTAINER SERVICE CLASS
// ===========================================

export class ContainerService {
  constructor(private db: DatabaseConnector) {}

  // ===========================================
  // CREATE
  // ===========================================

  async create(input: CreateContainerInput): Promise<Container> {
    const { type, namespace, identifier, data, meta = {}, userId } = input;

    // Check if container exists
    const existing = await this.db.queryOne<Container>(
      "SELECT id FROM containers WHERE namespace = $1 AND identifier = $2 AND deleted_at IS NULL ORDER BY version DESC LIMIT 1",
      [namespace, identifier]
    );

    const version = existing ? (await this.getLatestVersion(namespace, identifier)) + 1 : 1;
    const containerId = buildContainerId(type, namespace, identifier, version);
    const contentHash = generateContentHash(data);

    // Get namespace_id
    const ns = await this.db.queryOne<{ id: string }>(
      "SELECT id FROM namespaces WHERE name = $1 AND deleted_at IS NULL",
      [namespace]
    );

    // Create container
    const container = await this.db.insert<Container>("containers", {
      container_id: containerId,
      type,
      namespace,
      namespace_id: ns?.id || null,
      identifier,
      version,
      data: JSON.stringify(data),
      meta: JSON.stringify(meta),
      content_hash: contentHash,
      created_by: userId || null,
      updated_by: userId || null,
    });

    // Create initial commit
    const commitHash = generateCommitHash(container.id, version, data, null);
    await this.db.insert("container_commits", {
      container_id: container.id,
      version,
      data: JSON.stringify(data),
      meta: JSON.stringify(meta),
      message: "Initial version",
      author_id: userId || null,
      commit_hash: commitHash,
      parent_hash: null,
    });

    // Initialize stats
    await this.db.insert("container_stats", {
      container_id: container.id,
    });

    return container;
  }

  // ===========================================
  // READ
  // ===========================================

  async getById(id: string): Promise<Container | null> {
    return this.db.queryOne<Container>(
      "SELECT * FROM containers WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
  }

  async getByContainerId(containerId: string): Promise<Container | null> {
    // Handle "latest" version
    if (containerId.endsWith(":latest")) {
      const prefix = containerId.slice(0, -7); // Remove ":latest"
      const parsed = parseContainerId(prefix + ":v1");
      if (!parsed) return null;

      return this.db.queryOne<Container>(
        "SELECT * FROM containers WHERE namespace = $1 AND identifier = $2 AND deleted_at IS NULL ORDER BY version DESC LIMIT 1",
        [parsed.namespace, parsed.identifier]
      );
    }

    return this.db.queryOne<Container>(
      "SELECT * FROM containers WHERE container_id = $1 AND deleted_at IS NULL",
      [containerId]
    );
  }

  async list(options: ListContainersOptions = {}): Promise<ListContainersResult> {
    const {
      type,
      namespace,
      search,
      limit = 50,
      offset = 0,
      orderBy = "created_at",
      orderDir = "desc",
    } = options;

    const conditions: string[] = ["deleted_at IS NULL"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    if (namespace) {
      conditions.push(`namespace = $${paramIndex++}`);
      params.push(namespace);
    }

    if (search) {
      conditions.push(`(data::text ILIKE $${paramIndex++} OR identifier ILIKE $${paramIndex++})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(" AND ");
    const orderClause = `${orderBy} ${orderDir.toUpperCase()}`;

    // Get total count
    const countResult = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM containers WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || "0", 10);

    // Get containers
    const containers = await this.db.query<Container>(
      `SELECT * FROM containers WHERE ${whereClause} ORDER BY ${orderClause} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return { containers, total, limit, offset };
  }

  // ===========================================
  // UPDATE
  // ===========================================

  async update(id: string, input: UpdateContainerInput): Promise<Container | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const { data, meta, message, userId } = input;

    // Merge data and meta
    const newData = data ? { ...existing.data, ...data } : existing.data;
    const newMeta = meta ? { ...existing.meta, ...meta } : existing.meta;
    const contentHash = generateContentHash(newData as Record<string, unknown>);

    // Get previous commit
    const prevCommit = await this.db.queryOne<ContainerCommit>(
      "SELECT commit_hash FROM container_commits WHERE container_id = $1 ORDER BY version DESC LIMIT 1",
      [id]
    );

    // Update container
    await this.db.execute(
      `UPDATE containers SET 
        data = $1, meta = $2, content_hash = $3, updated_by = $4, is_verified = FALSE, verified_at = NULL
       WHERE id = $5`,
      [JSON.stringify(newData), JSON.stringify(newMeta), contentHash, userId, id]
    );

    // Create new commit
    const newVersion = existing.version; // Same version, new commit
    const commitHash = generateCommitHash(id, newVersion, newData as Record<string, unknown>, prevCommit?.commit_hash || null);

    await this.db.insert("container_commits", {
      container_id: id,
      version: newVersion,
      data: JSON.stringify(newData),
      meta: JSON.stringify(newMeta),
      message: message || "Updated",
      author_id: userId || null,
      commit_hash: commitHash,
      parent_hash: prevCommit?.commit_hash || null,
    });

    return this.getById(id);
  }

  // ===========================================
  // DELETE
  // ===========================================

  async delete(id: string): Promise<boolean> {
    const result = await this.db.execute(
      "UPDATE containers SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
    return result.rowCount > 0;
  }

  // ===========================================
  // VERSION HISTORY
  // ===========================================

  async getHistory(id: string): Promise<ContainerCommit[]> {
    return this.db.query<ContainerCommit>(
      "SELECT * FROM container_commits WHERE container_id = $1 ORDER BY version DESC",
      [id]
    );
  }

  async getLatestVersion(namespace: string, identifier: string): Promise<number> {
    const result = await this.db.queryOne<{ version: number }>(
      "SELECT MAX(version) as version FROM containers WHERE namespace = $1 AND identifier = $2 AND deleted_at IS NULL",
      [namespace, identifier]
    );
    return result?.version || 0;
  }

  // ===========================================
  // FILES
  // ===========================================

  async addFile(containerId: string, file: Omit<ContainerFile, "id" | "created_at">): Promise<ContainerFile> {
    return this.db.insert<ContainerFile>("container_files", {
      container_id: containerId,
      storage_key: file.storage_key,
      filename: file.filename,
      content_type: file.content_type,
      size: file.size,
      checksum: file.checksum,
    });
  }

  async getFiles(containerId: string): Promise<ContainerFile[]> {
    return this.db.query<ContainerFile>(
      "SELECT * FROM container_files WHERE container_id = $1 ORDER BY created_at",
      [containerId]
    );
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const result = await this.db.execute(
      "DELETE FROM container_files WHERE id = $1",
      [fileId]
    );
    return result.rowCount > 0;
  }

  // ===========================================
  // STATS
  // ===========================================

  async incrementStat(containerId: string, stat: "view_count" | "inject_count" | "verify_count"): Promise<void> {
    await this.db.execute(
      `UPDATE container_stats SET ${stat} = ${stat} + 1, last_accessed_at = NOW() WHERE container_id = $1`,
      [containerId]
    );
  }

  // ===========================================
  // SEARCH
  // ===========================================

  async search(query: string, options: ListContainersOptions = {}): Promise<ListContainersResult> {
    return this.list({ ...options, search: query });
  }
}
