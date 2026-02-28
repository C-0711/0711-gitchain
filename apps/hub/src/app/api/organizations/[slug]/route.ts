import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

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

    // Get user role if authenticated (using secure JWT verification)
    let role = null;
    const authHeader = request.headers.get("authorization");
    const userId = getUserIdFromToken(authHeader);
    if (userId) {
      const memberResult = await pool.query(
        "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'",
        [org.id, userId]
      );
      if (memberResult.rows.length > 0) {
        role = memberResult.rows[0].role;
      }
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
