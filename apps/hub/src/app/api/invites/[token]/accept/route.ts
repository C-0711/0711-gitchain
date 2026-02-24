import { NextRequest, NextResponse } from "next/server";
import {
  pool,
  getUserIdFromToken,
  withTransaction,
  logAuditEvent,
} from "@/lib/db";

// POST /api/invites/[token]/accept - Accept invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Get user from auth
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user email
    const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [
      userId,
    ]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userEmail = userResult.rows[0].email;

    // Get invite
    const inviteResult = await pool.query(
      `SELECT oi.*, o.slug as org_slug, o.name as org_name
       FROM organization_invites oi
       JOIN organizations o ON oi.org_id = o.id
       WHERE oi.token = $1`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    const invite = inviteResult.rows[0];

    // Check if already accepted
    if (invite.accepted_at) {
      return NextResponse.json(
        { error: "Invite already accepted" },
        { status: 410 }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    // Check email matches
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Invite is for a different email address" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await pool.query(
      "SELECT * FROM organization_members WHERE org_id = $1 AND user_id = $2",
      [invite.org_id, userId]
    );

    if (existingMember.rows.length > 0) {
      // Mark invite as accepted anyway
      await pool.query(
        "UPDATE organization_invites SET accepted_at = NOW() WHERE id = $1",
        [invite.id]
      );
      return NextResponse.json(
        { error: "Already a member of this organization" },
        { status: 409 }
      );
    }

    // Accept invite in a transaction
    await withTransaction(async (client) => {
      // Add user as org member
      await client.query(
        `INSERT INTO organization_members (org_id, user_id, role, invited_by, accepted_at, status)
         VALUES ($1, $2, $3, $4, NOW(), 'active')`,
        [invite.org_id, userId, invite.role, invite.invited_by]
      );

      // Add to teams if specified
      if (invite.team_ids && invite.team_ids.length > 0) {
        for (const teamId of invite.team_ids) {
          await client.query(
            `INSERT INTO team_members (team_id, user_id, role)
             VALUES ($1, $2, 'member')
             ON CONFLICT (team_id, user_id) DO NOTHING`,
            [teamId, userId]
          );
        }
      }

      // Mark invite as accepted
      await client.query(
        "UPDATE organization_invites SET accepted_at = NOW() WHERE id = $1",
        [invite.id]
      );
    });

    // Log audit event
    await logAuditEvent(
      invite.org_id,
      userId,
      "member.joined",
      "user",
      userId,
      null,
      { role: invite.role, via_invite: true },
      { team_ids: invite.team_ids },
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      success: true,
      organization: {
        slug: invite.org_slug,
        name: invite.org_name,
      },
      role: invite.role,
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
