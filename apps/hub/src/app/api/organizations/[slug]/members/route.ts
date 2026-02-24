import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5440,
  database: "gitchain",
  user: "gitchain",
  password: "gitchain2026",
});

// GET /api/organizations/[slug]/members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get org first
    const orgResult = await pool.query(
      "SELECT id FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const orgId = orgResult.rows[0].id;

    // Get members with user info
    const membersResult = await pool.query(
      `SELECT om.*, u.email, u.name, u.username, u.avatar_url
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.org_id = $1
       ORDER BY 
         CASE om.role 
           WHEN 'owner' THEN 1 
           WHEN 'admin' THEN 2 
           WHEN 'maintainer' THEN 3 
           WHEN 'member' THEN 4 
           ELSE 5 
         END,
         om.created_at`,
      [orgId]
    );

    return NextResponse.json({ members: membersResult.rows });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
