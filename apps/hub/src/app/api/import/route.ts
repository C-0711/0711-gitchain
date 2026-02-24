import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken, withTransaction } from "@/lib/db";
import crypto from "crypto";

// Helper to generate container ID
function generateContainerId(
  type: string,
  namespace: string,
  identifier: string
): string {
  return `0711:${type}:${namespace}:${identifier}`;
}

// Helper to generate content hash
function generateContentHash(data: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}

// GET /api/import - List import jobs
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");
    const status = searchParams.get("status");

    let query = `
      SELECT ij.*, o.slug as org_slug, o.name as org_name
      FROM import_jobs ij
      LEFT JOIN organizations o ON ij.org_id = o.id
      WHERE ij.user_id = $1
    `;
    const params: unknown[] = [userId];
    let paramIdx = 2;

    if (orgId) {
      query += ` AND ij.org_id = $${paramIdx++}`;
      params.push(orgId);
    }

    if (status) {
      query += ` AND ij.status = $${paramIdx++}`;
      params.push(status);
    }

    query += ` ORDER BY ij.created_at DESC LIMIT 50`;

    const result = await pool.query(query, params);

    return NextResponse.json({ jobs: result.rows });
  } catch (error) {
    console.error("Error fetching import jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch import jobs" },
      { status: 500 }
    );
  }
}

// POST /api/import - Create import job (generic endpoint)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, org_id, namespace, items } = body;

    if (!type) {
      return NextResponse.json(
        { error: "type is required (json, csv, bmcat)" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "items array is required" },
        { status: 400 }
      );
    }

    // Check org membership if org_id provided
    if (org_id) {
      const memberResult = await pool.query(
        "SELECT * FROM organization_members WHERE org_id = $1 AND user_id = $2 AND status = 'active'",
        [org_id, userId]
      );

      if (memberResult.rows.length === 0) {
        return NextResponse.json(
          { error: "You are not a member of this organization" },
          { status: 403 }
        );
      }
    }

    // Create import job
    const jobResult = await pool.query(
      `INSERT INTO import_jobs (org_id, user_id, type, total_items, status)
       VALUES ($1, $2, $3, $4, 'processing')
       RETURNING *`,
      [org_id || null, userId, type, items.length]
    );

    const job = jobResult.rows[0];

    // Process items
    const createdContainers: string[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    let processed = 0;

    await withTransaction(async (client) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          const containerType = item.type || "product";
          const containerNamespace = item.namespace || namespace || "import";
          const identifier = item.identifier || item.id || item.sku || `item-${i}`;

          const containerId = generateContainerId(
            containerType,
            containerNamespace,
            identifier
          );

          const data = {
            name: item.name || identifier,
            description: item.description,
            ...item.data,
          };

          const contentHash = generateContentHash(data);

          // Insert container
          const containerResult = await client.query(
            `INSERT INTO containers (
               container_id, type, namespace, identifier, version,
               data, meta, content_hash, created_by, org_id, visibility
             )
             VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (container_id) DO UPDATE SET
               data = $5,
               meta = $6,
               content_hash = $7,
               updated_by = $8,
               version = containers.version + 1,
               updated_at = NOW()
             RETURNING id`,
            [
              containerId,
              containerType,
              containerNamespace,
              identifier,
              JSON.stringify(data),
              JSON.stringify(item.meta || {}),
              contentHash,
              userId,
              org_id || null,
              org_id ? "org" : "private",
            ]
          );

          createdContainers.push(containerResult.rows[0].id);
          processed++;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push({ index: i, error: errorMessage });
        }
      }
    });

    // Update job status
    await pool.query(
      `UPDATE import_jobs SET
         status = $1,
         processed_items = $2,
         failed_items = $3,
         created_containers = $4,
         errors = $5,
         completed_at = NOW()
       WHERE id = $6`,
      [
        errors.length === items.length ? "failed" : "completed",
        processed,
        errors.length,
        createdContainers,
        JSON.stringify(errors),
        job.id,
      ]
    );

    return NextResponse.json(
      {
        job_id: job.id,
        status: errors.length === items.length ? "failed" : "completed",
        total: items.length,
        processed,
        failed: errors.length,
        containers: createdContainers.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating import job:", error);
    return NextResponse.json(
      { error: "Failed to create import job" },
      { status: 500 }
    );
  }
}
