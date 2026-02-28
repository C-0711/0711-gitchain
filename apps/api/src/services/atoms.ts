/**
 * 0711-GitChain: Atom Service
 * 
 * THE STANDARD FOR ELECTRICAL INDUSTRY PRODUCT DATA (ETIM)
 * 
 * Manages DataAtoms - the smallest unit of data with full provenance.
 */

import { Pool, PoolClient } from 'pg';
import type {
  DataAtom,
  DataAtomSource,
  DataAtomCitation,
  DataAtomVerification,
  ContainerLayer,
  Contributor,
  TrustLevel,
  SourceType,
  InjectOptions,
  InjectResponse,
  ProductContainerManifest,
} from '@0711/core';
import { SOURCE_TO_TRUST, TRUST_PRIORITY } from '@0711/core';

// ============================================================================
// ATOM SERVICE
// ============================================================================

export class AtomService {
  constructor(private pool: Pool) {}

  // --------------------------------------------------------------------------
  // CONTRIBUTORS
  // --------------------------------------------------------------------------

  async registerContributor(contributor: Omit<Contributor, 'created_at' | 'stats'>): Promise<Contributor> {
    const result = await this.pool.query(
      `INSERT INTO contributors (id, name, role, organization, email, public_key, trust_modifier)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         organization = EXCLUDED.organization,
         email = EXCLUDED.email,
         updated_at = NOW()
       RETURNING *`,
      [
        contributor.id,
        contributor.name,
        contributor.role,
        contributor.organization,
        contributor.email,
        contributor.public_key,
        contributor.trust_modifier ?? 0,
      ]
    );
    
    return this.rowToContributor(result.rows[0]);
  }

