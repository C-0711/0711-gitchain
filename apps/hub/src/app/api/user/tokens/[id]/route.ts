import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * GET /api/user/tokens/:id
 * Get a single token's details (without the secret)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenId = params.id;

    const result = await pool.query(
      `SELECT
         id,
         name,
         token_prefix,
         scopes,
         container_ids,
         org_ids,
         expires_at,
         last_used_at,
         last_used_ip,
         description,
         created_at
       FROM personal_access_tokens
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [tokenId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      tokenPrefix: row.token_prefix,
      scopes: row.scopes,
      containerIds: row.container_ids,
      orgIds: row.org_ids,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
      lastUsedIp: row.last_used_ip,
      description: row.description,
      createdAt: row.created_at,
      isExpired: row.expires_at ? new Date(row.expires_at) < new Date() : false,
    });
  } catch (error) {
    console.error("Error getting token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/tokens/:id
 * Update token metadata (name, description only - scopes cannot be changed)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenId = params.id;
    const body = await req.json();
    const { name, description } = body;

    // Check token exists and belongs to user
    const existing = await pool.query(
      `SELECT id FROM personal_access_tokens
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [tokenId, userId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      if (typeof name !== "string" || name.length < 1 || name.length > 255) {
        return NextResponse.json(
          { error: "Name must be 1-255 characters" },
          { status: 400 }
        );
      }
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(tokenId);
    values.push(userId);

    const result = await pool.query(
      `UPDATE personal_access_tokens
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING
         id,
         name,
         token_prefix,
         scopes,
         container_ids,
         org_ids,
         expires_at,
         last_used_at,
         last_used_ip,
         description,
         created_at`,
      values
    );

    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      name: row.name,
      tokenPrefix: row.token_prefix,
      scopes: row.scopes,
      containerIds: row.container_ids,
      orgIds: row.org_ids,
      expiresAt: row.expires_at,
      lastUsedAt: row.last_used_at,
      lastUsedIp: row.last_used_ip,
      description: row.description,
      createdAt: row.created_at,
      isExpired: row.expires_at ? new Date(row.expires_at) < new Date() : false,
    });
  } catch (error) {
    console.error("Error updating token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/tokens/:id
 * Revoke a personal access token
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokenId = params.id;

    // Revoke the token (soft delete)
    const result = await pool.query(
      `UPDATE personal_access_tokens
       SET revoked_at = NOW()
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
       RETURNING id, name, token_prefix`,
      [tokenId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Token revoked successfully",
      id: result.rows[0].id,
      name: result.rows[0].name,
      tokenPrefix: result.rows[0].token_prefix,
    });
  } catch (error) {
    console.error("Error revoking token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
