import { NextRequest, NextResponse } from "next/server";
import {
  pool,
  getUserIdFromToken,
  checkOrgMembership,
  logAuditEvent,
} from "@/lib/db";

// GET /api/teams/[id] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get team with org info
    const teamResult = await pool.query(
      `SELECT t.*, o.slug as org_slug, o.name as org_name
       FROM organization_teams t
       JOIN organizations o ON t.org_id = o.id
       WHERE t.id = $1`,
      [id]
    );

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = teamResult.rows[0];

    // Get team members
    const membersResult = await pool.query(
      `SELECT tm.*, u.email, u.name, u.username, u.avatar_url
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.created_at`,
      [id]
    );

    // Get containers this team has access to
    const containersResult = await pool.query(
      `SELECT tca.*, c.container_id, c.type, c.namespace, c.identifier
       FROM team_container_access tca
       JOIN containers c ON tca.container_id = c.id
       WHERE tca.team_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.updated_at DESC
       LIMIT 20`,
      [id]
    );

    return NextResponse.json({
      team,
      members: membersResult.rows,
      containers: containersResult.rows,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[id] - Update team
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, default_container_role } = body;

    // Get user
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get team to check permissions
    const teamResult = await pool.query(
      "SELECT * FROM organization_teams WHERE id = $1",
      [id]
    );

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = teamResult.rows[0];

    // Check org admin permission
    const hasPermission = await checkOrgMembership(
      userId,
      team.org_id,
      "admin"
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Must be admin to update teams" },
        { status: 403 }
      );
    }

    // Build update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIdx++}`);
      values.push(description);
    }
    if (default_container_role !== undefined) {
      updates.push(`default_container_role = $${paramIdx++}`);
      values.push(default_container_role);
    }

    if (updates.length === 0) {
      return NextResponse.json({ team });
    }

    values.push(id);
    const updateResult = await pool.query(
      `UPDATE organization_teams SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${paramIdx}
       RETURNING *`,
      values
    );

    // Log audit event
    await logAuditEvent(
      team.org_id,
      userId,
      "team.updated",
      "team",
      id,
      { name: team.name, description: team.description },
      { name, description },
      {},
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ team: updateResult.rows[0] });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
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

    // Check org admin permission
    const hasPermission = await checkOrgMembership(
      userId,
      team.org_id,
      "admin"
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Must be admin to delete teams" },
        { status: 403 }
      );
    }

    // Delete team (cascades to team_members and team_container_access)
    await pool.query("DELETE FROM organization_teams WHERE id = $1", [id]);

    // Log audit event
    await logAuditEvent(
      team.org_id,
      userId,
      "team.deleted",
      "team",
      id,
      { name: team.name },
      null,
      {},
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
