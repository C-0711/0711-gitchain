import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

type WatchLevel = "all" | "participating" | "mentions" | "ignore";

/**
 * GET /api/containers/:id/watch
 * Get current user's watch status for this container
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ watching: false, level: null });
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

    const result = await pool.query(
      "SELECT watch_level FROM container_watches WHERE user_id = $1 AND container_id = $2",
      [userId, container.rows[0].id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ watching: false, level: null });
    }

    const level = result.rows[0].watch_level as WatchLevel;
    return NextResponse.json({
      watching: level !== "ignore",
      level,
    });
  } catch (error) {
    console.error("Error checking watch status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/containers/:id/watch
 * Set watch level for a container
 * Body: { level: "all" | "participating" | "mentions" | "ignore" }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { level } = await req.json();
    const validLevels: WatchLevel[] = ["all", "participating", "mentions", "ignore"];

    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: "Invalid watch level. Must be: all, participating, mentions, or ignore" },
        { status: 400 }
      );
    }

    const containerId = decodeURIComponent(params.id);

    // Resolve container ID
    const container = await pool.query(
      `SELECT id, identifier, watch_count FROM containers
       WHERE (id::text = $1 OR identifier = $1) AND deleted_at IS NULL`,
      [containerId]
    );

    if (container.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const containerUuid = container.rows[0].id;

    // Upsert watch setting
    await pool.query(
      `INSERT INTO container_watches (user_id, container_id, watch_level)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, container_id)
       DO UPDATE SET watch_level = $3, updated_at = NOW()`,
      [userId, containerUuid, level]
    );

    // Get updated watch count
    const updated = await pool.query(
      "SELECT watch_count FROM containers WHERE id = $1",
      [containerUuid]
    );

    // Log activity (only for non-ignore)
    if (level !== "ignore") {
      await pool.query(
        `INSERT INTO activity_events (actor_id, event_type, target_type, target_id, container_id, metadata)
         VALUES ($1, 'container.watched', 'container', $2, $2, $3)`,
        [userId, containerUuid, JSON.stringify({ level, identifier: container.rows[0].identifier })]
      );
    }

    return NextResponse.json({
      watching: level !== "ignore",
      level,
      watchCount: updated.rows[0]?.watch_count || 0,
    });
  } catch (error) {
    console.error("Error setting watch level:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/containers/:id/watch
 * Stop watching a container (remove watch entry)
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

    // Remove watch
    await pool.query(
      "DELETE FROM container_watches WHERE user_id = $1 AND container_id = $2",
      [userId, containerUuid]
    );

    // Get updated watch count
    const updated = await pool.query(
      "SELECT watch_count FROM containers WHERE id = $1",
      [containerUuid]
    );

    return NextResponse.json({
      watching: false,
      level: null,
      watchCount: updated.rows[0]?.watch_count || 0,
    });
  } catch (error) {
    console.error("Error unwatching container:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
