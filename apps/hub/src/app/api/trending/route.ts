import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/trending
 * Get trending containers (most stars/activity in time period)
 */
export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromToken(req.headers.get("authorization"));
    const url = new URL(req.url);

    const since = url.searchParams.get("since") || "weekly"; // daily, weekly, monthly
    const language = url.searchParams.get("language");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);

    // Determine time range
    let interval: string;
    switch (since) {
      case "daily":
        interval = "1 day";
        break;
      case "monthly":
        interval = "30 days";
        break;
      case "weekly":
      default:
        interval = "7 days";
    }

    // Build conditions
    const conditions: string[] = ["c.visibility = 'public'", "c.deleted_at IS NULL"];
    const queryParams: string[] = [];
    let paramIndex = 1;

    if (language) {
      conditions.push(`c.metadata->>'language' = $${paramIndex}`);
      queryParams.push(language);
      paramIndex++;
    }

    // Get trending containers based on recent star activity
    const result = await pool.query(
      `WITH recent_stars AS (
         SELECT container_id, COUNT(*) as recent_star_count
         FROM container_stars
         WHERE starred_at > NOW() - INTERVAL '${interval}'
         GROUP BY container_id
       ),
       recent_forks AS (
         SELECT forked_from_id as container_id, COUNT(*) as recent_fork_count
         FROM containers
         WHERE forked_from_id IS NOT NULL AND created_at > NOW() - INTERVAL '${interval}'
         GROUP BY forked_from_id
       )
       SELECT
         c.id,
         c.identifier,
         c.name,
         c.description,
         c.star_count,
         c.fork_count,
         c.watch_count,
         c.metadata,
         c.created_at,
         c.updated_at,
         COALESCE(rs.recent_star_count, 0) as recent_stars,
         COALESCE(rf.recent_fork_count, 0) as recent_forks,
         u.id as owner_id,
         u.username as owner_username,
         u.name as owner_name,
         u.avatar_url as owner_avatar,
         n.slug as namespace_slug,
         o.slug as org_slug,
         o.name as org_name,
         CASE WHEN cs.user_id IS NOT NULL THEN true ELSE false END as starred_by_me
       FROM containers c
       LEFT JOIN recent_stars rs ON c.id = rs.container_id
       LEFT JOIN recent_forks rf ON c.id = rf.container_id
       LEFT JOIN users u ON c.owner_id = u.id
       LEFT JOIN namespaces n ON c.namespace_id = n.id
       LEFT JOIN organizations o ON c.org_id = o.id
       LEFT JOIN container_stars cs ON cs.container_id = c.id AND cs.user_id = $${paramIndex}
       WHERE ${conditions.join(" AND ")}
         AND (COALESCE(rs.recent_star_count, 0) > 0 OR COALESCE(rf.recent_fork_count, 0) > 0)
       ORDER BY
         (COALESCE(rs.recent_star_count, 0) * 2 + COALESCE(rf.recent_fork_count, 0)) DESC,
         c.star_count DESC
       LIMIT $${paramIndex + 1}`,
      [...queryParams, currentUserId, limit]
    );

    // Get top languages
    const languagesResult = await pool.query(
      `SELECT metadata->>'language' as language, COUNT(*) as count
       FROM containers
       WHERE visibility = 'public' AND deleted_at IS NULL AND metadata->>'language' IS NOT NULL
       GROUP BY metadata->>'language'
       ORDER BY count DESC
       LIMIT 10`
    );

    return NextResponse.json({
      since,
      containers: result.rows.map((row, index) => ({
        rank: index + 1,
        id: row.id,
        identifier: row.identifier,
        name: row.name,
        description: row.description,
        starCount: row.star_count,
        forkCount: row.fork_count,
        watchCount: row.watch_count,
        recentStars: parseInt(row.recent_stars),
        recentForks: parseInt(row.recent_forks),
        language: row.metadata?.language,
        topics: row.metadata?.topics || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        owner: {
          id: row.owner_id,
          username: row.owner_username,
          name: row.owner_name,
          avatarUrl: row.owner_avatar,
        },
        namespace: row.namespace_slug,
        organization: row.org_slug
          ? { slug: row.org_slug, name: row.org_name }
          : null,
        starredByMe: row.starred_by_me,
      })),
      languages: languagesResult.rows.map((l) => ({
        language: l.language,
        count: parseInt(l.count),
      })),
    });
  } catch (error) {
    console.error("Error fetching trending:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
