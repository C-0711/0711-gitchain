import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/users/:id/starred
 * Get containers starred by a user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = getUserIdFromToken(req.headers.get("authorization"));
    const userIdentifier = decodeURIComponent(params.id);

    // Resolve user
    const userResult = await pool.query(
      `SELECT id, username FROM users
       WHERE username = $1 OR id::text = $1`,
      [userIdentifier]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    const url = new URL(req.url);
    const sortBy = url.searchParams.get("sort") || "starred";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Sort order
    const orderBy = {
      starred: "cs.starred_at DESC",
      stars: "c.star_count DESC",
      updated: "c.updated_at DESC",
    }[sortBy] || "cs.starred_at DESC";

    // Get starred containers (only public ones visible to others)
    const containersResult = await pool.query(
      `SELECT
         c.id,
         c.identifier,
         c.name,
         c.description,
         c.visibility,
         c.star_count,
         c.fork_count,
         c.updated_at,
         cs.starred_at,
         u.id as owner_id,
         u.username as owner_username,
         u.avatar_url as owner_avatar_url,
         CASE WHEN cs2.user_id IS NOT NULL THEN true ELSE false END as viewer_has_starred
       FROM container_stars cs
       JOIN containers c ON cs.container_id = c.id
       JOIN users u ON c.owner_id = u.id
       LEFT JOIN container_stars cs2 ON c.id = cs2.container_id AND cs2.user_id = $3
       WHERE cs.user_id = $1
         AND c.deleted_at IS NULL
         AND (c.visibility = 'public' OR c.owner_id = $3 OR $1 = $3)
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $4`,
      [user.id, limit, currentUserId, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM container_stars cs
       JOIN containers c ON cs.container_id = c.id
       WHERE cs.user_id = $1
         AND c.deleted_at IS NULL
         AND (c.visibility = 'public' OR c.owner_id = $2 OR $1 = $2)`,
      [user.id, currentUserId]
    );

    const total = parseInt(countResult.rows[0]?.count || "0");

    return NextResponse.json({
      containers: containersResult.rows.map((c) => ({
        id: c.id,
        identifier: c.identifier,
        name: c.name,
        description: c.description,
        visibility: c.visibility,
        starCount: c.star_count,
        forkCount: c.fork_count,
        updatedAt: c.updated_at,
        starredAt: c.starred_at,
        owner: {
          id: c.owner_id,
          username: c.owner_username,
          avatarUrl: c.owner_avatar_url,
        },
        viewerHasStarred: c.viewer_has_starred,
      })),
      total,
      page,
      limit,
      hasMore: offset + containersResult.rows.length < total,
    });
  } catch (error) {
    console.error("Error fetching starred containers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
