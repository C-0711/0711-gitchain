import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken, checkOrgMembership } from "@/lib/db";

// GET /api/organizations/[slug]/audit - Get audit log
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Filters
    const action = searchParams.get("action");
    const actorId = searchParams.get("actor_id");
    const targetType = searchParams.get("target_type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user from auth
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get org
    const orgResult = await pool.query(
      "SELECT id, plan FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const org = orgResult.rows[0];

    // Check admin permission (only admin+ can view audit log)
    const hasPermission = await checkOrgMembership(userId, org.id, "admin");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Must be admin to view audit log" },
        { status: 403 }
      );
    }

    // Build query
    let query = `
      SELECT
        al.*,
        u.name as actor_name,
        u.email as actor_email,
        u.username as actor_username
      FROM organization_audit_log al
      LEFT JOIN users u ON al.actor_id = u.id
      WHERE al.org_id = $1
    `;

    const queryParams: unknown[] = [org.id];
    let paramIdx = 2;

    if (action) {
      // Support partial matching for action categories
      query += ` AND al.action LIKE $${paramIdx++}`;
      queryParams.push(`${action}%`);
    }

    if (actorId) {
      query += ` AND al.actor_id = $${paramIdx++}`;
      queryParams.push(actorId);
    }

    if (targetType) {
      query += ` AND al.target_type = $${paramIdx++}`;
      queryParams.push(targetType);
    }

    if (startDate) {
      query += ` AND al.created_at >= $${paramIdx++}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND al.created_at <= $${paramIdx++}`;
      queryParams.push(endDate);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) FROM organization_audit_log WHERE org_id = $1
    `;
    const countParams: unknown[] = [org.id];
    let countParamIdx = 2;

    if (action) {
      countQuery += ` AND action LIKE $${countParamIdx++}`;
      countParams.push(`${action}%`);
    }
    if (actorId) {
      countQuery += ` AND actor_id = $${countParamIdx++}`;
      countParams.push(actorId);
    }
    if (targetType) {
      countQuery += ` AND target_type = $${countParamIdx++}`;
      countParams.push(targetType);
    }
    if (startDate) {
      countQuery += ` AND created_at >= $${countParamIdx++}`;
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ` AND created_at <= $${countParamIdx}`;
      countParams.push(endDate);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get action summary for filtering UI
    const actionSummary = await pool.query(
      `SELECT
         split_part(action, '.', 1) as category,
         COUNT(*) as count
       FROM organization_audit_log
       WHERE org_id = $1
       GROUP BY category
       ORDER BY count DESC`,
      [org.id]
    );

    return NextResponse.json({
      entries: result.rows.map((row) => ({
        id: row.id,
        action: row.action,
        actor: row.actor_id
          ? {
              id: row.actor_id,
              name: row.actor_name,
              email: row.actor_email,
              username: row.actor_username,
            }
          : null,
        target: row.target_type
          ? {
              type: row.target_type,
              id: row.target_id,
            }
          : null,
        old_value: row.old_value,
        new_value: row.new_value,
        metadata: row.metadata,
        ip_address: row.ip_address,
        created_at: row.created_at,
      })),
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + result.rows.length < total,
      },
      action_categories: actionSummary.rows,
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[slug]/audit/export - Export audit log
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { format = "json", start_date, end_date } = body;

    // Get user from auth
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get org
    const orgResult = await pool.query(
      "SELECT id, plan FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const org = orgResult.rows[0];

    // Check admin permission
    const hasPermission = await checkOrgMembership(userId, org.id, "admin");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Must be admin to export audit log" },
        { status: 403 }
      );
    }

    // Check plan (export is business+ feature)
    if (!["business", "enterprise"].includes(org.plan)) {
      return NextResponse.json(
        { error: "Audit export requires Business or Enterprise plan" },
        { status: 403 }
      );
    }

    // Build query
    let query = `
      SELECT
        al.*,
        u.name as actor_name,
        u.email as actor_email
      FROM organization_audit_log al
      LEFT JOIN users u ON al.actor_id = u.id
      WHERE al.org_id = $1
    `;

    const queryParams: unknown[] = [org.id];
    let paramIdx = 2;

    if (start_date) {
      query += ` AND al.created_at >= $${paramIdx++}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      query += ` AND al.created_at <= $${paramIdx++}`;
      queryParams.push(end_date);
    }

    query += ` ORDER BY al.created_at DESC`;

    const result = await pool.query(query, queryParams);

    // Format output
    if (format === "csv") {
      const headers = [
        "timestamp",
        "action",
        "actor_email",
        "actor_name",
        "target_type",
        "target_id",
        "ip_address",
      ];
      const rows = result.rows.map((row) =>
        [
          row.created_at,
          row.action,
          row.actor_email || "",
          row.actor_name || "",
          row.target_type || "",
          row.target_id || "",
          row.ip_address || "",
        ].join(",")
      );

      const csv = [headers.join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-log-${slug}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Default JSON format
    return NextResponse.json({
      organization: slug,
      exported_at: new Date().toISOString(),
      period: {
        start: start_date || null,
        end: end_date || null,
      },
      total_entries: result.rows.length,
      entries: result.rows,
    });
  } catch (error) {
    console.error("Error exporting audit log:", error);
    return NextResponse.json(
      { error: "Failed to export audit log" },
      { status: 500 }
    );
  }
}
