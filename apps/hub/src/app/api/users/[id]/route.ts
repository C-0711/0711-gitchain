import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/users/:id
 * Get public user profile
 * :id can be "me" for current user, username, or UUID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = getUserIdFromToken(req.headers.get("authorization"));

    // Resolve user ID
    let userId: string;
    let isOwnProfile = false;

    if (params.id === "me") {
      if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = currentUserId;
      isOwnProfile = true;
    } else {
      const user = await pool.query(
        `SELECT id FROM users WHERE (id::text = $1 OR username = $1) AND deleted_at IS NULL`,
        [params.id]
      );
      if (user.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      userId = user.rows[0].id;
      isOwnProfile = userId === currentUserId;
    }

    // Get user profile
    const result = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.name,
         u.email,
         u.avatar_url,
         u.bio,
         u.location,
         u.website,
         u.company,
         u.follower_count,
         u.following_count,
         u.created_at,
         CASE WHEN uf.follower_id IS NOT NULL THEN true ELSE false END as followed_by_me
       FROM users u
       LEFT JOIN user_follows uf ON uf.following_id = u.id AND uf.follower_id = $2
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId, currentUserId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.rows[0];

    // Get public container count
    const containerCount = await pool.query(
      `SELECT COUNT(*) as count FROM containers
       WHERE owner_id = $1 AND deleted_at IS NULL
       ${isOwnProfile ? "" : "AND visibility = 'public'"}`,
      [userId]
    );

    // Get star count (containers they own)
    const starCount = await pool.query(
      `SELECT COALESCE(SUM(star_count), 0) as total FROM containers
       WHERE owner_id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    // Get organization memberships
    const orgs = await pool.query(
      `SELECT
         o.id,
         o.slug,
         o.name,
         o.avatar_url,
         om.role
       FROM organization_members om
       JOIN organizations o ON om.org_id = o.id
       WHERE om.user_id = $1 AND om.status = 'active' AND o.deleted_at IS NULL
       ORDER BY o.name`,
      [userId]
    );

    // Build response
    const response: Record<string, unknown> = {
      id: user.id,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      location: user.location,
      website: user.website,
      company: user.company,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      containerCount: parseInt(containerCount.rows[0]?.count || "0"),
      starCount: parseInt(starCount.rows[0]?.total || "0"),
      createdAt: user.created_at,
      followedByMe: user.followed_by_me,
      organizations: orgs.rows.map((o) => ({
        id: o.id,
        slug: o.slug,
        name: o.name,
        avatarUrl: o.avatar_url,
        role: o.role,
      })),
    };

    // Include email only for own profile
    if (isOwnProfile) {
      response.email = user.email;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
