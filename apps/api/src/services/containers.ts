/**
 * GitChain Container Service
 * 
 * CRUD operations for containers with real database.
 * Now with visibility and access control support.
 */

import crypto from "crypto";

// ===========================================
// TYPES
// ===========================================

export type ContainerVisibility = "public" | "private" | "internal";
export type CollaboratorRole = "admin" | "write" | "read";

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
  visibility: ContainerVisibility;
  description: string | null;
  star_count: number;
  fork_count: number;
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

export interface Collaborator {
  id: string;
  container_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by: string | null;
  accepted_at: Date | null;
  created_at: Date;
  // Joined fields
  email?: string;
  name?: string;
  username?: string;
  avatar_url?: string;
}

export interface CreateContainerInput {
  type: string;
  namespace: string;
  identifier: string;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
  description?: string;
  visibility?: ContainerVisibility;
  userId?: string;
}

export interface UpdateContainerInput {
  data?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  description?: string;
  visibility?: ContainerVisibility;
  message?: string;
  userId?: string;
}

export interface ListContainersOptions {
  type?: string;
  namespace?: string;
  search?: string;
  visibility?: ContainerVisibility;
  userId?: string;  // Current user for access control
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
  // ACCESS CONTROL
  // ===========================================

  /**
   * Check if user can access container
   */
  async canAccess(containerId: string, userId: string | null, requiredRole?: CollaboratorRole): Promise<boolean> {
    const container = await this.db.queryOne<Container>(
      "SELECT id, visibility, created_by FROM containers WHERE id = $1 AND deleted_at IS NULL",
      [containerId]
    );

    if (!container) return false;

    // Public containers are accessible to everyone
    if (container.visibility === "public") return true;

    // No user = no access to private
    if (!userId) return false;

    // Owner has full access
    if (container.created_by === userId) return true;

    // Check collaborator access
    const collab = await this.db.queryOne<Collaborator>(
      "SELECT role FROM container_collaborators WHERE container_id = $1 AND user_id = $2 AND accepted_at IS NOT NULL",
      [containerId, userId]
    );

    if (!collab) return false;

    // If no specific role required, any access is enough
    if (!requiredRole) return true;

    // Check role hierarchy: admin > write > read
    const roleHierarchy: Record<CollaboratorRole, number> = { admin: 3, write: 2, read: 1 };
    return roleHierarchy[collab.role] >= roleHierarchy[requiredRole];
  }

  /**
   * Get user's role for a container
   */
  async getUserRole(containerId: string, userId: string | null): Promise<"owner" | CollaboratorRole | "viewer" | null> {
    if (!userId) return null;

    const container = await this.db.queryOne<Container>(
      "SELECT created_by, visibility FROM containers WHERE id = $1 AND deleted_at IS NULL",
      [containerId]
    );

    if (!container) return null;

    // Owner
    if (container.created_by === userId) return "owner";

    // Collaborator
    const collab = await this.db.queryOne<Collaborator>(
      "SELECT role FROM container_collaborators WHERE container_id = $1 AND user_id = $2",
      [containerId, userId]
    );

    if (collab) return collab.role;

    // Public = viewer
    if (container.visibility === "public") return "viewer";

    return null;
  }

  // ===========================================
  // COLLABORATORS
  // ===========================================

  async addCollaborator(
    containerId: string,
    userId: string,
    role: CollaboratorRole,
    invitedBy: string
  ): Promise<Collaborator> {
    return this.db.insert<Collaborator>("container_collaborators", {
      container_id: containerId,
      user_id: userId,
      role,
      invited_by: invitedBy,
      accepted_at: new Date(), // Auto-accept for now
    });
  }

  async removeCollaborator(containerId: string, userId: string): Promise<boolean> {
    const result = await this.db.execute(
      "DELETE FROM container_collaborators WHERE container_id = $1 AND user_id = $2",
      [containerId, userId]
    );
    return result.rowCount > 0;
  }

  async updateCollaboratorRole(containerId: string, userId: string, role: CollaboratorRole): Promise<boolean> {
    const result = await this.db.execute(
      "UPDATE container_collaborators SET role = $1 WHERE container_id = $2 AND user_id = $3",
      [role, containerId, userId]
    );
    return result.rowCount > 0;
  }

  async getCollaborators(containerId: string): Promise<Collaborator[]> {
    return this.db.query<Collaborator>(
      `SELECT cc.*, u.email, u.name, u.username, u.avatar_url
       FROM container_collaborators cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.container_id = $1
       ORDER BY cc.created_at`,
      [containerId]
    );
  }

  // ===========================================
  // CREATE
  // ===========================================

