import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/organizations/:slug/ip-allowlist
 * List IP allowlist for an organization
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;

    // Check if user is admin of org
    const org = await pool.query(
      `SELECT o.id, o.plan
       FROM organizations o
       JOIN organization_members om ON o.id = om.org_id
       WHERE o.slug = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin') AND o.deleted_at IS NULL`,
      [slug, userId]
    );

    if (org.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
    }

    const orgId = org.rows[0].id;

    // Get IP allowlist
    const result = await pool.query(
      `SELECT
         ia.id,
         ia.cidr,
         ia.description,
         ia.created_at,
         u.username as created_by
       FROM ip_allowlist ia
       LEFT JOIN users u ON ia.created_by = u.id
       WHERE ia.org_id = $1
       ORDER BY ia.created_at DESC`,
      [orgId]
    );

    return NextResponse.json({
      enabled: result.rows.length > 0,
      entries: result.rows.map((row) => ({
        id: row.id,
        cidr: row.cidr,
        description: row.description,
        createdAt: row.created_at,
        createdBy: row.created_by,
      })),
    });
  } catch (error) {
    console.error("Error fetching IP allowlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/organizations/:slug/ip-allowlist
 * Add an IP range to the allowlist
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    const body = await req.json();
    const { cidr, description } = body;

    // Validate CIDR
    if (!cidr || typeof cidr !== "string") {
      return NextResponse.json({ error: "cidr is required" }, { status: 400 });
    }

    // Basic CIDR format validation
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!cidrRegex.test(cidr)) {
      return NextResponse.json(
        { error: "Invalid CIDR format. Examples: 192.168.1.0/24, 10.0.0.1/32" },
        { status: 400 }
      );
    }

    // Check if user is admin of org with enterprise plan
    const org = await pool.query(
      `SELECT o.id, o.plan
       FROM organizations o
       JOIN organization_members om ON o.id = om.org_id
       WHERE o.slug = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin') AND o.deleted_at IS NULL`,
      [slug, userId]
    );

    if (org.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
    }

    const orgData = org.rows[0];

    if (orgData.plan !== "enterprise") {
      return NextResponse.json(
        { error: "IP allowlisting is only available on Enterprise plans" },
        { status: 403 }
      );
    }

    // Add to allowlist
    const result = await pool.query(
      `INSERT INTO ip_allowlist (org_id, cidr, description, created_by)
       VALUES ($1, $2::cidr, $3, $4)
       ON CONFLICT (org_id, cidr) DO NOTHING
       RETURNING id, cidr, created_at`,
      [orgData.id, cidr, description || null, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "This IP range is already in the allowlist" },
        { status: 409 }
      );
    }

    // Log audit event
    await pool.query(
      `INSERT INTO organization_audit_log (org_id, actor_id, action, target_type, new_value)
       VALUES ($1, $2, 'ip_allowlist.added', 'ip_range', $3)`,
      [orgData.id, userId, JSON.stringify({ cidr, description })]
    );

    return NextResponse.json({
      id: result.rows[0].id,
      cidr: result.rows[0].cidr,
      description,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    console.error("Error adding IP to allowlist:", error);
    if ((error as Error).message?.includes("invalid input syntax for type cidr")) {
      return NextResponse.json({ error: "Invalid CIDR format" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/organizations/:slug/ip-allowlist
 * Remove an IP range from the allowlist
 */
export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    const url = new URL(req.url);
    const entryId = url.searchParams.get("id");

    if (!entryId) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    // Check if user is admin of org
    const org = await pool.query(
      `SELECT o.id
       FROM organizations o
       JOIN organization_members om ON o.id = om.org_id
       WHERE o.slug = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin') AND o.deleted_at IS NULL`,
      [slug, userId]
    );

    if (org.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
    }

    const orgId = org.rows[0].id;

    // Delete entry
    const result = await pool.query(
      `DELETE FROM ip_allowlist WHERE id = $1 AND org_id = $2 RETURNING cidr`,
      [entryId, orgId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Log audit event
    await pool.query(
      `INSERT INTO organization_audit_log (org_id, actor_id, action, target_type, old_value)
       VALUES ($1, $2, 'ip_allowlist.removed', 'ip_range', $3)`,
      [orgId, userId, JSON.stringify({ cidr: result.rows[0].cidr })]
    );

    return NextResponse.json({ message: "IP range removed from allowlist" });
  } catch (error) {
    console.error("Error removing IP from allowlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
