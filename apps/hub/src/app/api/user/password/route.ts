/**
 * Password Management
 * POST /api/user/password - Change password
 */

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Verify current password
  const user = await pool.query(
    "SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL",
    [userId]
  );

  if (!user.rows[0]) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
  if (!validPassword) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  // Update password
  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
    [newHash, userId]
  );

  // Invalidate all sessions except current
  // (In production, you would also handle this)

  return NextResponse.json({ success: true, message: "Password updated successfully" });
}
