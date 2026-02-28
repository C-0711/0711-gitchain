import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/users/:id/activity
 * Get public activity for a user
 * :id can be "me" for current user, username, or UUID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = getUserIdFromToken(req.headers.get("authorization"));
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "30"), 100);
    const offset = (page - 1) * perPage;

    // Resolve user ID
    let targetUserId: string;
    let isOwnProfile = false;

    if (params.id === "me") {
      if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      targetUserId = currentUserId;
      isOwnProfile = true;
    } else {
      const user = await pool.query(
        `SELECT id FROM users
         WHERE (id::text = $1 OR username = $1) AND deleted_at IS NULL`,
        [params.id]
      );
      if (user.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      targetUserId = user.rows[0].id;
      isOwnProfile = targetUserId === currentUserId;
    }

    // Get activity events
    // For other users, only show activity on public containers
    const result = await pool.query(
      `SELECT
         ae.id,
         ae.event_type,
         ae.target_type,
         ae.target_id,
         ae.metadata,
         ae.created_at,
         c.id as container_id,
         c.identifier as container_identifier,
         c.name as container_name,
         c.visibility as container_visibility,
         o.id as org_id,
         o.slug as org_slug,
         o.name as org_name
       FROM activity_events ae
       LEFT JOIN containers c ON ae.container_id = c.id
       LEFT JOIN organizations o ON ae.org_id = o.id
       WHERE ae.actor_id = $1
         AND (
           $2 = true
           OR c.id IS NULL
           OR c.visibility = 'public'
           OR c.owner_id = $3
           OR EXISTS (
             SELECT 1 FROM container_collaborators cc
             WHERE cc.container_id = c.id AND cc.user_id = $3
           )
         )
       ORDER BY ae.created_at DESC
       LIMIT $4 OFFSET $5`,
      [targetUserId, isOwnProfile, currentUserId, perPage, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM activity_events ae
       LEFT JOIN containers c ON ae.container_id = c.id
       WHERE ae.actor_id = $1
         AND (
           $2 = true
           OR c.id IS NULL
           OR c.visibility = 'public'
           OR c.owner_id = $3
           OR EXISTS (
             SELECT 1 FROM container_collaborators cc
             WHERE cc.container_id = c.id AND cc.user_id = $3
           )
         )`,
      [targetUserId, isOwnProfile, currentUserId]
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
    console.error("Error fetching user activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
