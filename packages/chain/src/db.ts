/**
 * @0711/chain — Database Layer
 *
 * Persistent storage for manifests, batches, proofs, and audit logs.
 * Uses GitChain's PostgreSQL database (port 5440).
 */

import { Pool } from "pg";

// ============================================
// DATABASE CONNECTION
// ============================================

const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || "gitchain"}:${process.env.DB_PASSWORD || "gitchain2026"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5440"}/${process.env.DB_NAME || "gitchain"}`;

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ============================================
// SCHEMA INITIALIZATION
// ============================================

export async function initializeSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Content Manifests
      CREATE TABLE IF NOT EXISTS content_manifests (
        id SERIAL PRIMARY KEY,
        content_hash VARCHAR(64) NOT NULL UNIQUE,
        manifest_hash VARCHAR(64) NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        model_id VARCHAR(100),
        prompt_hash VARCHAR(64),
        operator_id VARCHAR(100),
        organization_id VARCHAR(100),
        execution_mode VARCHAR(20),
        provider VARCHAR(50),
        product_id VARCHAR(100),
        brand_id VARCHAR(50),
        manifest_data JSONB NOT NULL,
        compliance_data JSONB,
        ipfs_cid VARCHAR(100),
        batch_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Certification Batches
      CREATE TABLE IF NOT EXISTS certification_batches (
        id SERIAL PRIMARY KEY,
        batch_id INTEGER NOT NULL UNIQUE,
        merkle_root VARCHAR(128) NOT NULL,
        item_count INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        on_chain_batch_id INTEGER,
        tx_hash VARCHAR(66),
        block_number INTEGER,
        network VARCHAR(20) DEFAULT 'base-mainnet',
        ipfs_cid VARCHAR(100),
        metadata_uri TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        confirmed_at TIMESTAMP WITH TIME ZONE
      );

      -- Merkle Proofs
      CREATE TABLE IF NOT EXISTS merkle_proofs (
        id SERIAL PRIMARY KEY,
        manifest_hash VARCHAR(128) NOT NULL,
        batch_id INTEGER NOT NULL REFERENCES certification_batches(batch_id),
        leaf_index INTEGER NOT NULL,
        proof JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(manifest_hash, batch_id)
      );

      -- Chain Audit Log
      CREATE TABLE IF NOT EXISTS chain_audit_log (
        id SERIAL PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100),
        actor_id VARCHAR(100),
        actor_type VARCHAR(50),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_chain_manifests_batch ON content_manifests(batch_id);
      CREATE INDEX IF NOT EXISTS idx_chain_manifests_manifest_hash ON content_manifests(manifest_hash);
      CREATE INDEX IF NOT EXISTS idx_chain_manifests_created ON content_manifests(created_at);
      CREATE INDEX IF NOT EXISTS idx_chain_batches_status ON certification_batches(status);
      CREATE INDEX IF NOT EXISTS idx_chain_batches_created ON certification_batches(created_at);
      CREATE INDEX IF NOT EXISTS idx_chain_proofs_batch ON merkle_proofs(batch_id);
      CREATE INDEX IF NOT EXISTS idx_chain_audit_action ON chain_audit_log(action);
      CREATE INDEX IF NOT EXISTS idx_chain_audit_created ON chain_audit_log(created_at);
    `);

    console.log("[Chain DB] Schema initialized");
  } finally {
    client.release();
  }
}

// ============================================
// MANIFEST OPERATIONS
// ============================================

export interface ManifestRecord {
  contentHash: string;
  manifestHash: string;
  contentType: string;
  modelId?: string;
  promptHash?: string;
  operatorId?: string;
  organizationId?: string;
  executionMode?: string;
  provider?: string;
  productId?: string;
  brandId?: string;
  manifestData: any;
  complianceData?: any;
  ipfsCid?: string;
  batchId?: number;
}

export async function saveManifest(manifest: ManifestRecord): Promise<number> {
  const result = await pool.query(
    `INSERT INTO content_manifests (
      content_hash, manifest_hash, content_type, model_id, prompt_hash,
      operator_id, organization_id, execution_mode, provider, product_id,
      brand_id, manifest_data, compliance_data, ipfs_cid, batch_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (content_hash) DO UPDATE SET
      manifest_data = EXCLUDED.manifest_data,
      compliance_data = EXCLUDED.compliance_data,
      ipfs_cid = EXCLUDED.ipfs_cid,
      batch_id = EXCLUDED.batch_id,
      updated_at = NOW()
    RETURNING id`,
    [
      manifest.contentHash,
      manifest.manifestHash,
      manifest.contentType,
      manifest.modelId,
      manifest.promptHash,
      manifest.operatorId,
      manifest.organizationId,
      manifest.executionMode,
      manifest.provider,
      manifest.productId,
      manifest.brandId,
      JSON.stringify(manifest.manifestData),
      manifest.complianceData
        ? JSON.stringify(manifest.complianceData)
        : null,
      manifest.ipfsCid,
      manifest.batchId,
    ]
  );

  return result.rows[0].id;
}

export async function getManifest(
  contentHash: string
): Promise<ManifestRecord | null> {
  const result = await pool.query(
    "SELECT * FROM content_manifests WHERE content_hash = $1",
    [contentHash]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    contentHash: row.content_hash,
    manifestHash: row.manifest_hash,
    contentType: row.content_type,
    modelId: row.model_id,
    promptHash: row.prompt_hash,
    operatorId: row.operator_id,
    organizationId: row.organization_id,
    executionMode: row.execution_mode,
    provider: row.provider,
    productId: row.product_id,
    brandId: row.brand_id,
    manifestData: row.manifest_data,
    complianceData: row.compliance_data,
    ipfsCid: row.ipfs_cid,
    batchId: row.batch_id,
  };
}

export async function getManifestsByBatch(
  batchId: number
): Promise<ManifestRecord[]> {
  const result = await pool.query(
    "SELECT * FROM content_manifests WHERE batch_id = $1 ORDER BY created_at",
    [batchId]
  );

  return result.rows.map((row) => ({
    contentHash: row.content_hash,
    manifestHash: row.manifest_hash,
    contentType: row.content_type,
    modelId: row.model_id,
    manifestData: row.manifest_data,
    complianceData: row.compliance_data,
    ipfsCid: row.ipfs_cid,
    batchId: row.batch_id,
  }));
}

export async function updateManifestBatch(
  contentHash: string,
  batchId: number
): Promise<void> {
  await pool.query(
    "UPDATE content_manifests SET batch_id = $1, updated_at = NOW() WHERE content_hash = $2",
    [batchId, contentHash]
  );
}

// ============================================
// BATCH OPERATIONS
// ============================================

export interface BatchRecord {
  batchId: number;
  merkleRoot: string;
  itemCount: number;
  status: "pending" | "submitted" | "confirmed" | "failed";
  onChainBatchId?: number;
  txHash?: string;
  blockNumber?: number;
  network?: string;
  ipfsCid?: string;
  metadataUri?: string;
}

export async function saveBatch(batch: BatchRecord): Promise<void> {
  await pool.query(
    `INSERT INTO certification_batches (
      batch_id, merkle_root, item_count, status, on_chain_batch_id,
      tx_hash, block_number, network, ipfs_cid, metadata_uri
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (batch_id) DO UPDATE SET
      status = EXCLUDED.status,
      on_chain_batch_id = EXCLUDED.on_chain_batch_id,
      tx_hash = EXCLUDED.tx_hash,
      block_number = EXCLUDED.block_number,
      ipfs_cid = EXCLUDED.ipfs_cid,
      metadata_uri = EXCLUDED.metadata_uri,
      confirmed_at = CASE WHEN EXCLUDED.status = 'confirmed' THEN NOW() ELSE certification_batches.confirmed_at END`,
    [
      batch.batchId,
      batch.merkleRoot,
      batch.itemCount,
      batch.status,
      batch.onChainBatchId,
      batch.txHash,
      batch.blockNumber,
      batch.network || "base-mainnet",
      batch.ipfsCid,
      batch.metadataUri,
    ]
  );
}

export async function getBatch(
  batchId: number
): Promise<BatchRecord | null> {
  const result = await pool.query(
    "SELECT * FROM certification_batches WHERE batch_id = $1",
    [batchId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    batchId: row.batch_id,
    merkleRoot: row.merkle_root,
    itemCount: row.item_count,
    status: row.status,
    onChainBatchId: row.on_chain_batch_id,
    txHash: row.tx_hash,
    blockNumber: row.block_number,
    network: row.network,
    ipfsCid: row.ipfs_cid,
    metadataUri: row.metadata_uri,
  };
}

export async function getPendingBatches(): Promise<BatchRecord[]> {
  const result = await pool.query(
    "SELECT * FROM certification_batches WHERE status = 'pending' ORDER BY created_at"
  );

  return result.rows.map((row) => ({
    batchId: row.batch_id,
    merkleRoot: row.merkle_root,
    itemCount: row.item_count,
    status: row.status,
  }));
}

// ============================================
// PROOF OPERATIONS
// ============================================

export interface ProofRecord {
  manifestHash: string;
  batchId: number;
  leafIndex: number;
  proof: string[];
}

export async function saveProof(proof: ProofRecord): Promise<void> {
  await pool.query(
    `INSERT INTO merkle_proofs (manifest_hash, batch_id, leaf_index, proof)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (manifest_hash, batch_id) DO UPDATE SET
      proof = EXCLUDED.proof`,
    [
      proof.manifestHash,
      proof.batchId,
      proof.leafIndex,
      JSON.stringify(proof.proof),
    ]
  );
}

export async function getProof(
  manifestHash: string
): Promise<ProofRecord | null> {
  const result = await pool.query(
    "SELECT * FROM merkle_proofs WHERE manifest_hash = $1 ORDER BY batch_id DESC LIMIT 1",
    [manifestHash]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    manifestHash: row.manifest_hash,
    batchId: row.batch_id,
    leafIndex: row.leaf_index,
    proof: row.proof,
  };
}

// ============================================
// AUDIT LOG
// ============================================

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorType?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  await pool.query(
    `INSERT INTO chain_audit_log (action, entity_type, entity_id, actor_id, actor_type, details, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      entry.action,
      entry.entityType,
      entry.entityId,
      entry.actorId,
      entry.actorType,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.ipAddress,
      entry.userAgent,
    ]
  );
}

export async function getAuditLog(
  filters?: { action?: string; entityType?: string; limit?: number }
): Promise<AuditEntry[]> {
  let query = "SELECT * FROM chain_audit_log WHERE 1=1";
  const params: any[] = [];

  if (filters?.action) {
    params.push(filters.action);
    query += ` AND action = $${params.length}`;
  }

  if (filters?.entityType) {
    params.push(filters.entityType);
    query += ` AND entity_type = $${params.length}`;
  }

  query += " ORDER BY created_at DESC";

  if (filters?.limit) {
    params.push(filters.limit);
    query += ` LIMIT $${params.length}`;
  }

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorId: row.actor_id,
    actorType: row.actor_type,
    details: row.details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
  }));
}

// ============================================
// STATISTICS
// ============================================

export async function getStats(): Promise<{
  totalManifests: number;
  totalBatches: number;
  confirmedBatches: number;
  pendingBatches: number;
}> {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM content_manifests) as total_manifests,
      (SELECT COUNT(*) FROM certification_batches) as total_batches,
      (SELECT COUNT(*) FROM certification_batches WHERE status = 'confirmed') as confirmed_batches,
      (SELECT COUNT(*) FROM certification_batches WHERE status = 'pending') as pending_batches
  `);

  const row = result.rows[0];
  return {
    totalManifests: parseInt(row.total_manifests),
    totalBatches: parseInt(row.total_batches),
    confirmedBatches: parseInt(row.confirmed_batches),
    pendingBatches: parseInt(row.pending_batches),
  };
}

export { pool };
