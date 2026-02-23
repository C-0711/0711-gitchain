import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5440,
  database: "gitchain",
  user: "gitchain",
  password: "gitchain2026",
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const containerId = decodeURIComponent(params.id);

  try {
    const parts = containerId.split(":");
    if (parts.length < 4) {
      return NextResponse.json({ error: "Invalid container ID" }, { status: 400 });
    }

    const namespace = parts[2];
    const identifier = parts[3];
    
    const currentResult = await pool.query(
      "SELECT id, container_id, version, is_verified, created_at, updated_at FROM containers WHERE namespace = $1 AND identifier = $2 AND deleted_at IS NULL ORDER BY version DESC",
      [namespace, identifier]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 });
    }

    const layersResult = await pool.query(
      "SELECT cl.id as layer_id, cl.name, cl.type, cl.contributor_id, cl.trust_level, cl.atom_count, cl.commit_hash, cl.created_at FROM container_layers cl JOIN containers c ON cl.container_id = c.id WHERE c.namespace = $1 AND c.identifier = $2 AND c.deleted_at IS NULL ORDER BY cl.created_at DESC",
      [namespace, identifier]
    );

    const versions = currentResult.rows.map(row => ({
      version: row.version,
      containerId: row.container_id,
      isVerified: row.is_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isCurrent: row.version === currentResult.rows[0].version,
    }));

    return NextResponse.json({
      versions,
      currentVersion: currentResult.rows[0].version,
      totalVersions: versions.length,
      layers: layersResult.rows.map(l => ({
        id: l.layer_id,
        name: l.name,
        type: l.type,
        contributor: l.contributor_id,
        trustLevel: l.trust_level,
        atomCount: l.atom_count,
        commitHash: l.commit_hash,
        createdAt: l.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}
