import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const namespaceName = params.name;

  try {
    // Get namespace info (or create virtual one from containers)
    let namespace = await pool.query(`
      SELECT 
        n.id,
        n.name,
        n.display_name,
        n.description,
        n.visibility,
        n.created_at,
        n.updated_at
      FROM namespaces n
      WHERE n.name = $1
    `, [namespaceName]);

    let namespaceData;
    if (namespace.rows.length === 0) {
      // Check if namespace exists via containers
      const containerCheck = await pool.query(`
        SELECT namespace FROM containers WHERE namespace = $1 LIMIT 1
      `, [namespaceName]);
      
      if (containerCheck.rows.length === 0) {
        return NextResponse.json({ error: "Namespace not found" }, { status: 404 });
      }

      namespaceData = {
        name: namespaceName,
        displayName: namespaceName,
        description: '',
        visibility: 'public',
        createdAt: null,
        updatedAt: null,
      };
    } else {
      const row = namespace.rows[0];
      namespaceData = {
        id: row.id,
        name: row.name,
        displayName: row.display_name || row.name,
        description: row.description || '',
        visibility: row.visibility || 'public',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    // Get containers in this namespace
    const containersResult = await pool.query(`
      SELECT
        c.id,
        c.container_id,
        c.type,
        c.namespace,
        c.identifier,
        c.version,
        c.data,
        c.is_verified,
        c.created_at,
        c.updated_at,
        (SELECT COUNT(*)::int FROM container_atoms ca WHERE ca.container_id = c.id AND ca.is_current = true) as atom_count
      FROM containers c
      WHERE c.namespace = $1 AND c.deleted_at IS NULL
      ORDER BY c.updated_at DESC
    `, [namespaceName]);

    const containers = containersResult.rows.map(row => {
      const data = row.data || {};
      return {
        id: row.container_id,
        uuid: row.id,
        type: row.type,
        namespace: row.namespace,
        identifier: row.identifier,
        version: row.version,
        name: data.name || row.identifier,
        description: data.description || '',
        isVerified: row.is_verified,
        stats: { atoms: row.atom_count || 0 },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    // Get members if namespace exists in DB
    let members: any[] = [];
    if (namespaceData.id) {
      const membersResult = await pool.query(`
        SELECT 
          nm.user_id,
          nm.role,
          nm.created_at,
          u.email,
          u.name as user_name
        FROM namespace_members nm
        LEFT JOIN users u ON u.id = nm.user_id
        WHERE nm.namespace_id = $1
      `, [namespaceData.id]);
      members = membersResult.rows;
    }

    // Get stats
    const stats = {
      containerCount: containers.length,
      memberCount: members.length,
      totalAtoms: containers.reduce((sum, c) => sum + (c.stats?.atoms || 0), 0),
      verifiedCount: containers.filter(c => c.isVerified).length,
    };

    return NextResponse.json({
      ...namespaceData,
      containers,
      members,
      stats,
    });
  } catch (error) {
    console.error("Error fetching namespace:", error);
    return NextResponse.json({ error: "Failed to fetch namespace" }, { status: 500 });
  }
}