  async getContributor(id: string): Promise<Contributor | null> {
    const result = await this.pool.query(
      'SELECT * FROM contributors WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.rowToContributor(result.rows[0]) : null;
  }

  // --------------------------------------------------------------------------
  // LAYERS
  // --------------------------------------------------------------------------

  async createLayer(
    containerId: string,
    layer: Omit<ContainerLayer, 'created_at' | 'updated_at' | 'atom_count' | 'verified_count'>
  ): Promise<ContainerLayer> {
    const result = await this.pool.query(
      `INSERT INTO container_layers 
       (id, container_id, name, type, contributor_id, trust_level, requires_verification, schema_version, description, commit_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        layer.id,
        containerId,
        layer.name,
        layer.type,
        layer.contributor_id,
        layer.trust_level,
        layer.requires_verification,
        layer.schema_version,
        layer.description,
        layer.commit,
      ]
    );
    
    return this.rowToLayer(result.rows[0]);
  }

  async getContainerLayers(containerId: string): Promise<ContainerLayer[]> {
    const result = await this.pool.query(
      `SELECT * FROM container_layers 
       WHERE container_id = $1 
       ORDER BY id`,
      [containerId]
    );
    return result.rows.map(row => this.rowToLayer(row));
  }

  // --------------------------------------------------------------------------
  // ATOMS - CRUD
  // --------------------------------------------------------------------------

  async createAtom<T>(
    containerId: string,
    fieldPath: string,
    value: T,
    source: DataAtomSource,
    commitHash: string,
    options?: {
      fieldName?: string;
      unit?: string;
      lang?: string;
      citation?: DataAtomCitation;
    }
  ): Promise<DataAtom<T>> {
    const trustLevel = SOURCE_TO_TRUST[source.type];
    const valueType = this.getValueType(value);
    
    const result = await this.pool.query(
      `INSERT INTO container_atoms (
        container_id, layer_id, field_path, field_name,
        value, value_type, unit, lang,
        source_type, contributor_id, trust_level, commit_hash,
        citation_document, citation_page, citation_section, citation_excerpt,
        citation_confidence, citation_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        containerId,
        source.layer_id,
        fieldPath,
        options?.fieldName,
        JSON.stringify(value),
        valueType,
        options?.unit,
        options?.lang,
        source.type,
        source.contributor_id,
        trustLevel,
        commitHash,
        options?.citation?.document,
        options?.citation?.page,
        options?.citation?.section,
        options?.citation?.excerpt,
        options?.citation?.confidence,
        options?.citation?.method,
      ]
    );
    
    return this.rowToAtom<T>(result.rows[0]);
  }

  async createAtomsBatch(
    containerId: string,
    atoms: Array<{
      fieldPath: string;
      value: unknown;
      source: DataAtomSource;
      unit?: string;
      lang?: string;
      citation?: DataAtomCitation;
    }>,
    commitHash: string
  ): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      let count = 0;
      for (const atom of atoms) {
        await client.query(
          `INSERT INTO container_atoms (
            container_id, layer_id, field_path,
            value, value_type, unit, lang,
            source_type, contributor_id, trust_level, commit_hash,
            citation_document, citation_page, citation_excerpt, citation_confidence
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            containerId,
            atom.source.layer_id,
            atom.fieldPath,
            JSON.stringify(atom.value),
            this.getValueType(atom.value),
            atom.unit,
            atom.lang,
            atom.source.type,
            atom.source.contributor_id,
            SOURCE_TO_TRUST[atom.source.type],
            commitHash,
            atom.citation?.document,
            atom.citation?.page,
            atom.citation?.excerpt,
            atom.citation?.confidence,
          ]
        );
        count++;
      }
      
      await client.query('COMMIT');
      return count;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAtom(containerId: string, fieldPath: string): Promise<DataAtom | null> {
    // Get the winning atom (highest trust level)
    const result = await this.pool.query(
      `SELECT * FROM container_atoms
       WHERE container_id = $1 AND field_path = $2 AND is_current = true
       ORDER BY 
         CASE trust_level
           WHEN 'highest' THEN 1
           WHEN 'high' THEN 2
           WHEN 'certified' THEN 3
           WHEN 'verified' THEN 4
           WHEN 'medium' THEN 5
           WHEN 'customer' THEN 6
           WHEN 'generated' THEN 7
           WHEN 'community' THEN 8
         END,
         created_at DESC
       LIMIT 1`,
      [containerId, fieldPath]
    );
    
    return result.rows[0] ? this.rowToAtom(result.rows[0]) : null;
  }

  async getAllAtoms(
    containerId: string,
    options?: {
      layerId?: string;
      trustMin?: TrustLevel;
      verifiedOnly?: boolean;
      fields?: string[];
    }
  ): Promise<Record<string, DataAtom>> {
    let query = `
      SELECT DISTINCT ON (field_path) *
      FROM container_atoms
      WHERE container_id = $1 AND is_current = true
    `;
    const params: unknown[] = [containerId];
    let paramIndex = 2;
    
    if (options?.layerId) {
      query += ` AND layer_id = $${paramIndex++}`;
      params.push(options.layerId);
    }
    
    if (options?.trustMin) {
      const maxPriority = TRUST_PRIORITY[options.trustMin];
      query += ` AND CASE trust_level
        WHEN 'highest' THEN 1 WHEN 'high' THEN 2 WHEN 'certified' THEN 3
        WHEN 'verified' THEN 4 WHEN 'medium' THEN 5 WHEN 'customer' THEN 6
        WHEN 'generated' THEN 7 WHEN 'community' THEN 8 END <= $${paramIndex++}`;
      params.push(maxPriority);
    }
    
    if (options?.verifiedOnly) {
      query += ' AND verified_by IS NOT NULL';
    }
    
    if (options?.fields && options.fields.length > 0) {
      query += ` AND field_path = ANY($${paramIndex++})`;
      params.push(options.fields);
    }
    
    query += ` ORDER BY field_path, 
      CASE trust_level
        WHEN 'highest' THEN 1 WHEN 'high' THEN 2 WHEN 'certified' THEN 3
        WHEN 'verified' THEN 4 WHEN 'medium' THEN 5 WHEN 'customer' THEN 6
        WHEN 'generated' THEN 7 WHEN 'community' THEN 8 END,
      created_at DESC`;
    
    const result = await this.pool.query(query, params);
    
    const atoms: Record<string, DataAtom> = {};
    for (const row of result.rows) {
      atoms[row.field_path] = this.rowToAtom(row);
    }
    return atoms;
  }

  // --------------------------------------------------------------------------
  // VERIFICATION
  // --------------------------------------------------------------------------

  async verifyAtom(
    atomId: string,
    verification: DataAtomVerification
  ): Promise<DataAtom> {
    const result = await this.pool.query(
      `UPDATE container_atoms
       SET verified_by = $2,
           verified_at = $3,
           verification_method = $4,
           verification_notes = $5,
           trust_level = CASE 
             WHEN source_type = 'ai_generated' THEN 'verified'::trust_level
             ELSE trust_level
           END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        atomId,
        verification.verified_by,
        verification.verified_at,
        verification.method,
        verification.notes,
      ]
    );
    
    if (!result.rows[0]) {
      throw new Error(`Atom not found: ${atomId}`);
    }
    
    return this.rowToAtom(result.rows[0]);
  }

  // --------------------------------------------------------------------------
  // INJECT API
  // --------------------------------------------------------------------------

