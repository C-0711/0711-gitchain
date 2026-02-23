/**
 * User Profile API - GitHub-style
 * GET /api/user - Get current user
 * PATCH /api/user - Update profile
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import jwt from "jsonwebtoken";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://gitchain:gitchain2026@localhost:5440/gitchain",
});

const JWT_SECRET = process.env.JWT_SECRET || "gitchain-secret-key-2026";

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const result = await pool.query(
      `SELECT id, email, name, username, avatar_url, bio, company, location, website, settings, created_at, last_login_at 
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.userId]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user stats
  const stats = await pool.query(
    `SELECT 
      (SELECT COUNT(*) FROM containers WHERE created_by = $1) as containers_count,
      (SELECT COUNT(*) FROM namespaces WHERE owner_id = $1) as namespaces_count,
      (SELECT COUNT(*) FROM api_keys WHERE user_id = $1 AND revoked_at IS NULL) as tokens_count`,
    [user.id]
  );

  return NextResponse.json({
    ...user,
    stats: stats.rows[0],
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allowedFields = ["name", "username", "bio", "company", "location", "website", "avatar_url"];
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(body[field]);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(user.id);
  const result = await pool.query(
    `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() 
     WHERE id = $${paramIndex} 
     RETURNING id, email, name, username, avatar_url, bio, company, location, website, settings, created_at`,
    values
  );

  return NextResponse.json(result.rows[0]);
}
