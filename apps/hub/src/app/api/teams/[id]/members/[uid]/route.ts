import { NextRequest, NextResponse } from "next/server";
import {
  pool,
  getUserIdFromToken,
  checkOrgMembership,
  logAuditEvent,
} from "@/lib/db";

// DELETE /api/teams/[id]/members/[uid] - Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  try {
    const { id, uid } = await params;

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

    // Check permissions (must be maintainer+ OR removing yourself)
    const isSelf = actorId === uid;
    const hasPermission = await checkOrgMembership(
      actorId,
      team.org_id,
      "maintainer"
    );

    if (!isSelf && !hasPermission) {
      return NextResponse.json(
        { error: "Must be maintainer to remove team members" },
        { status: 403 }
      );
    }

    // Check if member exists
    const memberResult = await pool.query(
      "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2",
      [id, uid]
    );

    if (memberResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User is not a team member" },
        { status: 404 }
      );
    }

    // Remove from team
    await pool.query(
      "DELETE FROM team_members WHERE team_id = $1 AND user_id = $2",
      [id, uid]
    );

    // Log audit event
    await logAuditEvent(
      team.org_id,
      actorId,
      "team.member_removed",
      "user",
      uid,
      { team_id: id, role: memberResult.rows[0].role },
      null,
      { team_name: team.name, self_removal: isSelf },
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[id]/members/[uid] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  try {
    const { id, uid } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
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

    // Check admin permission
    const hasPermission = await checkOrgMembership(
      actorId,
      team.org_id,
      "admin"
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Must be admin to change team member roles" },
        { status: 403 }
      );
    }

    // Get current member info
    const currentResult = await pool.query(
      "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2",
      [id, uid]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User is not a team member" },
        { status: 404 }
      );
    }

    const oldRole = currentResult.rows[0].role;

    // Update role
    const memberResult = await pool.query(
      `UPDATE team_members SET role = $1
       WHERE team_id = $2 AND user_id = $3
       RETURNING *`,
      [role, id, uid]
    );

    // Get user info
    const userResult = await pool.query(
      "SELECT email, name, username, avatar_url FROM users WHERE id = $1",
      [uid]
    );

    // Log audit event
    await logAuditEvent(
      team.org_id,
      actorId,
      "team.member_role_changed",
      "user",
      uid,
      { role: oldRole },
      { role },
      { team_name: team.name },
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      member: {
        ...memberResult.rows[0],
        ...userResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}