  async inject(
    containerId: string,
    options: InjectOptions = {}
  ): Promise<InjectResponse> {
    const startTime = Date.now();
    
    // Get container metadata
    const containerResult = await this.pool.query(
      `SELECT c.*, ba.tx_hash, ba.block_number, ba.network, ba.anchored_at
       FROM containers c
       LEFT JOIN container_anchors ca ON c.id = ca.container_id AND ca.version = c.version
       LEFT JOIN blockchain_batches ba ON ca.batch_id = ba.id
       WHERE c.id = $1`,
      [containerId]
    );
    
    if (!containerResult.rows[0]) {
      throw new Error(`Container not found: ${containerId}`);
    }
    
    const container = containerResult.rows[0];
    
    // Get all current atoms with filters
    const atoms = await this.getAllAtoms(containerId, {
      trustMin: options.trust_min,
      verifiedOnly: options.verified_only,
      fields: options.fields,
    });
    
    // Get layers
    const layers = await this.getContainerLayers(containerId);
    
    // Get contributor summary
    const contributorResult = await this.pool.query(
      `SELECT 
         contributor_id,
         c.role,
         COUNT(*) as atom_count,
         COUNT(*) FILTER (WHERE verified_by IS NOT NULL) as verified_count
       FROM container_atoms ca
       JOIN contributors c ON ca.contributor_id = c.id
       WHERE ca.container_id = $1 AND ca.is_current = true
       GROUP BY contributor_id, c.role`,
      [containerId]
    );
    
    // Format response based on options
    let data: Record<string, unknown>;
    if (options.format === 'values_only') {
      data = {};
      for (const [key, atom] of Object.entries(atoms)) {
        data[key] = atom.value;
      }
    } else if (options.format === 'citations_only') {
      data = {};
      for (const [key, atom] of Object.entries(atoms)) {
        if (atom.citation) {
          data[key] = {
            value: atom.value,
            citation: atom.citation,
          };
        }
      }
    } else {
      data = atoms;
    }
    
    // Build response
    const response: InjectResponse = {
      container: {
        id: container.container_id,
        version: container.version,
        type: container.type,
      },
      anchor: {
        verified: !!container.tx_hash,
        tx_hash: container.tx_hash,
        block_number: container.block_number,
        network: container.network,
        timestamp: container.anchored_at,
      },
      data: data as Record<string, DataAtom>,
      layers_applied: layers.map(l => l.id),
      contributors: contributorResult.rows.map(row => ({
        id: row.contributor_id,
        role: row.role,
        atoms: parseInt(row.atom_count),
        verified: parseInt(row.verified_count),
      })),
      meta: {
        requested_at: new Date().toISOString(),
        processing_ms: Date.now() - startTime,
        cache_hit: false,
      },
    };
    
    // Add history if requested
    if (options.include_history) {
      const historyResult = await this.pool.query(
        `SELECT * FROM container_commits
         WHERE container_id = $1
         ORDER BY version DESC
         LIMIT $2`,
        [containerId, options.history_limit ?? 10]
      );
      
      response.history = {
        total_commits: historyResult.rowCount ?? 0,
        recent: historyResult.rows.map(row => ({
          version: row.version,
          commit: row.commit_hash,
          author: row.author_id,
          message: row.message,
          timestamp: row.created_at,
        })),
      };
    }
    
    return response;
  }

  // --------------------------------------------------------------------------
  // PRODUCT MANIFEST
  // --------------------------------------------------------------------------

