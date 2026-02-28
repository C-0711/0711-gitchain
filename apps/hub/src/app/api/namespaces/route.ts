import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`
      SELECT 
        n.name,
        n.display_name,
        n.description,
        n.visibility,
        n.created_at,
        n.updated_at,
        COUNT(DISTINCT c.id)::int as container_count,
        COUNT(DISTINCT nm.user_id)::int as member_count,
        MAX(c.updated_at) as last_activity
      FROM namespaces n
      LEFT JOIN containers c ON c.namespace = n.name AND c.deleted_at IS NULL
      LEFT JOIN namespace_members nm ON nm.namespace_id = n.id
      GROUP BY n.id, n.name, n.display_name, n.description, n.visibility, n.created_at, n.updated_at
      ORDER BY last_activity DESC NULLS LAST, n.created_at DESC
    `);

    // Also get namespaces from containers that don't have namespace records
    const orphanResult = await pool.query(`
      SELECT 
        c.namespace as name,
        c.namespace as display_name,
        '' as description,
        'public' as visibility,
        MIN(c.created_at) as created_at,
        MAX(c.updated_at) as updated_at,
        COUNT(*)::int as container_count,
        0 as member_count,
        MAX(c.updated_at) as last_activity
      FROM containers c
      WHERE c.deleted_at IS NULL
        AND c.namespace NOT IN (SELECT name FROM namespaces)
      GROUP BY c.namespace
    `);

    const namespaces = [...result.rows, ...orphanResult.rows].map(row => ({
      name: row.name,
      displayName: row.display_name || row.name,
      description: row.description || '',
      visibility: row.visibility || 'public',
      containerCount: row.container_count || 0,
      memberCount: row.member_count || 0,
      lastActivity: row.last_activity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ namespaces });
  } catch (error) {
    console.error("Error fetching namespaces:", error);
    return NextResponse.json({ namespaces: [], error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayName, description, visibility = 'public' } = body;

    if (!name || !/^[a-z0-9-]+$/.test(name)) {
      return NextResponse.json(
        { error: "Invalid namespace name. Use lowercase letters, numbers, and hyphens only." },
        { status: 400 }
      );
    }

    const result = await pool.query(`
      INSERT INTO namespaces (name, display_name, description, visibility)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, display_name, description, visibility, created_at
    `, [name, displayName || name, description || '', visibility]);

    return NextResponse.json({ namespace: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating namespace:", error);
    if (error.code === '23505') {
      return NextResponse.json({ error: "Namespace already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create namespace" }, { status: 500 });
  }
}
