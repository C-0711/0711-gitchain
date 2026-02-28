import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/user/notifications
 * List notifications for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "30"), 100);
    const offset = (page - 1) * perPage;
    const filter = url.searchParams.get("filter") || "unread"; // unread, all, archived

    let whereClause = "n.user_id = $1";
    switch (filter) {
      case "unread":
        whereClause += " AND n.read_at IS NULL AND n.archived_at IS NULL";
        break;
      case "all":
        whereClause += " AND n.archived_at IS NULL";
        break;
      case "archived":
        whereClause += " AND n.archived_at IS NOT NULL";
        break;
    }

    // Get notifications
    const result = await pool.query(
      `SELECT
         n.id,
         n.type,
         n.title,
         n.body,
         n.url,
         n.metadata,
         n.read_at,
         n.created_at,
         u.id as actor_id,
         u.username as actor_username,
         u.name as actor_name,
         u.avatar_url as actor_avatar,
         c.id as container_id,
         c.identifier as container_identifier,
         c.name as container_name,
         o.id as org_id,
         o.slug as org_slug,
         o.name as org_name
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       LEFT JOIN containers c ON n.container_id = c.id
       LEFT JOIN organizations o ON n.org_id = o.id
       WHERE ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, perPage, offset]
    );

    // Get counts
    const countsResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE read_at IS NULL AND archived_at IS NULL) as unread_count,
         COUNT(*) FILTER (WHERE archived_at IS NULL) as total_count
       FROM notifications
       WHERE user_id = $1`,
      [userId]
    );

    const unreadCount = parseInt(countsResult.rows[0]?.unread_count || "0");
    const totalCount = parseInt(countsResult.rows[0]?.total_count || "0");
    const displayCount = filter === "unread" ? unreadCount : totalCount;
    const totalPages = Math.ceil(displayCount / perPage);

    return NextResponse.json({
      notifications: result.rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        url: row.url,
        metadata: row.metadata,
        read: row.read_at !== null,
        readAt: row.read_at,
        createdAt: row.created_at,
        actor: row.actor_id
          ? {
              id: row.actor_id,
              username: row.actor_username,
              name: row.actor_name,
              avatarUrl: row.actor_avatar,
            }
          : null,
        container: row.container_id
          ? {
              id: row.container_id,
              identifier: row.container_identifier,
              name: row.container_name,
            }
          : null,
        organization: row.org_id
          ? {
              id: row.org_id,
              slug: row.org_slug,
              name: row.org_name,
            }
          : null,
      })),
      unreadCount,
      pagination: {
        page,
        perPage,
        totalCount: displayCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/notifications
 * Mark all notifications as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body; // read_all, archive_all

    if (action === "read_all") {
      await pool.query(
        `UPDATE notifications
         SET read_at = NOW()
         WHERE user_id = $1 AND read_at IS NULL AND archived_at IS NULL`,
        [userId]
      );
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (action === "archive_all") {
      await pool.query(
        `UPDATE notifications
         SET archived_at = NOW()
         WHERE user_id = $1 AND archived_at IS NULL`,
        [userId]
      );
      return NextResponse.json({ message: "All notifications archived" });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'read_all' or 'archive_all'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
