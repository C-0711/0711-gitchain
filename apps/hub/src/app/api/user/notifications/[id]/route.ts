import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * PATCH /api/user/notifications/:id
 * Update a notification (mark as read/unread, archive)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationId = params.id;
    const body = await req.json();
    const { read, archived } = body;

    // Verify ownership
    const existing = await pool.query(
      `SELECT id FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Build update
    const updates: string[] = [];
    const values: (string | null | boolean)[] = [];
    let paramIndex = 1;

    if (read !== undefined) {
      if (read) {
        updates.push(`read_at = COALESCE(read_at, NOW())`);
      } else {
        updates.push(`read_at = NULL`);
      }
    }

    if (archived !== undefined) {
      if (archived) {
        updates.push(`archived_at = COALESCE(archived_at, NOW())`);
      } else {
        updates.push(`archived_at = NULL`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE notifications
       SET ${updates.join(", ")}
       WHERE id = $1 AND user_id = $2
       RETURNING id, read_at, archived_at`,
      [notificationId, userId]
    );

    return NextResponse.json({
      id: result.rows[0].id,
      read: result.rows[0].read_at !== null,
      archived: result.rows[0].archived_at !== null,
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/notifications/:id
 * Delete a notification (permanent)
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

    const notificationId = params.id;

    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
