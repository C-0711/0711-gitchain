import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/containers/:id/forks
 * Get list of forks for a container
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = getUserIdFromToken(req.headers.get("authorization"));
    const containerIdentifier = decodeURIComponent(params.id);

    // Resolve container
    const containerResult = await pool.query(
      `SELECT id FROM containers
       WHERE identifier = $1 AND deleted_at IS NULL`,
      [containerIdentifier]
    );

    if (containerResult.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const containerId = containerResult.rows[0].id;
    const url = new URL(req.url);
    const sortBy = url.searchParams.get("sort") || "created";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "30"), 100);
    const offset = (page - 1) * limit;

    // Sort order
    const orderBy = {
      created: "c.created_at DESC",
      updated: "c.updated_at DESC",
      stars: "c.star_count DESC",
    }[sortBy] || "c.created_at DESC";

    // Get forks
    const forksResult = await pool.query(
      `SELECT
         c.id,
         c.identifier,
         c.name,
         c.description,
         c.visibility,
         c.star_count,
         c.fork_count,
         c.created_at,
         c.updated_at,
         u.id as owner_id,
         u.username as owner_username,
         u.name as owner_name,
         u.avatar_url as owner_avatar_url,
         CASE WHEN cs.user_id IS NOT NULL THEN true ELSE false END as viewer_has_starred
       FROM containers c
       JOIN users u ON c.owner_id = u.id
       LEFT JOIN container_stars cs ON c.id = cs.container_id AND cs.user_id = $3
       WHERE c.forked_from_id = $1
         AND c.deleted_at IS NULL
         AND (c.visibility = 'public' OR c.owner_id = $3)
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $4`,
      [containerId, limit, currentUserId, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM containers c
       WHERE c.forked_from_id = $1
         AND c.deleted_at IS NULL
         AND (c.visibility = 'public' OR c.owner_id = $2)`,
      [containerId, currentUserId]
    );

    const total = parseInt(countResult.rows[0]?.count || "0");

    return NextResponse.json({
      forks: forksResult.rows.map((c) => ({
        id: c.id,
        identifier: c.identifier,
        name: c.name,
        description: c.description,
        visibility: c.visibility,
        starCount: c.star_count,
        forkCount: c.fork_count,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        owner: {
          id: c.owner_id,
          username: c.owner_username,
          name: c.owner_name,
          avatarUrl: c.owner_avatar_url,
        },
        viewerHasStarred: c.viewer_has_starred,
      })),
      total,
      page,
      limit,
      hasMore: offset + forksResult.rows.length < total,
    });
  } catch (error) {
    console.error("Error fetching forks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
