-- ===========================================
-- GitChain Migration: Content Chain (Blockchain)
-- Created: 2026-02-27
-- Description: Creates tables for the Content Blockchain service:
--   - content_manifests: Certified content with compliance data
--   - certification_batches: Merkle batches submitted on-chain
--   - merkle_proofs: Individual Merkle proofs per content hash
--   - chain_audit_log: Audit trail for all chain operations
--
-- Contract: ContentCertificate.sol
-- Address:  0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7
-- Network:  Base Mainnet (Chain ID 8453)
-- ===========================================

BEGIN;

-- ===========================================
-- Content Manifests
-- Stores certified content with full manifest + compliance results
-- ===========================================
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

-- ===========================================
-- Certification Batches
-- Merkle batches containing multiple content hashes,
-- submitted as single transactions on Base Mainnet
-- ===========================================
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

-- ===========================================
-- Merkle Proofs
-- Individual proofs linking a content hash to a batch's Merkle tree
-- ===========================================
CREATE TABLE IF NOT EXISTS merkle_proofs (
  id SERIAL PRIMARY KEY,
  manifest_hash VARCHAR(128) NOT NULL,
  batch_id INTEGER NOT NULL REFERENCES certification_batches(batch_id),
  leaf_index INTEGER NOT NULL,
  proof JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manifest_hash, batch_id)
);

-- ===========================================
-- Chain Audit Log
-- Immutable audit trail for all blockchain operations
-- ===========================================
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

-- ===========================================
-- INDEXES
-- ===========================================

-- Content manifests
CREATE INDEX IF NOT EXISTS idx_chain_manifests_batch ON content_manifests(batch_id);
CREATE INDEX IF NOT EXISTS idx_chain_manifests_manifest_hash ON content_manifests(manifest_hash);
CREATE INDEX IF NOT EXISTS idx_chain_manifests_created ON content_manifests(created_at);
CREATE INDEX IF NOT EXISTS idx_chain_manifests_content_type ON content_manifests(content_type);
CREATE INDEX IF NOT EXISTS idx_chain_manifests_model_id ON content_manifests(model_id);
CREATE INDEX IF NOT EXISTS idx_chain_manifests_operator ON content_manifests(operator_id);
CREATE INDEX IF NOT EXISTS idx_chain_manifests_org ON content_manifests(organization_id);

-- Certification batches
CREATE INDEX IF NOT EXISTS idx_chain_batches_status ON certification_batches(status);
CREATE INDEX IF NOT EXISTS idx_chain_batches_created ON certification_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_chain_batches_tx_hash ON certification_batches(tx_hash);
CREATE INDEX IF NOT EXISTS idx_chain_batches_network ON certification_batches(network);

-- Merkle proofs
CREATE INDEX IF NOT EXISTS idx_chain_proofs_batch ON merkle_proofs(batch_id);
CREATE INDEX IF NOT EXISTS idx_chain_proofs_manifest ON merkle_proofs(manifest_hash);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_chain_audit_action ON chain_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_chain_audit_created ON chain_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_chain_audit_entity ON chain_audit_log(entity_type, entity_id);

-- ===========================================
-- COMMENTS
-- ===========================================
COMMENT ON TABLE content_manifests IS 'Blockchain-certified content manifests with compliance results';
COMMENT ON TABLE certification_batches IS 'Merkle tree batches submitted to Base Mainnet';
COMMENT ON TABLE merkle_proofs IS 'Individual Merkle proofs linking content to on-chain batches';
COMMENT ON TABLE chain_audit_log IS 'Immutable audit trail for blockchain operations';

COMMENT ON COLUMN certification_batches.merkle_root IS 'keccak256 Merkle root (compatible with OpenZeppelin MerkleProof.verify)';
COMMENT ON COLUMN certification_batches.on_chain_batch_id IS 'Batch ID returned by ContentCertificate.certifyBatch event';
COMMENT ON COLUMN certification_batches.tx_hash IS 'Base Mainnet transaction hash';
COMMENT ON COLUMN certification_batches.metadata_uri IS 'IPFS URI for batch metadata (passed to smart contract)';

COMMIT;