  async create(input: CreateContainerInput): Promise<Container> {
    const { type, namespace, identifier, data, meta = {}, description, visibility = "public", userId } = input;

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
      description: description || null,
      visibility,
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

  async getById(id: string, userId?: string | null): Promise<Container | null> {
    const container = await this.db.queryOne<Container>(
      "SELECT * FROM containers WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );

    if (!container) return null;

    // Access check
    if (container.visibility !== "public") {
      const hasAccess = await this.canAccess(id, userId || null);
      if (!hasAccess) return null;
    }

    return container;
  }

  async getByContainerId(containerId: string, userId?: string | null): Promise<Container | null> {
    let container: Container | null = null;

    // Handle "latest" version
    if (containerId.endsWith(":latest")) {
      const prefix = containerId.slice(0, -7); // Remove ":latest"
      const parsed = parseContainerId(prefix + ":v1");
      if (!parsed) return null;

      container = await this.db.queryOne<Container>(
        "SELECT * FROM containers WHERE namespace = $1 AND identifier = $2 AND deleted_at IS NULL ORDER BY version DESC LIMIT 1",
        [parsed.namespace, parsed.identifier]
      );
    } else {
      container = await this.db.queryOne<Container>(
        "SELECT * FROM containers WHERE container_id = $1 AND deleted_at IS NULL",
        [containerId]
      );
    }

    if (!container) return null;

    // Access check for non-public containers
    if (container.visibility !== "public") {
      const hasAccess = await this.canAccess(container.id, userId || null);
      if (!hasAccess) return null;
    }

    return container;
  }

  async list(options: ListContainersOptions = {}): Promise<ListContainersResult> {
    const {
      type,
      namespace,
      search,
      visibility,
      userId,
      limit = 50,
      offset = 0,
      orderBy = "created_at",
      orderDir = "desc",
    } = options;

    const conditions: string[] = ["c.deleted_at IS NULL"];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Visibility/Access control
    if (userId) {
      // User can see: public OR their own OR collaborator on
      conditions.push(`(
        c.visibility = 'public' 
        OR c.created_by = $${paramIndex++}
        OR EXISTS (SELECT 1 FROM container_collaborators cc WHERE cc.container_id = c.id AND cc.user_id = $${paramIndex++})
      )`);
      params.push(userId, userId);
    } else {
      // Anonymous: public only
      conditions.push("c.visibility = 'public'");
    }

    if (type) {
      conditions.push(`c.type = $${paramIndex++}`);
      params.push(type);
    }

    if (namespace) {
      conditions.push(`c.namespace = $${paramIndex++}`);
      params.push(namespace);
    }

    if (visibility) {
      conditions.push(`c.visibility = $${paramIndex++}`);
      params.push(visibility);
    }

    if (search) {
      conditions.push(`(c.data::text ILIKE $${paramIndex++} OR c.identifier ILIKE $${paramIndex++})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(" AND ");
    const orderClause = `c.${orderBy} ${orderDir.toUpperCase()}`;

    // Get total count
    const countResult = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM containers c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || "0", 10);

    // Get containers
    const containers = await this.db.query<Container>(
      `SELECT c.* FROM containers c WHERE ${whereClause} ORDER BY ${orderClause} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return { containers, total, limit, offset };
  }

  /**
   * List containers owned by or shared with a user
   */
  async listUserContainers(userId: string, options: Omit<ListContainersOptions, "userId"> = {}): Promise<ListContainersResult> {
    return this.list({ ...options, userId });
  }

  // ===========================================
  // UPDATE
  // ===========================================

  async update(id: string, input: UpdateContainerInput): Promise<Container | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const { data, meta, description, visibility, message, userId } = input;

    // Merge data and meta
    const newData = data ? { ...existing.data, ...data } : existing.data;
    const newMeta = meta ? { ...existing.meta, ...meta } : existing.meta;
    const contentHash = generateContentHash(newData as Record<string, unknown>);

    // Get previous commit
    const prevCommit = await this.db.queryOne<ContainerCommit>(
      "SELECT commit_hash FROM container_commits WHERE container_id = $1 ORDER BY version DESC LIMIT 1",
      [id]
    );

    // Build update fields
    const updates: string[] = [
      "data = $1",
      "meta = $2",
      "content_hash = $3",
      "updated_by = $4",
      "is_verified = FALSE",
      "verified_at = NULL",
    ];
    const updateParams: unknown[] = [JSON.stringify(newData), JSON.stringify(newMeta), contentHash, userId];
    let paramIdx = 5;

    if (description !== undefined) {
      updates.push(`description = $${paramIdx++}`);
      updateParams.push(description);
    }

    if (visibility !== undefined) {
      updates.push(`visibility = $${paramIdx++}`);
      updateParams.push(visibility);
    }

    updateParams.push(id);

    // Update container
    await this.db.execute(
      `UPDATE containers SET ${updates.join(", ")} WHERE id = $${paramIdx}`,
      updateParams
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
  // STARS
  // ===========================================

  async star(containerId: string, userId: string): Promise<boolean> {
    try {
      await this.db.insert("container_stars", {
        container_id: containerId,
        user_id: userId,
      });
      return true;
    } catch {
      return false; // Already starred
    }
  }

  async unstar(containerId: string, userId: string): Promise<boolean> {
    const result = await this.db.execute(
      "DELETE FROM container_stars WHERE container_id = $1 AND user_id = $2",
      [containerId, userId]
    );
    return result.rowCount > 0;
  }

  async isStarred(containerId: string, userId: string): Promise<boolean> {
    const result = await this.db.queryOne<{ user_id: string }>(
      "SELECT user_id FROM container_stars WHERE container_id = $1 AND user_id = $2",
      [containerId, userId]
    );
    return !!result;
  }

  // ===========================================
  // SEARCH
  // ===========================================

  async search(query: string, options: ListContainersOptions = {}): Promise<ListContainersResult> {
    return this.list({ ...options, search: query });
  }
}
