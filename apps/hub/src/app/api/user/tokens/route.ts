import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import crypto from "crypto";

// Available scopes
const VALID_SCOPES = [
  "containers:read",
  "containers:write",
  "containers:delete",
  "atoms:read",
  "atoms:write",
  "chain:read",
  "chain:certify",
  "orgs:read",
  "orgs:admin",
  "user:read",
  "user:write",
  "notifications:read",
  "webhooks:read",
  "webhooks:write",
] as const;

type Scope = (typeof VALID_SCOPES)[number];

/**
 * Generate a secure token
 * Format: gc_pat_<40 random chars>
 */
function generateToken(): { token: string; prefix: string; hash: string } {
  const randomPart = crypto.randomBytes(30).toString("base64url").slice(0, 40);
  const token = `gc_pat_${randomPart}`;
  const prefix = token.slice(0, 12); // gc_pat_xxxx
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, prefix, hash };
}

/**
 * GET /api/user/tokens
 * List user's personal access tokens (without secrets)
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
       WHERE user_id = $1 AND revoked_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      tokens: result.rows.map((row) => ({
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
      })),
    });
  } catch (error) {
    console.error("Error listing tokens:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/user/tokens
 * Create a new personal access token
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting for API key creation (10 per hour)
  const rateLimitResponse = applyRateLimit(req, RATE_LIMITS.apiKeys);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, scopes, expiresAt, containerIds, orgIds, description } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.length < 1 || name.length > 255) {
      return NextResponse.json(
        { error: "Name is required and must be 1-255 characters" },
        { status: 400 }
      );
    }

    // Validate scopes
    if (!Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: "At least one scope is required" },
        { status: 400 }
      );
    }

    const invalidScopes = scopes.filter((s) => !VALID_SCOPES.includes(s as Scope));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: `Invalid scopes: ${invalidScopes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate expiry
    let expiresAtDate: Date | null = null;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json({ error: "Invalid expiresAt date" }, { status: 400 });
      }
      if (expiresAtDate <= new Date()) {
        return NextResponse.json(
          { error: "Expiry date must be in the future" },
          { status: 400 }
        );
      }
    }

    // Generate token
    const { token, prefix, hash } = generateToken();

    // Insert token
    const result = await pool.query(
      `INSERT INTO personal_access_tokens
       (user_id, name, token_prefix, token_hash, scopes, container_ids, org_ids, expires_at, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [
        userId,
        name,
        prefix,
        hash,
        JSON.stringify(scopes),
        containerIds || null,
        orgIds || null,
        expiresAtDate,
        description || null,
      ]
    );

    // Return the token ONCE - it will never be shown again
    return NextResponse.json({
      token, // This is the only time the full token is returned!
      tokenInfo: {
        id: result.rows[0].id,
        name,
        tokenPrefix: prefix,
        scopes,
        containerIds: containerIds || null,
        orgIds: orgIds || null,
        expiresAt: expiresAtDate,
        description: description || null,
        createdAt: result.rows[0].created_at,
      },
      warning: "Make sure to copy your token now. You won't be able to see it again!",
    });
  } catch (error) {
    console.error("Error creating token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
