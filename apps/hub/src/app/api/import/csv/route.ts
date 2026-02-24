import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken, withTransaction } from "@/lib/db";
import crypto from "crypto";

function generateContentHash(data: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}

// POST /api/import/csv - Import from CSV data
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      org_id,
      namespace,
      csv_data,
      headers,
      mapping,
      container_type = "product",
    } = body;

    // csv_data is an array of arrays (rows)
    // headers is the first row (column names)
    // mapping defines how columns map to container fields

    if (!csv_data || !Array.isArray(csv_data)) {
      return NextResponse.json(
        { error: "csv_data array is required" },
        { status: 400 }
      );
    }

    const columnHeaders = headers || csv_data[0];
    const dataRows = headers ? csv_data : csv_data.slice(1);

    // Default mapping: look for common fields
    const fieldMapping = mapping || {
      identifier: findColumn(columnHeaders, [
        "id",
        "sku",
        "product_id",
        "identifier",
        "article_number",
      ]),
      name: findColumn(columnHeaders, [
        "name",
        "title",
        "product_name",
        "bezeichnung",
      ]),
      description: findColumn(columnHeaders, [
        "description",
        "beschreibung",
        "desc",
      ]),
    };

    // Check org membership
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
      `INSERT INTO import_jobs (org_id, user_id, type, total_items, status, started_at)
       VALUES ($1, $2, 'csv', $3, 'processing', NOW())
       RETURNING *`,
      [org_id || null, userId, dataRows.length]
    );

    const job = jobResult.rows[0];

    // Process rows
    const createdContainers: string[] = [];
    const errors: Array<{ row: number; error: string }> = [];
    let processed = 0;

    await withTransaction(async (client) => {
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        try {
          // Build container data from mapping
          const data: Record<string, unknown> = {};

          for (const [field, colIndex] of Object.entries(fieldMapping)) {
            if (colIndex !== null && colIndex !== undefined && row[colIndex as number] !== undefined) {
              data[field] = row[colIndex as number];
            }
          }

          // Add all columns as extra data
          for (let j = 0; j < columnHeaders.length; j++) {
            const colName = columnHeaders[j]?.toLowerCase().replace(/\s+/g, "_");
            if (colName && row[j] !== undefined && row[j] !== "") {
              data[colName] = row[j];
            }
          }

          const identifier =
            data.identifier || data.id || data.sku || `row-${i + 1}`;
          const containerNamespace = namespace || "import";
          const containerId = `0711:${container_type}:${containerNamespace}:${identifier}`;

          const containerData = {
            name: data.name || identifier,
            description: data.description,
            ...data,
          };

          const contentHash = generateContentHash(containerData);

          const containerResult = await client.query(
            `INSERT INTO containers (
               container_id, type, namespace, identifier, version,
               data, content_hash, created_by, org_id, visibility
             )
             VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9)
             ON CONFLICT (container_id) DO UPDATE SET
               data = $5,
               content_hash = $6,
               updated_by = $7,
               version = containers.version + 1,
               updated_at = NOW()
             RETURNING id`,
            [
              containerId,
              container_type,
              containerNamespace,
              identifier,
              JSON.stringify(containerData),
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
          errors.push({ row: i + 1, error: errorMessage });
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
        errors.length === dataRows.length ? "failed" : "completed",
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
        status: errors.length === dataRows.length ? "failed" : "completed",
        total: dataRows.length,
        processed,
        failed: errors.length,
        containers: createdContainers.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json(
      { error: "Failed to import CSV" },
      { status: 500 }
    );
  }
}

// Helper to find column index by possible names
function findColumn(headers: string[], possibleNames: string[]): number | null {
  for (const name of possibleNames) {
    const index = headers.findIndex(
      (h) => h?.toLowerCase().replace(/\s+/g, "_") === name.toLowerCase()
    );
    if (index !== -1) {
      return index;
    }
  }
  return null;
}
