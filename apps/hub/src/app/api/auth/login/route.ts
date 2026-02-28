import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { validateBody, loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  // Apply strict rate limiting for auth endpoints
  const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

  // Validate input
  const validation = await validateBody(req, loginSchema);
  if ("error" in validation) return validation.error;

  const { email, password } = validation.data;

  try {

    const result = await pool.query(
      "SELECT id, email, name, username, password_hash, avatar_url FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Update last login
    await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);

    // Create JWT token using secure auth module
    const { token } = generateToken(user.id, user.email);

    // Hash token for storage
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Create session with token_hash
    await pool.query(
      "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, tokenHash]
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
