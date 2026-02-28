import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/users/:id/containers
 * Get containers owned by a user
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
    const visibility = url.searchParams.get("visibility");
    const sortBy = url.searchParams.get("sort") || "updated";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build visibility filter
    let visibilityFilter = "";
    if (visibility) {
      visibilityFilter = `AND c.visibility = $3`;
    } else if (currentUserId !== user.id) {
      // Non-owners can only see public containers
      visibilityFilter = `AND c.visibility = 'public'`;
    }

    // Sort order
    const orderBy = {
      updated: "c.updated_at DESC",
      created: "c.created_at DESC",
      stars: "c.star_count DESC",
      name: "c.name ASC",
    }[sortBy] || "c.updated_at DESC";

    // Get containers
    const containersResult = await pool.query(
      `SELECT
         c.id,
         c.identifier,
         c.name,
         c.description,
         c.visibility,
         c.star_count,
         c.fork_count,
         c.watch_count,
         c.created_at,
         c.updated_at,
         (SELECT COUNT(*) FROM atoms WHERE container_id = c.id) as atom_count
       FROM containers c
       WHERE c.owner_id = $1 AND c.deleted_at IS NULL
       ${visibilityFilter}
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET ${visibility ? '$4' : '$3'}`,
      visibility
        ? [user.id, limit, visibility, offset]
        : [user.id, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM containers c
       WHERE c.owner_id = $1 AND c.deleted_at IS NULL
       ${visibilityFilter}`,
      visibility ? [user.id, visibility] : [user.id]
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
        watchCount: c.watch_count,
        atomCount: parseInt(c.atom_count),
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      total,
      page,
      limit,
      hasMore: offset + containersResult.rows.length < total,
    });
  } catch (error) {
    console.error("Error fetching user containers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
