import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/containers/:id/star
 * Check if current user has starred this container
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ starred: false });
    }

    const containerId = decodeURIComponent(params.id);

    // Resolve container ID (could be UUID or identifier)
    const container = await pool.query(
      `SELECT id FROM containers
       WHERE (id::text = $1 OR identifier = $1) AND deleted_at IS NULL`,
      [containerId]
    );

    if (container.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const result = await pool.query(
      "SELECT 1 FROM container_stars WHERE user_id = $1 AND container_id = $2",
      [userId, container.rows[0].id]
    );

    return NextResponse.json({ starred: result.rows.length > 0 });
  } catch (error) {
    console.error("Error checking star:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/containers/:id/star
 * Star a container
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const containerId = decodeURIComponent(params.id);

    // Resolve container ID
    const container = await pool.query(
      `SELECT id, identifier, star_count FROM containers
       WHERE (id::text = $1 OR identifier = $1) AND deleted_at IS NULL`,
      [containerId]
    );

    if (container.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const containerUuid = container.rows[0].id;

    // Insert star (ignore if already exists)
    await pool.query(
      `INSERT INTO container_stars (user_id, container_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, container_id) DO NOTHING`,
      [userId, containerUuid]
    );

    // Get updated star count
    const updated = await pool.query(
      "SELECT star_count FROM containers WHERE id = $1",
      [containerUuid]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_events (actor_id, event_type, target_type, target_id, container_id, metadata)
       VALUES ($1, 'container.starred', 'container', $2, $2, $3)`,
      [userId, containerUuid, JSON.stringify({ identifier: container.rows[0].identifier })]
    );

    return NextResponse.json({
      starred: true,
      starCount: updated.rows[0]?.star_count || 0,
    });
  } catch (error) {
    console.error("Error starring container:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/containers/:id/star
 * Unstar a container
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const containerId = decodeURIComponent(params.id);

    // Resolve container ID
    const container = await pool.query(
      `SELECT id FROM containers
       WHERE (id::text = $1 OR identifier = $1) AND deleted_at IS NULL`,
      [containerId]
    );

    if (container.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const containerUuid = container.rows[0].id;

    // Remove star
    await pool.query(
      "DELETE FROM container_stars WHERE user_id = $1 AND container_id = $2",
      [userId, containerUuid]
    );

    // Get updated star count
    const updated = await pool.query(
      "SELECT star_count FROM containers WHERE id = $1",
      [containerUuid]
    );

    return NextResponse.json({
      starred: false,
      starCount: updated.rows[0]?.star_count || 0,
    });
  } catch (error) {
    console.error("Error unstarring container:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
