import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/explore
 * Explore public containers with various filters
 */
export async function GET(req: NextRequest) {
  try {
    const currentUserId = getUserIdFromToken(req.headers.get("authorization"));
    const url = new URL(req.url);

    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "30"), 100);
    const offset = (page - 1) * perPage;

    const sort = url.searchParams.get("sort") || "stars"; // stars, forks, updated, created
    const language = url.searchParams.get("language");
    const topic = url.searchParams.get("topic");
    const query = url.searchParams.get("q");
    const since = url.searchParams.get("since"); // daily, weekly, monthly

    // Build WHERE clause
    const conditions: string[] = ["c.visibility = 'public'", "c.deleted_at IS NULL"];
    const queryParams: (string | Date)[] = [];
    let paramIndex = 1;

    if (query) {
      conditions.push(`(
        c.name ILIKE $${paramIndex} OR
        c.description ILIKE $${paramIndex} OR
        c.identifier ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${query}%`);
      paramIndex++;
    }

    if (language) {
      conditions.push(`c.metadata->>'language' = $${paramIndex}`);
      queryParams.push(language);
      paramIndex++;
    }

    if (topic) {
      conditions.push(`c.metadata->'topics' ? $${paramIndex}`);
      queryParams.push(topic);
      paramIndex++;
    }

    if (since) {
      let interval: string;
      switch (since) {
        case "daily":
          interval = "1 day";
          break;
        case "weekly":
          interval = "7 days";
          break;
        case "monthly":
          interval = "30 days";
          break;
        default:
          interval = "7 days";
      }
      conditions.push(`c.created_at > NOW() - INTERVAL '${interval}'`);
    }

    // Build ORDER BY clause
    let orderBy: string;
    switch (sort) {
      case "forks":
        orderBy = "c.fork_count DESC, c.star_count DESC";
        break;
      case "updated":
        orderBy = "c.updated_at DESC";
        break;
      case "created":
        orderBy = "c.created_at DESC";
        break;
      case "stars":
      default:
        orderBy = "c.star_count DESC, c.created_at DESC";
    }

    // Get containers
    const result = await pool.query(
      `SELECT
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
         u.id as owner_id,
         u.username as owner_username,
         u.name as owner_name,
         u.avatar_url as owner_avatar,
         n.slug as namespace_slug,
         o.slug as org_slug,
         o.name as org_name,
         CASE WHEN cs.user_id IS NOT NULL THEN true ELSE false END as starred_by_me
       FROM containers c
       LEFT JOIN users u ON c.owner_id = u.id
       LEFT JOIN namespaces n ON c.namespace_id = n.id
       LEFT JOIN organizations o ON c.org_id = o.id
       LEFT JOIN container_stars cs ON cs.container_id = c.id AND cs.user_id = $${paramIndex}
       WHERE ${conditions.join(" AND ")}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
      [...queryParams, currentUserId, perPage, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM containers c
       WHERE ${conditions.join(" AND ")}`,
      queryParams
    );

    const totalCount = parseInt(countResult.rows[0]?.count || "0");
    const totalPages = Math.ceil(totalCount / perPage);

    return NextResponse.json({
      containers: result.rows.map((row) => ({
        id: row.id,
        identifier: row.identifier,
        name: row.name,
        description: row.description,
        starCount: row.star_count,
        forkCount: row.fork_count,
        watchCount: row.watch_count,
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
    console.error("Error exploring containers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
