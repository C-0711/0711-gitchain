import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// Track server start time
const serverStartTime = Date.now();

/**
 * GET /api/health
 * Health check endpoint for load balancers and container orchestration.
 */
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};
  let healthy = true;

  // Check database connection
  try {
    await pool.query("SELECT 1");
    checks.database = "ok";
  } catch (error) {
    checks.database = "error";
    healthy = false;
  }

  const response = {
    status: healthy ? "ok" : "degraded",
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(response, {
    status: healthy ? 200 : 503,
  });
}
