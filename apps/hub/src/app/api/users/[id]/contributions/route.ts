import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/users/:id/contributions
 * Get contribution graph data (GitHub-style green squares)
 * :id can be "me" for current user, username, or UUID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = getUserIdFromToken(req.headers.get("authorization"));
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());

    // Resolve user ID
    let userId: string;
    if (params.id === "me") {
      if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = currentUserId;
    } else {
      const user = await pool.query(
        `SELECT id FROM users WHERE (id::text = $1 OR username = $1) AND deleted_at IS NULL`,
        [params.id]
      );
      if (user.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      userId = user.rows[0].id;
    }

    // Get daily contribution counts for the year
    // Contributions include: atoms created, containers created, certifications
    const contributions = await pool.query(
      `WITH daily_contributions AS (
         -- Atoms created
         SELECT DATE(created_at) as date, COUNT(*) as count, 'atom' as type
         FROM atoms
         WHERE created_by = $1 AND EXTRACT(YEAR FROM created_at) = $2
         GROUP BY DATE(created_at)

         UNION ALL

         -- Containers created
         SELECT DATE(created_at) as date, COUNT(*) as count, 'container' as type
         FROM containers
         WHERE owner_id = $1 AND EXTRACT(YEAR FROM created_at) = $2
         GROUP BY DATE(created_at)

         UNION ALL

         -- Activity events (certifications, etc.)
         SELECT DATE(created_at) as date, COUNT(*) as count, 'activity' as type
         FROM activity_events
         WHERE actor_id = $1
           AND EXTRACT(YEAR FROM created_at) = $2
           AND event_type IN ('atom.certified', 'batch.submitted', 'container.forked')
         GROUP BY DATE(created_at)
       )
       SELECT date, SUM(count) as count
       FROM daily_contributions
       GROUP BY date
       ORDER BY date`,
      [userId, year]
    );

    // Get contribution summary
    const summary = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM atoms WHERE created_by = $1 AND EXTRACT(YEAR FROM created_at) = $2) as atoms_created,
         (SELECT COUNT(*) FROM containers WHERE owner_id = $1 AND EXTRACT(YEAR FROM created_at) = $2) as containers_created,
         (SELECT COUNT(*) FROM activity_events WHERE actor_id = $1 AND EXTRACT(YEAR FROM created_at) = $2 AND event_type = 'atom.certified') as atoms_certified,
         (SELECT COUNT(*) FROM activity_events WHERE actor_id = $1 AND EXTRACT(YEAR FROM created_at) = $2) as total_activities`,
      [userId, year]
    );

    // Build contribution map
    const contributionMap: Record<string, number> = {};
    let totalContributions = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    let maxDailyCount = 0;

    contributions.rows.forEach((row) => {
      const dateStr = row.date.toISOString().split("T")[0];
      const count = parseInt(row.count);
      contributionMap[dateStr] = count;
      totalContributions += count;
      maxDailyCount = Math.max(maxDailyCount, count);
    });

    // Calculate streaks
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const today = new Date();

    for (let d = new Date(startDate); d <= endDate && d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      if (contributionMap[dateStr] && contributionMap[dateStr] > 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // Generate level thresholds (0-4 like GitHub)
    const getLevel = (count: number): number => {
      if (count === 0) return 0;
      if (count <= Math.ceil(maxDailyCount * 0.25)) return 1;
      if (count <= Math.ceil(maxDailyCount * 0.5)) return 2;
      if (count <= Math.ceil(maxDailyCount * 0.75)) return 3;
      return 4;
    };

    // Build weeks array (52-53 weeks)
    const weeks: { date: string; count: number; level: number }[][] = [];
    let currentWeek: { date: string; count: number; level: number }[] = [];

    // Start from first Sunday of the year
    const firstDay = new Date(year, 0, 1);
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(firstDay.getDate() - firstDay.getDay());

    for (let d = new Date(firstSunday); d.getFullYear() <= year; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() < year) continue;

      const dateStr = d.toISOString().split("T")[0];
      const count = contributionMap[dateStr] || 0;

      currentWeek.push({
        date: dateStr,
        count,
        level: getLevel(count),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return NextResponse.json({
      year,
      totalContributions,
      longestStreak,
      currentStreak,
      summary: {
        atomsCreated: parseInt(summary.rows[0]?.atoms_created || "0"),
        containersCreated: parseInt(summary.rows[0]?.containers_created || "0"),
        atomsCertified: parseInt(summary.rows[0]?.atoms_certified || "0"),
        totalActivities: parseInt(summary.rows[0]?.total_activities || "0"),
      },
      weeks,
      contributions: Object.entries(contributionMap).map(([date, count]) => ({
        date,
        count,
        level: getLevel(count),
      })),
    });
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
