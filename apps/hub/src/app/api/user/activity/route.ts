import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/user/activity
 * Get activity feed for the current user
 * Includes:
 * - Own activity
 * - Activity from users you follow
 * - Activity on containers you watch/star
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
    const filter = url.searchParams.get("filter") || "all"; // all, own, following, containers

    let whereClause = "";
    const queryParams: (string | number)[] = [userId];

    switch (filter) {
      case "own":
        // Only own activity
        whereClause = "ae.actor_id = $1";
        break;
      case "following":
        // Activity from users you follow
        whereClause = `ae.actor_id IN (
          SELECT following_id FROM user_follows WHERE follower_id = $1
        )`;
        break;
      case "containers":
        // Activity on containers you watch or star
        whereClause = `ae.container_id IN (
          SELECT container_id FROM container_watches WHERE user_id = $1 AND watch_level != 'ignore'
          UNION
          SELECT container_id FROM container_stars WHERE user_id = $1
        )`;
        break;
      default:
        // All relevant activity
        whereClause = `(
          ae.actor_id = $1
          OR ae.actor_id IN (
            SELECT following_id FROM user_follows WHERE follower_id = $1
          )
          OR ae.container_id IN (
            SELECT container_id FROM container_watches WHERE user_id = $1 AND watch_level != 'ignore'
            UNION
            SELECT container_id FROM container_stars WHERE user_id = $1
          )
        )`;
    }

    // Get activity events
    const result = await pool.query(
      `SELECT
         ae.id,
         ae.event_type,
         ae.target_type,
         ae.target_id,
         ae.metadata,
         ae.created_at,
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
       FROM activity_events ae
       LEFT JOIN users u ON ae.actor_id = u.id
       LEFT JOIN containers c ON ae.container_id = c.id
       LEFT JOIN organizations o ON ae.org_id = o.id
       WHERE ${whereClause}
       ORDER BY ae.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, perPage, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM activity_events ae
       WHERE ${whereClause}`,
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0]?.count || "0");
    const totalPages = Math.ceil(totalCount / perPage);

    return NextResponse.json({
      events: result.rows.map((row) => ({
        id: row.id,
        eventType: row.event_type,
        targetType: row.target_type,
        targetId: row.target_id,
        metadata: row.metadata,
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
      pagination: {
        page,
        perPage,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
