import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  pool,
  getUserIdFromToken,
  checkOrgMembership,
  logAuditEvent,
} from "@/lib/db";

// GET /api/organizations/[slug]/invite - List pending invites
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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

    // Check admin permission
    const hasPermission = await checkOrgMembership(userId, orgId, "admin");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Must be admin to view invites" },
        { status: 403 }
      );
    }

    // Get pending invites
    const invitesResult = await pool.query(
      `SELECT oi.*, u.name as invited_by_name, u.email as invited_by_email
       FROM organization_invites oi
       LEFT JOIN users u ON oi.invited_by = u.id
       WHERE oi.org_id = $1
         AND oi.accepted_at IS NULL
         AND oi.expires_at > NOW()
       ORDER BY oi.created_at DESC`,
      [orgId]
    );

    return NextResponse.json({ invites: invitesResult.rows });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[slug]/invite - Send invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { email, role, team_ids } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Get user from auth
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get org
    const orgResult = await pool.query(
      "SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
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
        { error: "Must be admin to send invites" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await pool.query(
      `SELECT om.* FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.org_id = $1 AND u.email = $2`,
      [org.id, email.toLowerCase()]
    );

    if (existingMember.rows.length > 0) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 }
      );
    }

    // Check for existing pending invite
    const existingInvite = await pool.query(
      `SELECT * FROM organization_invites
       WHERE org_id = $1 AND email = $2
         AND accepted_at IS NULL AND expires_at > NOW()`,
      [org.id, email.toLowerCase()]
    );

    if (existingInvite.rows.length > 0) {
      return NextResponse.json(
        { error: "Invite already pending for this email" },
        { status: 409 }
      );
    }

    // Check member limit
    if (org.max_members !== null) {
      const memberCount = await pool.query(
        "SELECT COUNT(*) FROM organization_members WHERE org_id = $1 AND status = 'active'",
        [org.id]
      );
      const pendingCount = await pool.query(
        "SELECT COUNT(*) FROM organization_invites WHERE org_id = $1 AND accepted_at IS NULL AND expires_at > NOW()",
        [org.id]
      );

      const total =
        parseInt(memberCount.rows[0].count) +
        parseInt(pendingCount.rows[0].count);
      if (total >= org.max_members) {
        return NextResponse.json(
          { error: `Member limit (${org.max_members}) reached` },
          { status: 403 }
        );
      }
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");

    // Create invite (expires in 7 days)
    const inviteResult = await pool.query(
      `INSERT INTO organization_invites (org_id, email, role, invited_by, token, team_ids, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')
       RETURNING *`,
      [
        org.id,
        email.toLowerCase(),
        role || "member",
        userId,
        token,
        team_ids || [],
      ]
    );

    const invite = inviteResult.rows[0];

    // Log audit event
    await logAuditEvent(
      org.id,
      userId,
      "member.invited",
      "invite",
      invite.id,
      null,
      { email, role: role || "member", team_ids },
      {},
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    // In production, send email with invite link
    // For now, return the token for testing
    return NextResponse.json(
      {
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          token: invite.token, // Remove in production
          expires_at: invite.expires_at,
          invite_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[slug]/invite - Revoke invite
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("id");

    if (!inviteId) {
      return NextResponse.json(
        { error: "invite id is required" },
        { status: 400 }
      );
    }

    // Get user from auth
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get invite
    const inviteResult = await pool.query(
      "SELECT * FROM organization_invites WHERE id = $1",
      [inviteId]
    );

    if (inviteResult.rows.length === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const invite = inviteResult.rows[0];

    // Check admin permission
    const hasPermission = await checkOrgMembership(
      userId,
      invite.org_id,
      "admin"
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Must be admin to revoke invites" },
        { status: 403 }
      );
    }

    // Delete invite
    await pool.query("DELETE FROM organization_invites WHERE id = $1", [
      inviteId,
    ]);

    // Log audit event
    await logAuditEvent(
      invite.org_id,
      userId,
      "member.invite_revoked",
      "invite",
      inviteId,
      { email: invite.email },
      null,
      {},
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Failed to revoke invite" },
      { status: 500 }
    );
  }
}