  async getProductManifest(containerId: string): Promise<ProductContainerManifest> {
    const containerResult = await this.pool.query(
      `SELECT 
         c.*,
         pi.snr, pi.manufacturer, pi.gtin, pi.manufacturer_aid,
         pi.etim_class_code, pi.etim_class_name, pi.etim_version,
         ba.tx_hash, ba.block_number, ba.network, ba.anchored_at
       FROM containers c
       LEFT JOIN product_identity pi ON c.id = pi.container_id
       LEFT JOIN container_anchors ca ON c.id = ca.container_id AND ca.version = c.version
       LEFT JOIN blockchain_batches ba ON ca.batch_id = ba.id
       WHERE c.id = $1`,
      [containerId]
    );
    
    if (!containerResult.rows[0]) {
      throw new Error(`Container not found: ${containerId}`);
    }
    
    const c = containerResult.rows[0];
    
    // Get layers
    const layers = await this.getContainerLayers(containerId);
    
    // Get contributors
    const contributorResult = await this.pool.query(
      `SELECT 
         contributor_id as id,
         co.role,
         COUNT(*) as atom_count,
         MIN(ca.created_at) as first_contribution,
         MAX(ca.created_at) as last_contribution
       FROM container_atoms ca
       JOIN contributors co ON ca.contributor_id = co.id
       WHERE ca.container_id = $1
       GROUP BY contributor_id, co.role`,
      [containerId]
    );
    
    // Get stats
    const statsResult = await this.pool.query(
      `SELECT 
         COUNT(*) as total_atoms,
         COUNT(*) FILTER (WHERE verified_by IS NOT NULL) as verified_atoms,
         COUNT(DISTINCT layer_id) as total_layers,
         COUNT(DISTINCT contributor_id) as total_contributors,
         COUNT(DISTINCT commit_hash) as total_commits,
         COUNT(*) FILTER (WHERE citation_document IS NOT NULL) as total_citations
       FROM container_atoms
       WHERE container_id = $1 AND is_current = true`,
      [containerId]
    );
    
    const stats = statsResult.rows[0];
    
    // Count ETIM features
    const etimResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM etim_features ef
       JOIN container_atoms ca ON ef.atom_id = ca.id
       WHERE ca.container_id = $1`,
      [containerId]
    );
    
    const manifest: ProductContainerManifest = {
      id: c.container_id,
      version: c.version,
      type: 'product',
      created_at: c.created_at,
      updated_at: c.updated_at,
      identity: {
        snr: c.snr,
        manufacturer: c.manufacturer,
        gtin: c.gtin,
        manufacturer_aid: c.manufacturer_aid,
      },
      etim: c.etim_class_code ? {
        class_code: c.etim_class_code,
        class_name: c.etim_class_name,
        version: c.etim_version,
        feature_count: parseInt(etimResult.rows[0].count),
      } : undefined,
      layers,
      contributors: contributorResult.rows.map(row => ({
        id: row.id,
        role: row.role,
        atom_count: parseInt(row.atom_count),
        first_contribution: row.first_contribution,
        last_contribution: row.last_contribution,
      })),
      anchor: c.tx_hash ? {
        tx_hash: c.tx_hash,
        block_number: c.block_number,
        network: c.network,
        timestamp: c.anchored_at,
      } : undefined,
      stats: {
        total_atoms: parseInt(stats.total_atoms),
        verified_atoms: parseInt(stats.verified_atoms),
        total_layers: parseInt(stats.total_layers),
        total_contributors: parseInt(stats.total_contributors),
        total_commits: parseInt(stats.total_commits),
        total_citations: parseInt(stats.total_citations),
      },
    };
    
    return manifest;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private getValueType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private rowToAtom<T = unknown>(row: Record<string, unknown>): DataAtom<T> {
    return {
      value: row.value as T,
      unit: row.unit as string | undefined,
      lang: row.lang as string | undefined,
      source: {
        type: row.source_type as SourceType,
        contributor_id: row.contributor_id as string,
        layer_id: row.layer_id as string,
      },
      trust: row.trust_level as TrustLevel,
      commit: row.commit_hash as string,
      created_at: (row.created_at as Date).toISOString(),
      updated_at: row.updated_at ? (row.updated_at as Date).toISOString() : undefined,
      citation: row.citation_document ? {
        document: row.citation_document as string,
        page: row.citation_page as number | undefined,
        section: row.citation_section as string | undefined,
        excerpt: row.citation_excerpt as string | undefined,
        confidence: parseFloat(row.citation_confidence as string),
        method: row.citation_method as DataAtomCitation['method'],
      } : undefined,
      verification: row.verified_by ? {
        verified_by: row.verified_by as string,
        verified_at: (row.verified_at as Date).toISOString(),
        method: row.verification_method as DataAtomVerification['method'],
        notes: row.verification_notes as string | undefined,
      } : undefined,
    };
  }

  private rowToLayer(row: Record<string, unknown>): ContainerLayer {
    return {
      id: row.id as string,
      name: row.name as string,
      type: row.type as SourceType,
      contributor_id: row.contributor_id as string,
      trust_level: row.trust_level as TrustLevel,
      requires_verification: row.requires_verification as boolean,
      commit: row.commit_hash as string,
      created_at: (row.created_at as Date).toISOString(),
      updated_at: (row.updated_at as Date).toISOString(),
      atom_count: row.atom_count as number,
      verified_count: row.verified_count as number,
      description: row.description as string | undefined,
      schema_version: row.schema_version as string | undefined,
    };
  }

  private rowToContributor(row: Record<string, unknown>): Contributor {
    return {
      id: row.id as string,
      name: row.name as string,
      role: row.role as Contributor['role'],
      organization: row.organization as string | undefined,
      email: row.email as string | undefined,
      public_key: row.public_key as string | undefined,
      created_at: (row.created_at as Date).toISOString(),
      stats: {
        total_contributions: row.total_contributions as number,
        verified_contributions: row.verified_contributions as number,
        containers_contributed_to: row.containers_contributed_to as number,
      },
      trust_modifier: row.trust_modifier as number | undefined,
    };
  }
}
