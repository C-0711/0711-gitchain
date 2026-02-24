import { NextRequest, NextResponse } from "next/server";
import { pool, getUserIdFromToken } from "@/lib/db";

// Helper to check if user can manage container access
async function canManageAccess(
  userId: string,
  containerId: string
): Promise<boolean> {
  // Check if user is container owner
  const containerResult = await pool.query(
    "SELECT created_by, org_id FROM containers WHERE id = $1 AND deleted_at IS NULL",
    [containerId]
  );

  if (containerResult.rows.length === 0) {
    return false;
  }

  const container = containerResult.rows[0];

  // Owner can always manage
  if (container.created_by === userId) {
    return true;
  }

  // Check if user is admin collaborator
  const collabResult = await pool.query(
    "SELECT role FROM container_collaborators WHERE container_id = $1 AND user_id = $2",
    [containerId, userId]
  );

  if (collabResult.rows.length > 0 && collabResult.rows[0].role === "admin") {
    return true;
  }

  // Check if user is org admin (if container belongs to org)
  if (container.org_id) {
    const orgResult = await pool.query(
      "SELECT user_has_org_role($1, $2, 'admin') as is_admin",
      [userId, container.org_id]
    );
    if (orgResult.rows[0]?.is_admin) {
      return true;
    }
  }

  return false;
}

// GET /api/containers/[id]/access - List access grants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get container (support both UUID and container_id string)
    let containerId = id;
    if (!id.match(/^[0-9a-f-]{36}$/i)) {
      const containerResult = await pool.query(
        "SELECT id FROM containers WHERE container_id = $1 AND deleted_at IS NULL",
        [id]
      );
      if (containerResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Container not found" },
          { status: 404 }
        );
      }
      containerId = containerResult.rows[0].id;
    }

    // Get user collaborators
    const collaboratorsResult = await pool.query(
      `SELECT cc.*, u.email, u.name, u.username, u.avatar_url
       FROM container_collaborators cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.container_id = $1
       ORDER BY cc.created_at`,
      [containerId]
    );

    // Get team access
    const teamAccessResult = await pool.query(
      `SELECT tca.*, t.name as team_name, t.slug as team_slug
       FROM team_container_access tca
       JOIN organization_teams t ON tca.team_id = t.id
       WHERE tca.container_id = $1
       ORDER BY tca.created_at`,
      [containerId]
    );

    return NextResponse.json({
      collaborators: collaboratorsResult.rows,
      teams: teamAccessResult.rows,
    });
  } catch (error) {
    console.error("Error fetching container access:", error);
    return NextResponse.json(
      { error: "Failed to fetch container access" },
      { status: 500 }
    );
  }
}

// POST /api/containers/[id]/access - Grant access
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, team_id, role } = body;

    if (!user_id && !team_id) {
      return NextResponse.json(
        { error: "user_id or team_id is required" },
        { status: 400 }
      );
    }

    // Get user from auth
    const actorId = getUserIdFromToken(request.headers.get("authorization"));
    if (!actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get container UUID
    let containerId = id;
    if (!id.match(/^[0-9a-f-]{36}$/i)) {
      const containerResult = await pool.query(
        "SELECT id FROM containers WHERE container_id = $1 AND deleted_at IS NULL",
        [id]
      );
      if (containerResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Container not found" },
          { status: 404 }
        );
      }
      containerId = containerResult.rows[0].id;
    }

    // Check if user can manage access
    const canManage = await canManageAccess(actorId, containerId);
    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to manage container access" },
        { status: 403 }
      );
    }

    if (user_id) {
      // Grant user access
      const accessResult = await pool.query(
        `INSERT INTO container_collaborators (container_id, user_id, role, invited_by, accepted_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (container_id, user_id) DO UPDATE SET role = $3
         RETURNING *`,
        [containerId, user_id, role || "read", actorId]
      );

      // Get user info
      const userResult = await pool.query(
        "SELECT email, name, username, avatar_url FROM users WHERE id = $1",
        [user_id]
      );

      return NextResponse.json(
        {
          access: {
            ...accessResult.rows[0],
            ...userResult.rows[0],
          },
        },
        { status: 201 }
      );
    }

    if (team_id) {
      // Grant team access
      const accessResult = await pool.query(
        `INSERT INTO team_container_access (team_id, container_id, role, granted_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (team_id, container_id) DO UPDATE SET role = $3
         RETURNING *`,
        [team_id, containerId, role || "viewer", actorId]
      );

      // Get team info
      const teamResult = await pool.query(
        "SELECT name, slug FROM organization_teams WHERE id = $1",
        [team_id]
      );

      return NextResponse.json(
        {
          access: {
            ...accessResult.rows[0],
            ...teamResult.rows[0],
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error granting container access:", error);
    return NextResponse.json(
      { error: "Failed to grant container access" },
      { status: 500 }
    );
  }
}

// DELETE /api/containers/[id]/access - Revoke access
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessId = searchParams.get("id");
    const accessType = searchParams.get("type") || "user"; // user or team

    if (!accessId) {
      return NextResponse.json(
        { error: "access id is required" },
        { status: 400 }
      );
    }

    // Get user from auth
    const actorId = getUserIdFromToken(request.headers.get("authorization"));
    if (!actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let containerId: string;

    if (accessType === "team") {
      // Get team access
      const accessResult = await pool.query(
        "SELECT * FROM team_container_access WHERE id = $1",
        [accessId]
      );

      if (accessResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Access grant not found" },
          { status: 404 }
        );
      }

      containerId = accessResult.rows[0].container_id;

      // Check permission
      const canManage = await canManageAccess(actorId, containerId);
      if (!canManage) {
        return NextResponse.json(
          { error: "You don't have permission to manage container access" },
          { status: 403 }
        );
      }

      // Delete access
      await pool.query("DELETE FROM team_container_access WHERE id = $1", [
        accessId,
      ]);
    } else {
      // Get user access
      const accessResult = await pool.query(
        "SELECT * FROM container_collaborators WHERE id = $1",
        [accessId]
      );

      if (accessResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Access grant not found" },
          { status: 404 }
        );
      }

      containerId = accessResult.rows[0].container_id;

      // Check permission (or user can remove themselves)
      const isSelf = accessResult.rows[0].user_id === actorId;
      const canManage = await canManageAccess(actorId, containerId);

      if (!isSelf && !canManage) {
        return NextResponse.json(
          { error: "You don't have permission to manage container access" },
          { status: 403 }
        );
      }

      // Delete access
      await pool.query("DELETE FROM container_collaborators WHERE id = $1", [
        accessId,
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking container access:", error);
    return NextResponse.json(
      { error: "Failed to revoke container access" },
      { status: 500 }
    );
  }
}
