import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/users/:id/followers
 * Get users who follow the specified user
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
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "30"), 100);
    const offset = (page - 1) * limit;

    // Get followers
    const followersResult = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.name,
         u.avatar_url,
         u.bio,
         u.location,
         u.company,
         u.created_at,
         uf.created_at as followed_at,
         CASE WHEN uf2.follower_id IS NOT NULL THEN true ELSE false END as viewer_is_following
       FROM user_follows uf
       JOIN users u ON uf.follower_id = u.id
       LEFT JOIN user_follows uf2 ON u.id = uf2.following_id AND uf2.follower_id = $3
       WHERE uf.following_id = $1
       ORDER BY uf.created_at DESC
       LIMIT $2 OFFSET $4`,
      [user.id, limit, currentUserId, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM user_follows WHERE following_id = $1`,
      [user.id]
    );

    const total = parseInt(countResult.rows[0]?.count || "0");

    return NextResponse.json({
      followers: followersResult.rows.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        avatarUrl: u.avatar_url,
        bio: u.bio,
        location: u.location,
        company: u.company,
        createdAt: u.created_at,
        followedAt: u.followed_at,
        viewerIsFollowing: u.viewer_is_following,
      })),
      total,
      page,
      limit,
      hasMore: offset + followersResult.rows.length < total,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
