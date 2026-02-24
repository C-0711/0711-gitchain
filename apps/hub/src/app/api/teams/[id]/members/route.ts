import { NextRequest, NextResponse } from "next/server";
import {
  pool,
  getUserIdFromToken,
  checkOrgMembership,
  logAuditEvent,
} from "@/lib/db";

// GET /api/teams/[id]/members - List team members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get team
    const teamResult = await pool.query(
      "SELECT org_id FROM organization_teams WHERE id = $1",
      [id]
    );

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get members
    const membersResult = await pool.query(
      `SELECT tm.*, u.email, u.name, u.username, u.avatar_url
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY
         CASE tm.role WHEN 'maintainer' THEN 1 ELSE 2 END,
         tm.created_at`,
      [id]
    );

    return NextResponse.json({ members: membersResult.rows });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/members - Add member to team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Get user from auth
    const actorId = getUserIdFromToken(request.headers.get("authorization"));
    if (!actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get team
    const teamResult = await pool.query(
      "SELECT * FROM organization_teams WHERE id = $1",
      [id]
    );

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = teamResult.rows[0];

    // Check org membership (maintainer+)
    const hasPermission = await checkOrgMembership(
      actorId,
      team.org_id,
      "maintainer"
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Must be maintainer to add team members" },
        { status: 403 }
      );
    }

    // Check target user is org member
    const targetMemberResult = await pool.query(
      "SELECT * FROM organization_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'",
      [team.org_id, user_id]
    );

    if (targetMemberResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User must be an organization member first" },
        { status: 400 }
      );
    }

    // Add to team
    const memberResult = await pool.query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO UPDATE SET role = $3
       RETURNING *`,
      [id, user_id, role || "member"]
    );

    // Get user info for response
    const userResult = await pool.query(
      "SELECT email, name, username, avatar_url FROM users WHERE id = $1",
      [user_id]
    );

    // Log audit event
    await logAuditEvent(
      team.org_id,
      actorId,
      "team.member_added",
      "user",
      user_id,
      null,
      { team_id: id, role: role || "member" },
      { team_name: team.name },
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json(
      {
        member: {
          ...memberResult.rows[0],
          ...userResult.rows[0],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}
