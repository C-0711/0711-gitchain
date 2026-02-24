import { NextRequest, NextResponse } from "next/server";
import {
  pool,
  getUserIdFromToken,
  checkOrgMembership,
  hasMinRole,
  logAuditEvent,
} from "@/lib/db";

// GET /api/organizations/[slug]/members/[id] - Get member details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;

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

    // Get member with user info
    const memberResult = await pool.query(
      `SELECT om.*, u.email, u.name, u.username, u.avatar_url, u.bio, u.location, u.website
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.org_id = $1 AND om.user_id = $2`,
      [orgId, id]
    );

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Get member's teams
    const teamsResult = await pool.query(
      `SELECT t.id, t.slug, t.name, tm.role as team_role
       FROM team_members tm
       JOIN organization_teams t ON tm.team_id = t.id
       WHERE tm.user_id = $1 AND t.org_id = $2`,
      [id, orgId]
    );

    return NextResponse.json({
      member: {
        ...memberResult.rows[0],
        teams: teamsResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/[slug]/members/[id] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: memberId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }

    // Validate role
    const validRoles = ["owner", "admin", "maintainer", "member", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Get user from auth
    const actorId = getUserIdFromToken(request.headers.get("authorization"));
    if (!actorId) {
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

    // Get actor's role
    const actorRoleResult = await pool.query(
      "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'",
      [orgId, actorId]
    );

    if (actorRoleResult.rows.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    const actorRole = actorRoleResult.rows[0].role;

    // Get target member's current role
    const targetResult = await pool.query(
      "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2",
      [orgId, memberId]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const currentRole = targetResult.rows[0].role;

    // Permission checks:
    // 1. Only owner can change anyone to/from owner
    // 2. Admin can change roles for member/maintainer (but not admin/owner)
    // 3. Cannot demote yourself from owner if you're the only owner

    if (role === "owner" || currentRole === "owner") {
      if (actorRole !== "owner") {
        return NextResponse.json(
          { error: "Only owners can change owner roles" },
          { status: 403 }
        );
      }
    }

    // Admins can only change non-admin roles
    if (!hasMinRole(actorRole, "admin")) {
      return NextResponse.json(
        { error: "Must be admin to change member roles" },
        { status: 403 }
      );
    }

    if (actorRole === "admin" && hasMinRole(currentRole, "admin")) {
      return NextResponse.json(
        { error: "Admins cannot change roles of other admins or owners" },
        { status: 403 }
      );
    }

    // Check if demoting self from owner - ensure there's another owner
    if (actorId === memberId && currentRole === "owner" && role !== "owner") {
      const ownerCountResult = await pool.query(
        "SELECT COUNT(*) FROM organization_members WHERE org_id = $1 AND role = 'owner' AND status = 'active'",
        [orgId]
      );

      if (parseInt(ownerCountResult.rows[0].count) <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the only owner. Transfer ownership first." },
          { status: 403 }
        );
      }
    }

    // Update role
    const updateResult = await pool.query(
      `UPDATE organization_members SET role = $1, updated_at = NOW()
       WHERE org_id = $2 AND user_id = $3
       RETURNING *`,
      [role, orgId, memberId]
    );

    // Get user info for response
    const userResult = await pool.query(
      "SELECT email, name, username, avatar_url FROM users WHERE id = $1",
      [memberId]
    );

    // Log audit event
    await logAuditEvent(
      orgId,
      actorId,
      "member.role_changed",
      "user",
      memberId,
      { role: currentRole },
      { role },
      {},
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      member: {
        ...updateResult.rows[0],
        ...userResult.rows[0],
      },
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[slug]/members/[id] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: memberId } = await params;

    // Get user from auth
    const actorId = getUserIdFromToken(request.headers.get("authorization"));
    if (!actorId) {
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

    // Get target member
    const targetResult = await pool.query(
      "SELECT * FROM organization_members WHERE org_id = $1 AND user_id = $2",
      [orgId, memberId]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const targetRole = targetResult.rows[0].role;

    // Can remove self, or admin+ can remove others (with restrictions)
    const isSelf = actorId === memberId;

    if (!isSelf) {
      // Get actor's role
      const actorRoleResult = await pool.query(
        "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'",
        [orgId, actorId]
      );

      if (actorRoleResult.rows.length === 0) {
        return NextResponse.json(
          { error: "You are not a member of this organization" },
          { status: 403 }
        );
      }

      const actorRole = actorRoleResult.rows[0].role;

      // Only owner can remove admin/owner
      if (hasMinRole(targetRole, "admin") && actorRole !== "owner") {
        return NextResponse.json(
          { error: "Only owners can remove admins" },
          { status: 403 }
        );
      }

      // Admin can remove member/maintainer
      if (!hasMinRole(actorRole, "admin")) {
        return NextResponse.json(
          { error: "Must be admin to remove members" },
          { status: 403 }
        );
      }
    }

    // Check if removing self as only owner
    if (isSelf && targetRole === "owner") {
      const ownerCountResult = await pool.query(
        "SELECT COUNT(*) FROM organization_members WHERE org_id = $1 AND role = 'owner' AND status = 'active'",
        [orgId]
      );

      if (parseInt(ownerCountResult.rows[0].count) <= 1) {
        return NextResponse.json(
          { error: "Cannot leave as the only owner. Transfer ownership first." },
          { status: 403 }
        );
      }
    }

    // Remove from all teams in this org first
    await pool.query(
      `DELETE FROM team_members
       WHERE user_id = $1 AND team_id IN (
         SELECT id FROM organization_teams WHERE org_id = $2
       )`,
      [memberId, orgId]
    );

    // Remove membership
    await pool.query(
      "DELETE FROM organization_members WHERE org_id = $1 AND user_id = $2",
      [orgId, memberId]
    );

    // Log audit event
    await logAuditEvent(
      orgId,
      actorId,
      isSelf ? "member.left" : "member.removed",
      "user",
      memberId,
      { role: targetRole },
      null,
      {},
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
