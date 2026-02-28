import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/containers/:id/stats
 * Get detailed statistics for a container
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = getUserIdFromToken(req.headers.get("authorization"));
    const containerId = decodeURIComponent(params.id);

    // Resolve container
    const container = await pool.query(
      `SELECT
         c.id,
         c.identifier,
         c.name,
         c.visibility,
         c.owner_id,
         c.star_count,
         c.fork_count,
         c.watch_count,
         c.created_at
       FROM containers c
       WHERE (c.id::text = $1 OR c.identifier = $1) AND c.deleted_at IS NULL`,
      [containerId]
    );

    if (container.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const containerData = container.rows[0];

    // Check access for private containers
    if (containerData.visibility === "private") {
      if (!currentUserId) {
        return NextResponse.json({ error: "Container not found" }, { status: 404 });
      }

      const hasAccess = await pool.query(
        `SELECT 1 FROM container_collaborators
         WHERE container_id = $1 AND user_id = $2
         UNION
         SELECT 1 WHERE $3 = $2`,
        [containerData.id, currentUserId, containerData.owner_id]
      );

      if (hasAccess.rows.length === 0) {
        return NextResponse.json({ error: "Container not found" }, { status: 404 });
      }
    }

    // Get atom statistics
    const atomStats = await pool.query(
      `SELECT
         COUNT(*) as total_atoms,
         COUNT(DISTINCT content_type) as content_types,
         SUM(LENGTH(content::text)) as total_size,
         MAX(created_at) as last_atom_at
       FROM atoms
       WHERE container_id = $1`,
      [containerData.id]
    );

    // Get content type breakdown
    const contentTypes = await pool.query(
      `SELECT content_type, COUNT(*) as count
       FROM atoms
       WHERE container_id = $1
       GROUP BY content_type
       ORDER BY count DESC
       LIMIT 10`,
      [containerData.id]
    );

    // Get certification statistics
    const certStats = await pool.query(
      `SELECT
         COUNT(*) as total_certified,
         COUNT(DISTINCT batch_id) as batches
       FROM atoms
       WHERE container_id = $1 AND batch_id IS NOT NULL`,
      [containerData.id]
    );

    // Get activity over time (last 30 days)
    const activityTimeline = await pool.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as count
       FROM activity_events
       WHERE container_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [containerData.id]
    );

    // Get star history (last 30 days)
    const starTimeline = await pool.query(
      `SELECT
         DATE(starred_at) as date,
         COUNT(*) as count
       FROM container_stars
       WHERE container_id = $1 AND starred_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(starred_at)
       ORDER BY date`,
      [containerData.id]
    );

    // Get top contributors
    const contributors = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.name,
         u.avatar_url,
         COUNT(*) as contributions
       FROM atoms a
       JOIN users u ON a.created_by = u.id
       WHERE a.container_id = $1
       GROUP BY u.id, u.username, u.name, u.avatar_url
       ORDER BY contributions DESC
       LIMIT 10`,
      [containerData.id]
    );

    // Get collaborator count
    const collaboratorCount = await pool.query(
      `SELECT COUNT(*) as count FROM container_collaborators WHERE container_id = $1`,
      [containerData.id]
    );

    // Calculate trust score (percentage of certified atoms)
    const totalAtoms = parseInt(atomStats.rows[0]?.total_atoms || "0");
    const certifiedAtoms = parseInt(certStats.rows[0]?.total_certified || "0");
    const trustScore = totalAtoms > 0 ? Math.round((certifiedAtoms / totalAtoms) * 100) : 0;

    return NextResponse.json({
      id: containerData.id,
      identifier: containerData.identifier,
      name: containerData.name,
      createdAt: containerData.created_at,
      social: {
        stars: containerData.star_count,
        forks: containerData.fork_count,
        watchers: containerData.watch_count,
        collaborators: parseInt(collaboratorCount.rows[0]?.count || "0"),
      },
      atoms: {
        total: totalAtoms,
        certified: certifiedAtoms,
        certificationBatches: parseInt(certStats.rows[0]?.batches || "0"),
        contentTypes: parseInt(atomStats.rows[0]?.content_types || "0"),
        totalSize: parseInt(atomStats.rows[0]?.total_size || "0"),
        lastUpdated: atomStats.rows[0]?.last_atom_at,
      },
      trustScore,
      contentTypeBreakdown: contentTypes.rows.map((ct) => ({
        type: ct.content_type,
        count: parseInt(ct.count),
      })),
      contributors: contributors.rows.map((c) => ({
        id: c.id,
        username: c.username,
        name: c.name,
        avatarUrl: c.avatar_url,
        contributions: parseInt(c.contributions),
      })),
      activityTimeline: activityTimeline.rows.map((a) => ({
        date: a.date,
        count: parseInt(a.count),
      })),
      starTimeline: starTimeline.rows.map((s) => ({
        date: s.date,
        count: parseInt(s.count),
      })),
    });
  } catch (error) {
    console.error("Error fetching container stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
