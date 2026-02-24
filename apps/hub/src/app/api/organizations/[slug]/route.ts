import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5440,
  database: "gitchain",
  user: "gitchain",
  password: "gitchain2026",
});

// GET /api/organizations/[slug]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get organization
    const orgResult = await pool.query(
      "SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const org = orgResult.rows[0];

    // Get user role if authenticated
    let role = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const memberResult = await pool.query(
          "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'",
          [org.id, payload.userId]
        );
        if (memberResult.rows.length > 0) {
          role = memberResult.rows[0].role;
        }
      } catch {}
    }

    // Get stats
    const memberCount = await pool.query(
      "SELECT COUNT(*) FROM organization_members WHERE org_id = $1 AND status = 'active'",
      [org.id]
    );
    const containerCount = await pool.query(
      "SELECT COUNT(*) FROM containers WHERE org_id = $1 AND deleted_at IS NULL",
      [org.id]
    );
    const inviteCount = await pool.query(
      "SELECT COUNT(*) FROM organization_invites WHERE org_id = $1 AND accepted_at IS NULL AND expires_at > NOW()",
      [org.id]
    );

    return NextResponse.json({
      organization: org,
      role,
      stats: {
        member_count: parseInt(memberCount.rows[0].count),
        container_count: parseInt(containerCount.rows[0].count),
        pending_invites: parseInt(inviteCount.rows[0].count),
      },
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}
