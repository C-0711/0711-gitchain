import { pool } from "@/lib/db";

// Helper to create cursor-based pagination
function encodeCursor(id: string, index: number): string {
  return Buffer.from(`${id}:${index}`).toString("base64");
}

function decodeCursor(cursor: string): { id: string; index: number } {
  const decoded = Buffer.from(cursor, "base64").toString("utf-8");
  const [id, index] = decoded.split(":");
  return { id, index: parseInt(index) };
}

function createConnection<T extends { id: string }>(
  nodes: T[],
  totalCount: number,
  first: number,
  offset: number
) {
  return {
    edges: nodes.map((node, i) => ({
      node,
      cursor: encodeCursor(node.id, offset + i),
    })),
    nodes,
    pageInfo: {
      hasNextPage: offset + nodes.length < totalCount,
      hasPreviousPage: offset > 0,
      startCursor: nodes.length > 0 ? encodeCursor(nodes[0].id, offset) : null,
      endCursor: nodes.length > 0 ? encodeCursor(nodes[nodes.length - 1].id, offset + nodes.length - 1) : null,
    },
    totalCount,
  };
}

export const resolvers = {
  Query: {
    viewer: async (_: unknown, __: unknown, context: { userId?: string }) => {
      if (!context.userId) return null;
      const result = await pool.query(
        `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
        [context.userId]
      );
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    },

    user: async (_: unknown, { username, id }: { username?: string; id?: string }) => {
      const result = await pool.query(
        `SELECT * FROM users WHERE (username = $1 OR id::text = $2) AND deleted_at IS NULL`,
        [username, id]
      );
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    },

    container: async (_: unknown, { id, identifier }: { id?: string; identifier?: string }, context: { userId?: string }) => {
      const result = await pool.query(
        `SELECT c.*, u.username as owner_username
         FROM containers c
         LEFT JOIN users u ON c.owner_id = u.id
         WHERE (c.id::text = $1 OR c.identifier = $2) AND c.deleted_at IS NULL`,
        [id, identifier]
      );
      if (!result.rows[0]) return null;

      const container = result.rows[0];
      // Check visibility
      if (container.visibility === "private" && container.owner_id !== context.userId) {
        const hasAccess = await pool.query(
          `SELECT 1 FROM container_collaborators WHERE container_id = $1 AND user_id = $2`,
          [container.id, context.userId]
        );
        if (hasAccess.rows.length === 0) return null;
      }

      return mapContainer(container);
    },

    containers: async (
      _: unknown,
      { first = 30, after, query, visibility, sort = "UPDATED" }: {
        first?: number;
        after?: string;
        query?: string;
        visibility?: string;
        sort?: string;
      },
      context: { userId?: string }
    ) => {
      const offset = after ? decodeCursor(after).index + 1 : 0;
      const conditions: string[] = ["c.deleted_at IS NULL"];
      const params: (string | number)[] = [];
      let paramIndex = 1;

      if (visibility) {
        conditions.push(`c.visibility = $${paramIndex++}`);
        params.push(visibility.toLowerCase());
      } else if (!context.userId) {
        conditions.push(`c.visibility = 'public'`);
      }

      if (query) {
        conditions.push(`(c.name ILIKE $${paramIndex} OR c.identifier ILIKE $${paramIndex})`);
        params.push(`%${query}%`);
        paramIndex++;
      }

      const orderBy = getContainerOrderBy(sort);

      params.push(first, offset);
      const result = await pool.query(
        `SELECT c.* FROM containers c
         WHERE ${conditions.join(" AND ")}
         ORDER BY ${orderBy}
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM containers c WHERE ${conditions.join(" AND ")}`,
        params.slice(0, -2)
      );

      return createConnection(
        result.rows.map(mapContainer).filter((c): c is ContainerType => c !== null),
        parseInt(countResult.rows[0].count),
        first,
        offset
      );
    },

    explore: async (
      _: unknown,
      { first = 30, after, query, language, topic, sort = "STARS" }: {
        first?: number;
        after?: string;
        query?: string;
        language?: string;
        topic?: string;
        sort?: string;
      },
      context: { userId?: string }
    ) => {
      const offset = after ? decodeCursor(after).index + 1 : 0;
      const conditions: string[] = ["c.visibility = 'public'", "c.deleted_at IS NULL"];
      const params: (string | number)[] = [];
      let paramIndex = 1;

      if (query) {
        conditions.push(`(c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
        params.push(`%${query}%`);
        paramIndex++;
      }

      if (language) {
        conditions.push(`c.metadata->>'language' = $${paramIndex++}`);
        params.push(language);
      }

      if (topic) {
        conditions.push(`c.metadata->'topics' ? $${paramIndex++}`);
        params.push(topic);
      }

      const orderBy = getContainerOrderBy(sort);

      params.push(first, offset);
      const result = await pool.query(
        `SELECT c.* FROM containers c
         WHERE ${conditions.join(" AND ")}
         ORDER BY ${orderBy}
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM containers c WHERE ${conditions.join(" AND ")}`,
        params.slice(0, -2)
      );

      return createConnection(
        result.rows.map(mapContainer).filter((c): c is ContainerType => c !== null),
        parseInt(countResult.rows[0].count),
        first,
        offset
      );
    },

    trending: async (
      _: unknown,
      { since = "WEEKLY", language, first = 25 }: { since?: string; language?: string; first?: number }
    ) => {
      const interval = since === "DAILY" ? "1 day" : since === "MONTHLY" ? "30 days" : "7 days";

      const conditions: string[] = ["c.visibility = 'public'", "c.deleted_at IS NULL"];
      const params: (string | number)[] = [];
      let paramIndex = 1;

      if (language) {
        conditions.push(`c.metadata->>'language' = $${paramIndex++}`);
        params.push(language);
      }

      params.push(first);

      const result = await pool.query(
        `WITH recent_stars AS (
           SELECT container_id, COUNT(*) as count
           FROM container_stars WHERE starred_at > NOW() - INTERVAL '${interval}'
           GROUP BY container_id
         ),
         recent_forks AS (
           SELECT forked_from_id as container_id, COUNT(*) as count
           FROM containers WHERE forked_from_id IS NOT NULL AND created_at > NOW() - INTERVAL '${interval}'
           GROUP BY forked_from_id
         )
         SELECT c.*, COALESCE(rs.count, 0) as recent_stars, COALESCE(rf.count, 0) as recent_forks
         FROM containers c
         LEFT JOIN recent_stars rs ON c.id = rs.container_id
         LEFT JOIN recent_forks rf ON c.id = rf.container_id
         WHERE ${conditions.join(" AND ")}
           AND (COALESCE(rs.count, 0) > 0 OR COALESCE(rf.count, 0) > 0)
         ORDER BY (COALESCE(rs.count, 0) * 2 + COALESCE(rf.count, 0)) DESC
         LIMIT $${paramIndex}`,
        params
      );

      return result.rows.map((row, index) => ({
        rank: index + 1,
        container: mapContainer(row),
        recentStars: parseInt(row.recent_stars),
        recentForks: parseInt(row.recent_forks),
      }));
    },

    organization: async (_: unknown, { slug }: { slug: string }) => {
      const result = await pool.query(
        `SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL`,
        [slug]
      );
      return result.rows[0] ? mapOrganization(result.rows[0]) : null;
    },

    notifications: async (
      _: unknown,
      { first = 30, after, filter = "UNREAD" }: { first?: number; after?: string; filter?: string },
      context: { userId?: string }
    ) => {
      if (!context.userId) throw new Error("Unauthorized");

      const offset = after ? decodeCursor(after).index + 1 : 0;
      let whereClause = "n.user_id = $1";

      switch (filter) {
        case "UNREAD":
          whereClause += " AND n.read_at IS NULL AND n.archived_at IS NULL";
          break;
        case "ALL":
          whereClause += " AND n.archived_at IS NULL";
          break;
        case "ARCHIVED":
          whereClause += " AND n.archived_at IS NOT NULL";
          break;
      }

      const result = await pool.query(
        `SELECT n.*, u.username as actor_username
         FROM notifications n
         LEFT JOIN users u ON n.actor_id = u.id
         WHERE ${whereClause}
         ORDER BY n.created_at DESC
         LIMIT $2 OFFSET $3`,
        [context.userId, first, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE read_at IS NULL AND archived_at IS NULL) as unread
         FROM notifications WHERE user_id = $1`,
        [context.userId]
      );

      const connection = createConnection(
        result.rows.map(mapNotification).filter((n): n is NotificationType => n !== null),
        parseInt(countResult.rows[0].total),
        first,
        offset
      );

      return {
        ...connection,
        unreadCount: parseInt(countResult.rows[0].unread),
      };
    },

    activityFeed: async (
      _: unknown,
      { first = 30, after, filter = "ALL" }: { first?: number; after?: string; filter?: string },
      context: { userId?: string }
    ) => {
      if (!context.userId) throw new Error("Unauthorized");

      const offset = after ? decodeCursor(after).index + 1 : 0;
      let whereClause = "";

      switch (filter) {
        case "OWN":
          whereClause = "ae.actor_id = $1";
          break;
        case "FOLLOWING":
          whereClause = `ae.actor_id IN (SELECT following_id FROM user_follows WHERE follower_id = $1)`;
          break;
        case "CONTAINERS":
          whereClause = `ae.container_id IN (
            SELECT container_id FROM container_watches WHERE user_id = $1 AND watch_level != 'ignore'
            UNION SELECT container_id FROM container_stars WHERE user_id = $1
          )`;
          break;
        default:
          whereClause = `(
            ae.actor_id = $1
            OR ae.actor_id IN (SELECT following_id FROM user_follows WHERE follower_id = $1)
            OR ae.container_id IN (
              SELECT container_id FROM container_watches WHERE user_id = $1 AND watch_level != 'ignore'
              UNION SELECT container_id FROM container_stars WHERE user_id = $1
            )
          )`;
      }

      const result = await pool.query(
        `SELECT ae.*, u.username as actor_username, c.identifier as container_identifier
         FROM activity_events ae
         LEFT JOIN users u ON ae.actor_id = u.id
         LEFT JOIN containers c ON ae.container_id = c.id
         WHERE ${whereClause}
         ORDER BY ae.created_at DESC
         LIMIT $2 OFFSET $3`,
        [context.userId, first, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM activity_events ae WHERE ${whereClause}`,
        [context.userId]
      );

      return createConnection(
        result.rows.map(mapActivityEvent).filter((e): e is ActivityEventType => e !== null),
        parseInt(countResult.rows[0].count),
        first,
        offset
      );
    },
  },

  Mutation: {
    starContainer: async (
      _: unknown,
      { id }: { id: string },
      context: { userId?: string }
    ) => {
      if (!context.userId) return { errors: [{ message: "Unauthorized" }] };

      try {
        await pool.query(
          `INSERT INTO container_stars (user_id, container_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [context.userId, id]
        );

        const result = await pool.query(`SELECT * FROM containers WHERE id = $1`, [id]);
        return { container: mapContainer(result.rows[0]) };
      } catch {
        return { errors: [{ message: "Failed to star container" }] };
      }
    },

    unstarContainer: async (
      _: unknown,
      { id }: { id: string },
      context: { userId?: string }
    ) => {
      if (!context.userId) return { errors: [{ message: "Unauthorized" }] };

      try {
        await pool.query(
          `DELETE FROM container_stars WHERE user_id = $1 AND container_id = $2`,
          [context.userId, id]
        );

        const result = await pool.query(`SELECT * FROM containers WHERE id = $1`, [id]);
        return { container: mapContainer(result.rows[0]) };
      } catch {
        return { errors: [{ message: "Failed to unstar container" }] };
      }
    },

    followUser: async (
      _: unknown,
      { id }: { id: string },
      context: { userId?: string }
    ) => {
      if (!context.userId) return { errors: [{ message: "Unauthorized" }] };
      if (context.userId === id) return { errors: [{ message: "Cannot follow yourself" }] };

      try {
        await pool.query(
          `INSERT INTO user_follows (follower_id, following_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [context.userId, id]
        );

        const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
        return { user: mapUser(result.rows[0]) };
      } catch {
        return { errors: [{ message: "Failed to follow user" }] };
      }
    },

    unfollowUser: async (
      _: unknown,
      { id }: { id: string },
      context: { userId?: string }
    ) => {
      if (!context.userId) return { errors: [{ message: "Unauthorized" }] };

      try {
        await pool.query(
          `DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
          [context.userId, id]
        );

        const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
        return { user: mapUser(result.rows[0]) };
      } catch {
        return { errors: [{ message: "Failed to unfollow user" }] };
      }
    },

    markNotificationRead: async (
      _: unknown,
      { id }: { id: string },
      context: { userId?: string }
    ) => {
      if (!context.userId) return { errors: [{ message: "Unauthorized" }] };

      const result = await pool.query(
        `UPDATE notifications SET read_at = NOW()
         WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, context.userId]
      );

      if (result.rows.length === 0) {
        return { errors: [{ message: "Notification not found" }] };
      }

      return { notification: mapNotification(result.rows[0]) };
    },

    markAllNotificationsRead: async (
      _: unknown,
      __: unknown,
      context: { userId?: string }
    ) => {
      if (!context.userId) return { errors: [{ message: "Unauthorized" }] };

      await pool.query(
        `UPDATE notifications SET read_at = NOW()
         WHERE user_id = $1 AND read_at IS NULL AND archived_at IS NULL`,
        [context.userId]
      );

      return { success: true };
    },
  },

  // Field resolvers
  User: {
    viewerIsFollowing: async (user: { id: string }, _: unknown, context: { userId?: string }) => {
      if (!context.userId) return false;
      const result = await pool.query(
        `SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
        [context.userId, user.id]
      );
      return result.rows.length > 0;
    },

    isViewer: (user: { id: string }, _: unknown, context: { userId?: string }) => {
      return user.id === context.userId;
    },

    followers: async (user: { id: string }, { first = 30, after }: { first?: number; after?: string }) => {
      const offset = after ? decodeCursor(after).index + 1 : 0;
      const result = await pool.query(
        `SELECT u.* FROM user_follows uf
         JOIN users u ON uf.follower_id = u.id
         WHERE uf.following_id = $1 ORDER BY uf.created_at DESC LIMIT $2 OFFSET $3`,
        [user.id, first, offset]
      );
      const countResult = await pool.query(
        `SELECT follower_count FROM users WHERE id = $1`,
        [user.id]
      );
      return createConnection(result.rows.map(mapUser).filter((u): u is UserType => u !== null), parseInt(countResult.rows[0]?.follower_count || "0"), first, offset);
    },

    starredContainers: async (user: { id: string }, { first = 30, after }: { first?: number; after?: string }) => {
      const offset = after ? decodeCursor(after).index + 1 : 0;
      const result = await pool.query(
        `SELECT c.* FROM container_stars cs
         JOIN containers c ON cs.container_id = c.id
         WHERE cs.user_id = $1 AND c.deleted_at IS NULL
         ORDER BY cs.starred_at DESC LIMIT $2 OFFSET $3`,
        [user.id, first, offset]
      );
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM container_stars cs
         JOIN containers c ON cs.container_id = c.id
         WHERE cs.user_id = $1 AND c.deleted_at IS NULL`,
        [user.id]
      );
      return createConnection(result.rows.map(mapContainer).filter((c): c is ContainerType => c !== null), parseInt(countResult.rows[0]?.count || "0"), first, offset);
    },
  },

  Container: {
    owner: async (container: { id: string; ownerId: string }) => {
      const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [container.ownerId]);
      return mapUser(result.rows[0]);
    },

    viewerHasStarred: async (container: { id: string; ownerId: string }, _: unknown, context: { userId?: string }) => {
      if (!context.userId) return false;
      const result = await pool.query(
        `SELECT 1 FROM container_stars WHERE user_id = $1 AND container_id = $2`,
        [context.userId, container.id]
      );
      return result.rows.length > 0;
    },

    atoms: async (container: { id: string; ownerId: string }, { first = 30, after, path }: { first?: number; after?: string; path?: string }) => {
      const offset = after ? decodeCursor(after).index + 1 : 0;
      const conditions = ["container_id = $1"];
      const params: (string | number)[] = [container.id];
      let paramIndex = 2;

      if (path) {
        conditions.push(`path LIKE $${paramIndex++}`);
        params.push(`${path}%`);
      }

      params.push(first, offset);
      const result = await pool.query(
        `SELECT * FROM atoms WHERE ${conditions.join(" AND ")}
         ORDER BY path LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM atoms WHERE ${conditions.join(" AND ")}`,
        params.slice(0, -2)
      );

      return createConnection(result.rows.map(mapAtom).filter((a): a is AtomType => a !== null), parseInt(countResult.rows[0]?.count || "0"), first, offset);
    },

    atomCount: async (container: { id: string; ownerId: string }) => {
      const result = await pool.query(
        `SELECT COUNT(*) FROM atoms WHERE container_id = $1`,
        [container.id]
      );
      return parseInt(result.rows[0]?.count || "0");
    },

    trustScore: async (container: { id: string; ownerId: string }) => {
      const result = await pool.query(
        `SELECT COUNT(*) as total, COUNT(batch_id) as certified FROM atoms WHERE container_id = $1`,
        [container.id]
      );
      const total = parseInt(result.rows[0]?.total || "0");
      const certified = parseInt(result.rows[0]?.certified || "0");
      return total > 0 ? Math.round((certified / total) * 100) : 0;
    },
  },
};

// Mapper functions
interface UserType {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  company: string | null;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
}

function mapUser(row: Record<string, unknown>): UserType | null {
  if (!row) return null;
  return {
    id: row.id as string,
    username: row.username as string,
    name: row.name as string | null,
    email: row.email as string | null,
    avatarUrl: row.avatar_url as string | null,
    bio: row.bio as string | null,
    location: row.location as string | null,
    website: row.website as string | null,
    company: row.company as string | null,
    followerCount: (row.follower_count as number) || 0,
    followingCount: (row.following_count as number) || 0,
    createdAt: row.created_at as Date,
  };
}

interface ContainerType {
  id: string;
  identifier: string;
  name: string;
  description: string | null;
  visibility: string;
  starCount: number;
  forkCount: number;
  watchCount: number;
  ownerId: string;
  namespaceId: string | null;
  orgId: string | null;
  forkedFromId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapContainer(row: Record<string, unknown>): ContainerType | null {
  if (!row) return null;
  return {
    id: row.id as string,
    identifier: row.identifier as string,
    name: row.name as string,
    description: row.description as string | null,
    visibility: (row.visibility as string)?.toUpperCase(),
    starCount: (row.star_count as number) || 0,
    forkCount: (row.fork_count as number) || 0,
    watchCount: (row.watch_count as number) || 0,
    ownerId: row.owner_id as string,
    namespaceId: row.namespace_id as string | null,
    orgId: row.org_id as string | null,
    forkedFromId: row.forked_from_id as string | null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

interface OrganizationType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  website: string | null;
  verified: boolean;
  plan: string;
  createdAt: Date;
}

function mapOrganization(row: Record<string, unknown>): OrganizationType | null {
  if (!row) return null;
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string | null,
    avatarUrl: row.avatar_url as string | null,
    website: row.website as string | null,
    verified: row.verified as boolean,
    plan: row.plan as string,
    createdAt: row.created_at as Date,
  };
}

interface NotificationType {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  actorId: string | null;
  containerId: string | null;
  orgId: string | null;
}

function mapNotification(row: Record<string, unknown>): NotificationType | null {
  if (!row) return null;
  return {
    id: row.id as string,
    type: row.type as string,
    title: row.title as string,
    body: row.body as string | null,
    url: row.url as string | null,
    read: row.read_at !== null,
    readAt: row.read_at as Date | null,
    createdAt: row.created_at as Date,
    actorId: row.actor_id as string | null,
    containerId: row.container_id as string | null,
    orgId: row.org_id as string | null,
  };
}

interface ActivityEventType {
  id: string;
  eventType: string;
  targetType: string;
  targetId: string;
  metadata: unknown;
  createdAt: Date;
  actorId: string | null;
  containerId: string | null;
  orgId: string | null;
}

function mapActivityEvent(row: Record<string, unknown>): ActivityEventType | null {
  if (!row) return null;
  return {
    id: row.id as string,
    eventType: row.event_type as string,
    targetType: row.target_type as string,
    targetId: row.target_id as string,
    metadata: row.metadata,
    createdAt: row.created_at as Date,
    actorId: row.actor_id as string | null,
    containerId: row.container_id as string | null,
    orgId: row.org_id as string | null,
  };
}

interface AtomType {
  id: string;
  path: string;
  contentHash: string;
  contentType: string;
  content: string | null;
  metadata: unknown;
  createdAt: Date;
  createdById: string;
  certified: boolean;
  batchId: string | null;
}

function mapAtom(row: Record<string, unknown>): AtomType | null {
  if (!row) return null;
  return {
    id: row.id as string,
    path: row.path as string,
    contentHash: row.content_hash as string,
    contentType: row.content_type as string,
    content: row.content as string | null,
    metadata: row.metadata,
    createdAt: row.created_at as Date,
    createdById: row.created_by as string,
    certified: row.batch_id !== null,
    batchId: row.batch_id as string | null,
  };
}

function getContainerOrderBy(sort: string): string {
  switch (sort) {
    case "STARS":
      return "c.star_count DESC, c.created_at DESC";
    case "FORKS":
      return "c.fork_count DESC, c.created_at DESC";
    case "CREATED":
      return "c.created_at DESC";
    case "NAME":
      return "c.name ASC";
    case "UPDATED":
    default:
      return "c.updated_at DESC";
  }
}
