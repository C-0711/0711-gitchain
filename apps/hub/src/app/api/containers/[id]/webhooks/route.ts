import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";
import crypto from "crypto";

const VALID_EVENTS = [
  "container.created",
  "container.updated",
  "container.deleted",
  "atom.created",
  "atom.updated",
  "atom.certified",
  "batch.submitted",
  "batch.anchored",
  "member.added",
  "member.removed",
  "member.role_changed",
  "pr.opened",
  "pr.closed",
  "pr.merged",
] as const;

/**
 * GET /api/containers/:id/webhooks
 * List webhooks for a container
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const containerId = decodeURIComponent(params.id);

    // Resolve container and check permissions
    const container = await pool.query(
      `SELECT c.id, c.owner_id
       FROM containers c
       WHERE (c.id::text = $1 OR c.identifier = $1) AND c.deleted_at IS NULL`,
      [containerId]
    );

    if (container.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const containerUuid = container.rows[0].id;

    // Check if user has maintainer access
    const hasAccess = await pool.query(
      `SELECT 1 FROM container_collaborators
       WHERE container_id = $1 AND user_id = $2 AND role = 'maintainer'
       UNION
       SELECT 1 WHERE $3 = $2`,
      [containerUuid, userId, container.rows[0].owner_id]
    );

    if (hasAccess.rows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get webhooks
    const result = await pool.query(
      `SELECT
         w.id,
         w.name,
         w.url,
         w.content_type,
         w.events,
         w.ssl_verification,
         w.active,
         w.last_delivery_at,
         w.last_response_code,
         w.consecutive_failures,
         w.created_at,
         u.username as created_by_username
       FROM webhooks w
       LEFT JOIN users u ON w.created_by = u.id
       WHERE w.container_id = $1
       ORDER BY w.created_at DESC`,
      [containerUuid]
    );

    return NextResponse.json({
      webhooks: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        url: row.url,
        contentType: row.content_type,
        events: row.events,
        sslVerification: row.ssl_verification,
        active: row.active,
        lastDeliveryAt: row.last_delivery_at,
        lastResponseCode: row.last_response_code,
        consecutiveFailures: row.consecutive_failures,
        createdAt: row.created_at,
        createdBy: row.created_by_username,
      })),
    });
  } catch (error) {
    console.error("Error listing webhooks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/containers/:id/webhooks
 * Create a new webhook for a container
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const containerId = decodeURIComponent(params.id);
    const body = await req.json();
    const { name, url, events, contentType, sslVerification } = body;

    // Validate inputs
    if (!name || typeof name !== "string" || name.length < 1 || name.length > 255) {
      return NextResponse.json(
        { error: "Name is required and must be 1-255 characters" },
        { status: 400 }
      );
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "At least one event is required" },
        { status: 400 }
      );
    }

    const invalidEvents = events.filter((e) => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(", ")}` },
        { status: 400 }
      );
    }

    // Resolve container and check permissions
    const container = await pool.query(
      `SELECT c.id, c.owner_id
       FROM containers c
       WHERE (c.id::text = $1 OR c.identifier = $1) AND c.deleted_at IS NULL`,
      [containerId]
    );

    if (container.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const containerUuid = container.rows[0].id;

    // Check if user has maintainer access
    const hasAccess = await pool.query(
      `SELECT 1 FROM container_collaborators
       WHERE container_id = $1 AND user_id = $2 AND role = 'maintainer'
       UNION
       SELECT 1 WHERE $3 = $2`,
      [containerUuid, userId, container.rows[0].owner_id]
    );

    if (hasAccess.rows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate secret
    const secret = crypto.randomBytes(32).toString("hex");
    const secretHash = crypto.createHash("sha256").update(secret).digest("hex");

    // Create webhook
    const result = await pool.query(
      `INSERT INTO webhooks (
         container_id,
         name,
         url,
         secret_hash,
         content_type,
         events,
         ssl_verification,
         created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [
        containerUuid,
        name,
        url,
        secretHash,
        contentType || "application/json",
        events,
        sslVerification !== false,
        userId,
      ]
    );

    return NextResponse.json({
      id: result.rows[0].id,
      name,
      url,
      secret, // Only returned once!
      events,
      contentType: contentType || "application/json",
      sslVerification: sslVerification !== false,
      active: true,
      createdAt: result.rows[0].created_at,
      warning: "Make sure to copy your webhook secret now. You won't be able to see it again!",
    });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
