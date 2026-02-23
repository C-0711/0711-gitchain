/**
 * API Tokens Management - GitHub Personal Access Tokens style
 * GET /api/user/tokens - List tokens
 * POST /api/user/tokens - Create new token
 * DELETE /api/user/tokens - Revoke token
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://gitchain:gitchain2026@localhost:5440/gitchain",
});

const JWT_SECRET = process.env.JWT_SECRET || "gitchain-secret-key-2026";

async function getUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT id, name, token_prefix, scopes, expires_at, last_used_at, created_at
     FROM api_keys 
     WHERE user_id = $1 AND revoked_at IS NULL
     ORDER BY created_at DESC`,
    [userId]
  );

  return NextResponse.json({ tokens: result.rows });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, scopes = ["read"], expiresInDays } = body;

  if (!name) {
    return NextResponse.json({ error: "Token name required" }, { status: 400 });
  }

  // Generate token: gitchain_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const tokenValue = `gitchain_${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = crypto.createHash("sha256").update(tokenValue).digest("hex");
  const tokenPrefix = tokenValue.slice(0, 16);

  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const result = await pool.query(
    `INSERT INTO api_keys (user_id, name, token_hash, token_prefix, scopes, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, token_prefix, scopes, expires_at, created_at`,
    [userId, name, tokenHash, tokenPrefix, JSON.stringify(scopes), expiresAt]
  );

  // Return full token only once (on creation)
  return NextResponse.json({
    ...result.rows[0],
    token: tokenValue, // Only shown once!
    warning: "Make sure to copy your token now. You won t be able to see it again!",
  });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get("id");

  if (!tokenId) {
    return NextResponse.json({ error: "Token ID required" }, { status: 400 });
  }

  const result = await pool.query(
    `UPDATE api_keys SET revoked_at = NOW() 
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
     RETURNING id`,
    [tokenId, userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Token revoked" });
}
