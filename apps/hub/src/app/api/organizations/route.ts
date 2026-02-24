import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5440,
  database: "gitchain",
  user: "gitchain",
  password: "gitchain2026",
});

// GET /api/organizations - List all organizations
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT * FROM organizations 
      WHERE deleted_at IS NULL 
      ORDER BY name
    `);

    return NextResponse.json({
      organizations: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, name, description, website } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: "slug and name are required" },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existing = await pool.query(
      "SELECT id FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Organization slug already taken" },
        { status: 409 }
      );
    }

    // Get user from auth header (simplified for now)
    const authHeader = request.headers.get("authorization");
    let userId = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        // Simple JWT decode (in production, use proper verification)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.userId;
      } catch {}
    }

    // Create organization
    const orgResult = await pool.query(
      `INSERT INTO organizations (slug, name, description, website, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [slug.toLowerCase(), name, description || null, website || null, userId]
    );

    const org = orgResult.rows[0];

    // Add creator as owner if userId exists
    if (userId) {
      await pool.query(
        `INSERT INTO organization_members (org_id, user_id, role, invited_by, accepted_at, status)
         VALUES ($1, $2, 'owner', $2, NOW(), 'active')`,
        [org.id, userId]
      );
    }

    return NextResponse.json({ organization: org }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
