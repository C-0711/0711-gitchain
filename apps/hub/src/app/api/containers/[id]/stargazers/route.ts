import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * GET /api/containers/:id/stargazers
 * List users who starred this container
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const containerId = decodeURIComponent(params.id);
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "30"), 100);
    const offset = (page - 1) * perPage;

    // Resolve container ID
    const container = await pool.query(
      `SELECT id, star_count FROM containers
       WHERE (id::text = $1 OR identifier = $1) AND deleted_at IS NULL`,
      [containerId]
    );

    if (container.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const containerUuid = container.rows[0].id;

    // Get stargazers
    const result = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.name,
         u.avatar_url,
         cs.starred_at
       FROM container_stars cs
       JOIN users u ON cs.user_id = u.id
       WHERE cs.container_id = $1
       ORDER BY cs.starred_at DESC
       LIMIT $2 OFFSET $3`,
      [containerUuid, perPage, offset]
    );

    const totalCount = container.rows[0].star_count;
    const totalPages = Math.ceil(totalCount / perPage);

    return NextResponse.json({
      stargazers: result.rows.map((row) => ({
        id: row.id,
        username: row.username,
        name: row.name,
        avatarUrl: row.avatar_url,
        starredAt: row.starred_at,
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
    console.error("Error listing stargazers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
