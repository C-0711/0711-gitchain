import { NextRequest, NextResponse } from "next/server";

import { pool, getUserIdFromToken, checkOrgMembership, logAuditEvent } from "@/lib/db";

// GET /api/organizations/[slug]
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 });
  }
}

// PATCH /api/organizations/[slug] - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { name, description, website } = body;

    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgResult = await pool.query(
      "SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const org = orgResult.rows[0];

    const hasPermission = await checkOrgMembership(userId, org.id, "admin");
    if (!hasPermission) {
      return NextResponse.json({ error: "Must be admin to update organization" }, { status: 403 });
    }

    const oldValues = { name: org.name, description: org.description, website: org.website };

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
    if (website !== undefined) {
      updates.push(`website = $${paramIdx++}`);
      values.push(website);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(org.id);

    const updateResult = await pool.query(
      `UPDATE organizations SET ${updates.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    await logAuditEvent(
      org.id,
      userId,
      "org.updated",
      "organization",
      org.id,
      oldValues,
      {
        name: name ?? org.name,
        description: description ?? org.description,
        website: website ?? org.website,
      },
      {},
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ organization: updateResult.rows[0] });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
  }
}

// DELETE /api/organizations/[slug] - Soft-delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgResult = await pool.query(
      "SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );

    if (orgResult.rows.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const org = orgResult.rows[0];

    // Only owner can delete
    const memberResult = await pool.query(
      "SELECT role FROM organization_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'",
      [org.id, userId]
    );

    if (memberResult.rows.length === 0 || memberResult.rows[0].role !== "owner") {
      return NextResponse.json({ error: "Only owners can delete organizations" }, { status: 403 });
    }

    await pool.query("UPDATE organizations SET deleted_at = NOW() WHERE id = $1", [org.id]);

    await logAuditEvent(
      org.id,
      userId,
      "org.deleted",
      "organization",
      org.id,
      { name: org.name, slug: org.slug },
      null,
      {},
      request.headers.get("x-forwarded-for") || undefined,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 });
  }
}
