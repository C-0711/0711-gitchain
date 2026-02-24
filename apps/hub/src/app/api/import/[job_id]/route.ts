import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

// GET /api/import/[job_id] - Get import job status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;

    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get job
    const jobResult = await pool.query(
      `SELECT ij.*, o.slug as org_slug, o.name as org_name
       FROM import_jobs ij
       LEFT JOIN organizations o ON ij.org_id = o.id
       WHERE ij.id = $1 AND ij.user_id = $2`,
      [job_id, userId]
    );

    if (jobResult.rows.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobResult.rows[0];

    // If job is completed, optionally include created container details
    let containers: Array<{
      id: string;
      container_id: string;
      name: string;
    }> = [];

    if (
      job.status === "completed" &&
      job.created_containers &&
      job.created_containers.length > 0
    ) {
      const containerResult = await pool.query(
        `SELECT id, container_id, data->>'name' as name
         FROM containers
         WHERE id = ANY($1)
         LIMIT 100`,
        [job.created_containers]
      );
      containers = containerResult.rows;
    }

    return NextResponse.json({
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        total_items: job.total_items,
        processed_items: job.processed_items,
        failed_items: job.failed_items,
        organization: job.org_id
          ? { slug: job.org_slug, name: job.org_name }
          : null,
        started_at: job.started_at,
        completed_at: job.completed_at,
        created_at: job.created_at,
        errors: job.errors,
      },
      containers:
        containers.length > 0 ? containers : undefined,
      progress:
        job.total_items > 0
          ? Math.round((job.processed_items / job.total_items) * 100)
          : 0,
    });
  } catch (error) {
    console.error("Error fetching import job:", error);
    return NextResponse.json(
      { error: "Failed to fetch import job" },
      { status: 500 }
    );
  }
}

// DELETE /api/import/[job_id] - Cancel/delete import job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  try {
    const { job_id } = await params;

    const userId = getUserIdFromToken(request.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get job
    const jobResult = await pool.query(
      "SELECT * FROM import_jobs WHERE id = $1 AND user_id = $2",
      [job_id, userId]
    );

    if (jobResult.rows.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobResult.rows[0];

    // Can only delete completed/failed jobs
    if (job.status === "processing") {
      return NextResponse.json(
        { error: "Cannot delete processing job" },
        { status: 400 }
      );
    }

    // Delete job (containers remain)
    await pool.query("DELETE FROM import_jobs WHERE id = $1", [job_id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting import job:", error);
    return NextResponse.json(
      { error: "Failed to delete import job" },
      { status: 500 }
    );
  }
}
