import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/user/follow/:id
 * Check if current user follows the specified user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ following: false });
    }

    // Resolve target user ID
    const targetUser = await pool.query(
      `SELECT id FROM users
       WHERE (id::text = $1 OR username = $1) AND deleted_at IS NULL`,
      [params.id]
    );

    if (targetUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = targetUser.rows[0].id;

    if (targetUserId === userId) {
      return NextResponse.json({ following: false, self: true });
    }

    const result = await pool.query(
      `SELECT 1 FROM user_follows
       WHERE follower_id = $1 AND following_id = $2`,
      [userId, targetUserId]
    );

    return NextResponse.json({ following: result.rows.length > 0 });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/user/follow/:id
 * Follow a user
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

    // Resolve target user ID
    const targetUser = await pool.query(
      `SELECT id, username, follower_count FROM users
       WHERE (id::text = $1 OR username = $1) AND deleted_at IS NULL`,
      [params.id]
    );

    if (targetUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = targetUser.rows[0].id;

    if (targetUserId === userId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Insert follow (ignore if already exists)
    await pool.query(
      `INSERT INTO user_follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [userId, targetUserId]
    );

    // Get updated follower count
    const updated = await pool.query(
      `SELECT follower_count FROM users WHERE id = $1`,
      [targetUserId]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_events (actor_id, event_type, target_type, target_id, metadata)
       VALUES ($1, 'user.followed', 'user', $2, $3)`,
      [userId, targetUserId, JSON.stringify({ username: targetUser.rows[0].username })]
    );

    return NextResponse.json({
      following: true,
      followerCount: updated.rows[0]?.follower_count || 0,
    });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/follow/:id
 * Unfollow a user
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

    // Resolve target user ID
    const targetUser = await pool.query(
      `SELECT id FROM users
       WHERE (id::text = $1 OR username = $1) AND deleted_at IS NULL`,
      [params.id]
    );

    if (targetUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = targetUser.rows[0].id;

    // Remove follow
    await pool.query(
      `DELETE FROM user_follows
       WHERE follower_id = $1 AND following_id = $2`,
      [userId, targetUserId]
    );

    // Get updated follower count
    const updated = await pool.query(
      `SELECT follower_count FROM users WHERE id = $1`,
      [targetUserId]
    );

    return NextResponse.json({
      following: false,
      followerCount: updated.rows[0]?.follower_count || 0,
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
