import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://gitchain:gitchain2026@localhost:5440/gitchain",
});

const JWT_SECRET = process.env.JWT_SECRET || "gitchain-secret-key-2026";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

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

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

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
