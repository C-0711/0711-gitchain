import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5440,
  database: 'gitchain',
  user: 'gitchain',
  password: 'gitchain2026',
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const containerId = decodeURIComponent(params.id);

  try {
    // Get container with product identity
    const containerResult = await pool.query(`
      SELECT c.*, pi.snr, pi.manufacturer, pi.etim_class_code, pi.etim_class_name
      FROM containers c
      LEFT JOIN product_identity pi ON c.id = pi.container_id
      WHERE c.container_id = $1
    `, [containerId]);

    if (!containerResult.rows[0]) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    const container = containerResult.rows[0];

    // Get atoms grouped by category
    const atomsResult = await pool.query(`
      SELECT
        field_path,
        field_name,
        value,
        unit,
        source_type,
        contributor_id,
        trust_level,
        citation_document,
        citation_confidence,
        citation_page,
        citation_excerpt,
        commit_hash
      FROM container_atoms
      WHERE container_id = $1 AND is_current = true
      ORDER BY field_path
    `, [container.id]);

    // Organize atoms into file-like structure
    const files: Record<string, any> = {};

    for (const atom of atomsResult.rows) {
      const parts = atom.field_path.split('.');
      const category = parts[0];
      const fieldName = parts.slice(1).join('.') || atom.field_name;

      if (!files[category]) {
        files[category] = {
          name: `${category}.json`,
          path: `specs/${category}.json`,
          type: 'file',
          atoms: [],
        };
      }

      let parsedValue = atom.value;
      try {
        parsedValue = JSON.parse(atom.value);
      } catch {
        // Keep as-is
      }

      files[category].atoms.push({
        field: fieldName,
        name: atom.field_name,
        value: parsedValue,
        unit: atom.unit,
        source: atom.source_type,
        contributor: atom.contributor_id,
        trust: atom.trust_level,
        citation: atom.citation_document ? {
          document: atom.citation_document,
          confidence: parseFloat(atom.citation_confidence) || 0,
          page: atom.citation_page,
          excerpt: atom.citation_excerpt,
        } : null,
      });
    }

    // Get layers
    const layersResult = await pool.query(`
      SELECT id, name, type, contributor_id, trust_level, atom_count
      FROM container_layers
      WHERE container_id = $1
      ORDER BY id
    `, [container.id]);

    // Get contributors
    const contributorsResult = await pool.query(`
      SELECT contributor_id, source_type, COUNT(*)::int as count
      FROM container_atoms
      WHERE container_id = $1
      GROUP BY contributor_id, source_type
    `, [container.id]);

    // Get commits
    const commitsResult = await pool.query(`
      SELECT commit_hash, message, author, created_at, version
      FROM container_commits
      WHERE container_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [container.id]).catch(() => ({ rows: [] }));

    // Get chain anchor
    const anchorResult = await pool.query(`
      SELECT ca.*, bb.tx_hash, bb.network, bb.block_number
      FROM container_anchors ca
      LEFT JOIN blockchain_batches bb ON ca.batch_id = bb.id
      WHERE ca.container_id = $1
      ORDER BY ca.created_at DESC
      LIMIT 1
    `, [container.id]).catch(() => ({ rows: [] }));

    const data = container.data || {};
    const anchor = anchorResult.rows[0];

    return NextResponse.json({
      id: container.container_id,
      name: data.name || container.identifier,
      description: data.description || '',
      version: container.version,
      type: container.type,
      namespace: container.namespace,
      identifier: container.identifier,
      snr: container.snr || container.identifier,
      manufacturer: container.manufacturer || container.namespace,
      isVerified: container.is_verified,
      etim: container.etim_class_code ? {
        class_code: container.etim_class_code,
        class_name: container.etim_class_name,
      } : (data.etim_class ? {
        class_code: data.etim_class,
        class_name: data.etim_class_name || '',
      } : null),
      files: Object.values(files),
      layers: layersResult.rows,
      contributors: contributorsResult.rows,
      commits: commitsResult.rows.map((c: any) => ({
        hash: c.commit_hash,
        message: c.message,
        author: c.author,
        timestamp: c.created_at,
        version: c.version,
      })),
      stats: {
        totalAtoms: atomsResult.rowCount || 0,
        categories: Object.keys(files).length,
      },
      createdAt: container.created_at,
      updatedAt: container.updated_at,
      chainAnchor: anchor ? {
        txHash: anchor.tx_hash,
        network: anchor.network,
        blockNumber: anchor.block_number,
        batchId: anchor.batch_id,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching container:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
