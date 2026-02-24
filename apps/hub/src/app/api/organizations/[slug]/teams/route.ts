import { NextRequest, NextResponse } from "next/server";
import {
  pool,
  getUserIdFromToken,
  checkOrgMembership,
  logAuditEvent,
} from "@/lib/db";

// GET /api/organizations/[slug]/teams - List teams
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get org
    const orgResult = await pool.query(
      "SELECT id FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgId = orgResult.rows[0].id;

    // Get teams with member counts
    const teamsResult = await pool.query(
      `SELECT
         t.*,
         (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count
       FROM organization_teams t
       WHERE t.org_id = $1
       ORDER BY t.name`,
      [orgId]
    );

    return NextResponse.json({ teams: teamsResult.rows });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[slug]/teams - Create team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { name, description, default_container_role } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Get user from auth
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get org
    const orgResult = await pool.query(
      "SELECT id FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgId = orgResult.rows[0].id;

    // Check permissions (must be admin+)
    const hasPermission = await checkOrgMembership(userId, orgId, "admin");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Must be admin to create teams" },
        { status: 403 }
      );
    }

    // Generate slug from name
    const teamSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug exists
    const existing = await pool.query(
      "SELECT id FROM organization_teams WHERE org_id = $1 AND slug = $2",
      [orgId, teamSlug]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Team with this name already exists" },
        { status: 409 }
      );
    }

    // Create team
    const teamResult = await pool.query(
      `INSERT INTO organization_teams (org_id, slug, name, description, default_container_role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        orgId,
        teamSlug,
        name,
        description || null,
        default_container_role || "read",
      ]
    );

    const team = teamResult.rows[0];

    // Log audit event
    await logAuditEvent(
      orgId,
      userId,
      "team.created",
      "team",
      team.id,
      null,
      { name, slug: teamSlug },
      {},
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
