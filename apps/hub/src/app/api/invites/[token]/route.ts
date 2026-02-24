import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET /api/invites/[token] - Get invite details (for viewing before accepting)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Get invite with org info
    const inviteResult = await pool.query(
      `SELECT oi.*, o.slug as org_slug, o.name as org_name, o.avatar_url as org_avatar,
              u.name as invited_by_name
       FROM organization_invites oi
       JOIN organizations o ON oi.org_id = o.id
       LEFT JOIN users u ON oi.invited_by = u.id
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

    return NextResponse.json({
      invite: {
        email: invite.email,
        role: invite.role,
        organization: {
          slug: invite.org_slug,
          name: invite.org_name,
          avatar_url: invite.org_avatar,
        },
        invited_by: invite.invited_by_name,
        expires_at: invite.expires_at,
      },
    });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}
