import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

/**
 * POST /api/containers/:id/fork
 * Fork a container to the current user's namespace
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
    const body = await req.json().catch(() => ({}));
    const { name, namespaceId } = body;

    // Get source container
    const sourceResult = await pool.query(
      `SELECT
         c.id,
         c.identifier,
         c.name,
         c.description,
         c.namespace_id,
         c.visibility,
         n.slug as namespace_slug
       FROM containers c
       LEFT JOIN namespaces n ON c.namespace_id = n.id
       WHERE (c.id::text = $1 OR c.identifier = $1) AND c.deleted_at IS NULL`,
      [containerId]
    );

    if (sourceResult.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const source = sourceResult.rows[0];

    // Check visibility - can only fork public containers or ones you have access to
    if (source.visibility === "private") {
      const hasAccess = await pool.query(
        `SELECT 1 FROM container_collaborators
         WHERE container_id = $1 AND user_id = $2`,
        [source.id, userId]
      );
      if (hasAccess.rows.length === 0) {
        return NextResponse.json({ error: "Container not found" }, { status: 404 });
      }
    }

    // Get user's default namespace (personal namespace)
    let targetNamespaceId = namespaceId;
    if (!targetNamespaceId) {
      const userNamespace = await pool.query(
        `SELECT id FROM namespaces WHERE owner_user_id = $1 LIMIT 1`,
        [userId]
      );
      if (userNamespace.rows.length === 0) {
        return NextResponse.json(
          { error: "No namespace available for fork" },
          { status: 400 }
        );
      }
      targetNamespaceId = userNamespace.rows[0].id;
    }

    // Verify namespace ownership
    const namespaceCheck = await pool.query(
      `SELECT id, slug FROM namespaces
       WHERE id = $1 AND (owner_user_id = $2 OR owner_org_id IN (
         SELECT org_id FROM organization_members WHERE user_id = $2 AND role IN ('owner', 'admin', 'editor')
       ))`,
      [targetNamespaceId, userId]
    );

    if (namespaceCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "You don't have permission to fork to this namespace" },
        { status: 403 }
      );
    }

    const targetNamespace = namespaceCheck.rows[0];

    // Generate fork name and identifier
    const forkName = name || source.name;
    const forkIdentifier = `${targetNamespace.slug}:${forkName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;

    // Check if identifier already exists
    const existingFork = await pool.query(
      `SELECT id FROM containers WHERE identifier = $1 AND deleted_at IS NULL`,
      [forkIdentifier]
    );

    if (existingFork.rows.length > 0) {
      return NextResponse.json(
        { error: "A container with this name already exists in your namespace" },
        { status: 409 }
      );
    }

    // Create the fork
    const forkResult = await pool.query(
      `INSERT INTO containers (
         identifier,
         name,
         description,
         namespace_id,
         owner_id,
         forked_from_id,
         visibility
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, identifier, name, created_at`,
      [
        forkIdentifier,
        forkName,
        source.description,
        targetNamespaceId,
        userId,
        source.id,
        "private", // Forks start as private
      ]
    );

    const fork = forkResult.rows[0];

    // Copy atoms from source container
    await pool.query(
      `INSERT INTO atoms (container_id, path, content_hash, content_type, content, metadata, created_by)
       SELECT $1, path, content_hash, content_type, content, metadata, $2
       FROM atoms
       WHERE container_id = $3`,
      [fork.id, userId, source.id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO activity_events (actor_id, event_type, target_type, target_id, container_id, metadata)
       VALUES ($1, 'container.forked', 'container', $2, $2, $3)`,
      [
        userId,
        fork.id,
        JSON.stringify({
          sourceId: source.id,
          sourceIdentifier: source.identifier,
          forkIdentifier: fork.identifier,
        }),
      ]
    );

    return NextResponse.json({
      id: fork.id,
      identifier: fork.identifier,
      name: fork.name,
      forkedFrom: {
        id: source.id,
        identifier: source.identifier,
        name: source.name,
      },
      createdAt: fork.created_at,
    });
  } catch (error) {
    console.error("Error forking container:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
