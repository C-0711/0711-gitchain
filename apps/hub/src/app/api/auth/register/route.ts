import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { validateBody, registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  // Apply strict rate limiting for auth endpoints
  const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

  // Validate input (includes password strength check)
  const validation = await validateBody(req, registerSchema);
  if ("error" in validation) return validation.error;

  const { name, email, password } = validation.data;

  try {
    // Check if email already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL",
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate username from email
    const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, username, email_verified)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, email, name, username, avatar_url`,
      [email.toLowerCase(), passwordHash, name, username]
    );

    const user = result.rows[0];

    // Create JWT token using secure auth module
    const { token } = generateToken(user.id, user.email);

    // Hash token for storage
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Create session with hashed token
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
  } catch (error: any) {
    console.error("Register error:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email or username already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
