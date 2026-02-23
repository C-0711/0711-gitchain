import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://gitchain:gitchain2026@localhost:5440/gitchain",
});

const JWT_SECRET = process.env.JWT_SECRET || "gitchain-secret-key-2026";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

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

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create session
    await pool.query(
      "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, token]
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
