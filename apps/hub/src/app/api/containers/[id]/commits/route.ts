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
    // Get layers directly using a join
    const layersResult = await pool.query(`
      SELECT 
        cl.id as layer_id,
        cl.name,
        cl.type,
        cl.contributor_id,
        cl.trust_level,
        cl.atom_count,
        cl.commit_hash,
        cl.created_at
      FROM container_layers cl
      JOIN containers c ON cl.container_id = c.id
      WHERE c.container_id = \$1 AND c.deleted_at IS NULL
      ORDER BY cl.created_at ASC
    `, [containerId]);

    if (layersResult.rows.length === 0) {
      // Check if container exists
      const containerCheck = await pool.query(`
        SELECT id FROM containers WHERE container_id = \$1 AND deleted_at IS NULL
      `, [containerId]);

      if (containerCheck.rows.length === 0) {
        return NextResponse.json({ error: "Container not found" }, { status: 404 });
      }

      return NextResponse.json({ commits: [], source: 'none' });
    }

    const commits = layersResult.rows.map((layer, idx) => ({
      id: layer.layer_id,
      version: idx + 1,
      message: `${layer.name}`,
      hash: layer.commit_hash || `layer-${layer.layer_id}`,
      parentHash: idx > 0 ? (layersResult.rows[idx-1].commit_hash || `layer-${layersResult.rows[idx-1].layer_id}`) : null,
      author: layer.contributor_id,
      authorName: layer.contributor_id,
      createdAt: layer.created_at,
      isAnchored: false,
      txHash: null,
      blockNumber: null,
      network: null,
      layerInfo: {
        type: layer.type,
        trustLevel: layer.trust_level,
        atomCount: layer.atom_count,
      }
    }));

    return NextResponse.json({ commits: commits.reverse(), source: 'layers' });
  } catch (error) {
    console.error("Error fetching commits:", error);
    return NextResponse.json({ error: "Failed to fetch commits" }, { status: 500 });
  }
}
