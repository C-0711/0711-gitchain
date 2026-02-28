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
 * GET /api/webhooks/:id
 * Get a single webhook with recent deliveries
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

    const webhookId = params.id;

    // Get webhook and verify access
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
         w.container_id,
         w.org_id,
         c.owner_id as container_owner,
         c.identifier as container_identifier
       FROM webhooks w
       LEFT JOIN containers c ON w.container_id = c.id
       WHERE w.id = $1`,
      [webhookId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const webhook = result.rows[0];

    // Check access
    if (webhook.container_id) {
      const hasAccess = await pool.query(
        `SELECT 1 FROM container_collaborators
         WHERE container_id = $1 AND user_id = $2 AND role = 'maintainer'
         UNION
         SELECT 1 WHERE $3 = $2`,
        [webhook.container_id, userId, webhook.container_owner]
      );

      if (hasAccess.rows.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get recent deliveries
    const deliveries = await pool.query(
      `SELECT
         id,
         event,
         status,
         response_code,
         duration_ms,
         attempt,
         delivered_at,
         created_at
       FROM webhook_deliveries
       WHERE webhook_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [webhookId]
    );

    return NextResponse.json({
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      contentType: webhook.content_type,
      events: webhook.events,
      sslVerification: webhook.ssl_verification,
      active: webhook.active,
      lastDeliveryAt: webhook.last_delivery_at,
      lastResponseCode: webhook.last_response_code,
      consecutiveFailures: webhook.consecutive_failures,
      createdAt: webhook.created_at,
      containerId: webhook.container_id,
      containerIdentifier: webhook.container_identifier,
      recentDeliveries: deliveries.rows.map((d) => ({
        id: d.id,
        event: d.event,
        status: d.status,
        responseCode: d.response_code,
        durationMs: d.duration_ms,
        attempt: d.attempt,
        deliveredAt: d.delivered_at,
        createdAt: d.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/webhooks/:id
 * Update a webhook
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const webhookId = params.id;
    const body = await req.json();
    const { name, url, events, contentType, sslVerification, active, regenerateSecret } = body;

    // Get webhook and verify access
    const existing = await pool.query(
      `SELECT w.id, w.container_id, w.org_id, c.owner_id as container_owner
       FROM webhooks w
       LEFT JOIN containers c ON w.container_id = c.id
       WHERE w.id = $1`,
      [webhookId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const webhook = existing.rows[0];

    // Check access
    if (webhook.container_id) {
      const hasAccess = await pool.query(
        `SELECT 1 FROM container_collaborators
         WHERE container_id = $1 AND user_id = $2 AND role = 'maintainer'
         UNION
         SELECT 1 WHERE $3 = $2`,
        [webhook.container_id, userId, webhook.container_owner]
      );

      if (hasAccess.rows.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Validate events if provided
    if (events) {
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
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }
    }

    // Build update
    const updates: string[] = [];
    const values: (string | string[] | boolean | null)[] = [];
    let paramIndex = 1;
    let newSecret: string | null = null;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      values.push(url);
    }
    if (events !== undefined) {
      updates.push(`events = $${paramIndex++}`);
      values.push(events);
    }
    if (contentType !== undefined) {
      updates.push(`content_type = $${paramIndex++}`);
      values.push(contentType);
    }
    if (sslVerification !== undefined) {
      updates.push(`ssl_verification = $${paramIndex++}`);
      values.push(sslVerification);
    }
    if (active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      values.push(active);
      if (active) {
        updates.push(`consecutive_failures = 0`);
      }
    }
    if (regenerateSecret) {
      newSecret = crypto.randomBytes(32).toString("hex");
      const secretHash = crypto.createHash("sha256").update(newSecret).digest("hex");
      updates.push(`secret_hash = $${paramIndex++}`);
      values.push(secretHash);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    values.push(webhookId);

    const result = await pool.query(
      `UPDATE webhooks
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, name, url, events, content_type, ssl_verification, active, updated_at`,
      values
    );

    const response: Record<string, unknown> = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      url: result.rows[0].url,
      events: result.rows[0].events,
      contentType: result.rows[0].content_type,
      sslVerification: result.rows[0].ssl_verification,
      active: result.rows[0].active,
      updatedAt: result.rows[0].updated_at,
    };

    if (newSecret) {
      response.secret = newSecret;
      response.warning = "Make sure to copy your new webhook secret now. You won't be able to see it again!";
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const webhookId = params.id;

    // Get webhook and verify access
    const existing = await pool.query(
      `SELECT w.id, w.container_id, w.org_id, c.owner_id as container_owner
       FROM webhooks w
       LEFT JOIN containers c ON w.container_id = c.id
       WHERE w.id = $1`,
      [webhookId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const webhook = existing.rows[0];

    // Check access
    if (webhook.container_id) {
      const hasAccess = await pool.query(
        `SELECT 1 FROM container_collaborators
         WHERE container_id = $1 AND user_id = $2 AND role = 'maintainer'
         UNION
         SELECT 1 WHERE $3 = $2`,
        [webhook.container_id, userId, webhook.container_owner]
      );

      if (hasAccess.rows.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await pool.query(`DELETE FROM webhooks WHERE id = $1`, [webhookId]);

    return NextResponse.json({ message: "Webhook deleted" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
