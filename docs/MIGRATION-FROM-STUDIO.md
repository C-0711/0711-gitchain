# GitChain ← 0711-Studio Blockchain Migration

**Created:** 2026-02-27
**Source:** `/home/christoph.bertsch/0711/0711-studio/src/lib/content-chain/`
**Target:** `/home/christoph.bertsch/0711/0711-gitchain/packages/chain/`
**Smart Contract:** `0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7` (Base Mainnet)

---

## Executive Summary

The 0711-Studio project has a **complete, production-tested blockchain certification pipeline** that GitChain's `@0711/chain` package partially duplicates with scaffolded/incomplete code. This document maps every file, identifies mismatches, and provides exact migration steps.

### What Studio Has (Battle-Tested)
- Full Merkle tree engine with auto-batching (5-min timer)
- Blockchain service with real `certifyBatch()` / `verifyCertification()` calls
- PostgreSQL persistence (manifests, batches, proofs, audit log)
- IPFS via Pinata SDK (manifests, Merkle trees, batch metadata)
- Compliance checks (ECGT greenwashing, DSGVO PII, AI Act provenance)
- 4 API routes (certify, batch, blockchain, verify)
- DPP batch minting with gas optimization
- Hardhat config + 2 deployment scripts
- Live environment config (private key, Pinata JWT, contract addresses)

### What GitChain Has (Partially Migrated)
- `@0711/chain`: Has blockchain.ts, merkle.ts, service.ts, types.ts, db.ts — but with **different ABI names** and missing features
- `@0711/ipfs`: Generic IPFS service (raw API, not Pinata) — functional but not connected
- `@0711/inject/verifier.ts`: **Placeholder** — returns mock data, has `TODO` comments
- Smart contract: Same `.sol` file (identical)
- API routes: Proxy stubs, not full implementation

---

## File-by-File Comparison

### 1. Smart Contract (`ContentCertificate.sol`)

| | Studio | GitChain |
|---|--------|----------|
| **File** | `contracts/ContentCertificate.sol` | `contracts/ContentCertificate.sol` |
| **Status** | ✅ Identical | ✅ Identical |
| **Action** | — | No change needed |

The contract is the same. Both point to `0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7`.

---

### 2. Blockchain Service

| | Studio | GitChain |
|---|--------|----------|
| **File** | `src/lib/content-chain/blockchain.ts` | `packages/chain/src/blockchain.ts` |
| **ABI** | `certifyBatch`, `verifyCertification`, `getCertification`, `nextBatchId` | `registerContentBatch`, `verifyContent`, `getBatch`, `batchCount` |
| **Constructor** | Network auto-detect from env, wallet always created | Network param, optional private key |
| **Status** | `getStatus()` → connected, balance, wallet | Missing |
| **Certification** | `certifyBatch(batch, metadataURI)` — full flow with event parsing | `registerBatch(merkleRoot, metadataUri)` — simpler |
| **Verification** | `verifyCertification(batchId, manifestHash, proof)` | `verifyContent(batchId, contentHash, merkleProof)` |
| **Get Batch** | `getCertification(batchId)` → merkleRoot, timestamp, metadataURI, itemCount, issuer | `getBatch(batchId)` → merkleRoot, metadataUri, timestamp, registrar |

**⚠️ CRITICAL MISMATCH**: The ABI function names differ. The actual deployed contract uses Studio's names (`certifyBatch`, `verifyCertification`, `getCertification`). GitChain's ABI (`registerContentBatch`, `verifyContent`) **will fail on-chain** because those functions don't exist in the contract.

**Migration:**
```
REPLACE gitchain blockchain.ts ABI with studio ABI
MERGE studio's getStatus() and wallet management into gitchain's cleaner class structure
KEEP gitchain's pattern of optional signer (read-only mode for verification)
ADD studio's certifyBatch() flow with event parsing and batch status update
```

---

### 3. Merkle Tree

| | Studio | GitChain |
|---|--------|----------|
| **File** | `src/lib/content-chain/merkle.ts` | `packages/chain/src/merkle.ts` |
| **Hash Function** | `crypto.sha256` (Node.js built-in) | `ethers.keccak256` (EVM-compatible) |
| **Pair Hashing** | Sort pair, concat as strings | Sort pair, concat as bytes |
| **Auto-Batch** | ✅ 5-min timer with `startAutoBatching()` | ❌ Missing |
| **Batch State** | In-memory `Map<number, CertificationBatch>` | No state management |
| **Proof Store** | Imports from `service.ts` shared `proofStore` | Returns proofs from `createBatch()` |

**⚠️ HASH MISMATCH**: The smart contract uses OpenZeppelin's `MerkleProof.verify()` which uses `keccak256`. Studio uses `sha256`. This means **Studio's Merkle proofs may not verify on-chain correctly** via the contract's `verifyCertification()` function.

GitChain's `keccak256` approach is **correct** for OpenZeppelin compatibility.

**Migration:**
```
KEEP gitchain's keccak256 hashing (correct for on-chain verification)
TAKE studio's auto-batching system (startAutoBatching/stopAutoBatching)
TAKE studio's batch state management (in-memory Map + DB persistence)
TAKE studio's createBatch() flow (queue → tree → proofs → batch record)
ADAPT studio's queue integration to work with gitchain containers instead of manifests
```

---

### 4. Certification Service

| | Studio | GitChain |
|---|--------|----------|
| **File** | `src/lib/content-chain/service.ts` | `packages/chain/src/service.ts` |
| **Hashing** | sha256, hashContent, hashPrompt, hashManifest | sha256, hashContent, hashPrompt, hashManifest |
| **Manifest** | AI-content focused (modelId, promptHash, workflowHash) | Similar but adapted for containers |
| **Compliance** | ECGT, Brand, PII, AI Act | Same set (ECGT, Brand, PII) |
| **Queue** | In-memory Map + DB fallback | In-memory Map + DB fallback |
| **Certify Flow** | manifest → compliance → hash → queue → DB → response | Same pattern |

**Migration:**
```
MERGE studio's service.ts into gitchain's
Gitchain already has nearly identical code
ADD studio's compliance check for AI Act (auto-pass for provenance)
ADAPT manifest schema to support both AI content AND container data
KEEP gitchain's container-centric naming
```

---

### 5. Type Definitions

| | Studio | GitChain |
|---|--------|----------|
| **File** | `src/lib/content-chain/types.ts` | `packages/chain/src/types.ts` |
| **ContentManifest** | AI-content: contentHash, modelId, promptHash, parameters (seed, steps, guidance) | Same structure |
| **CertificationBatch** | batchId, merkleRoot, itemCount, network, status | Same |
| **CertifyRequest** | content (Buffer), modelId, prompt, productId, brandId, runCompliance | Same |

**Migration:**
```
ALREADY MIGRATED — gitchain types.ts is a copy of studio types.ts
No changes needed
```

---

### 6. Database Layer

| | Studio | GitChain |
|---|--------|----------|
| **File** | `src/lib/content-chain/db.ts` | `packages/chain/src/db.ts` |
| **Connection** | Port 5434, DB: content_chain, user: bosch_user | Port 5434 (falls back to bosch), DB: content_chain |
| **Tables** | content_manifests, certification_batches, merkle_proofs, audit_log | Same 4 tables |
| **Schema Init** | `initializeSchema()` with CREATE TABLE IF NOT EXISTS | Same |
| **Operations** | saveManifest, getManifest, saveBatch, getBatch, saveProof, getProof, logAudit, getStats | Same |

**Migration:**
```
ALREADY MIGRATED — gitchain db.ts is essentially the same as studio db.ts
UPDATE connection config to use gitchain's own database (port 5440, gitchain DB)
  instead of sharing bosch-postgres
ADD content_chain tables to gitchain's migration system (database/migrations/006_content_chain.sql)
```

---

### 7. IPFS Service

| | Studio | GitChain |
|---|--------|----------|
| **File** | `src/lib/ipfs/service.ts` | `packages/ipfs/src/service.ts` |
| **Provider** | Pinata SDK (`pinata` package) | Raw IPFS API (`http://localhost:5001`) |
| **Features** | uploadJSON, uploadManifest, uploadMerkleTree, uploadBatchMetadata, fetchFromIPFS, pinCID | uploadJSON, uploadFile, downloadJSON, pin |
| **Production** | ✅ Uses Pinata JWT, gateway configured | ❌ Points to localhost, no provider |

**Migration:**
```
REPLACE gitchain's raw IPFS service with studio's Pinata-based service
ADD `pinata` to packages/ipfs/package.json dependencies
COPY studio's specialized upload functions (uploadManifest, uploadMerkleTree, uploadBatchMetadata)
COPY studio's fetchFromIPFS and isIPFSConfigured helpers
KEEP gitchain's IPFSService class structure but swap internals to Pinata
ADD environment variables: PINATA_JWT, PINATA_GATEWAY
```

---

### 8. Inject Verifier (The TODO Gap)

| | Studio | GitChain |
|---|--------|----------|
| **File** | Full verification in API route `api/verify/[hash]/route.ts` | `packages/inject/src/verifier.ts` |
| **Status** | ✅ Real: manifest lookup → Merkle proof → batch → blockchain verify | ❌ Mock: `TODO: Implement actual blockchain verification`, returns fake data |

**Migration:**
```
REPLACE verifier.ts mock with real chain integration:
1. Import getBlockchainService from @0711/chain
2. Import getProof, getBatch from @0711/chain/merkle
3. In verifyOnChain():
   a. Look up container's anchor in DB (content_hash → merkle_proofs → certification_batches)
   b. If batch confirmed: call blockchain.verifyCertification(batchId, contentHash, proof)
   c. If batch confirmed: call blockchain.getCertification(batchId) for tx details
   d. Return real ChainProof with network, txHash, blockNumber
4. In verifyHash():
   a. Look up manifest by hash in content_manifests table
   b. Follow same verification flow
```

---

### 9. API Routes

| | Studio | GitChain |
|---|--------|----------|
| **Certify** | `POST /api/certify` — Full certification flow | ❌ Not present |
| **Batch** | `POST /api/certify/batch` — Create Merkle batch | `POST /api/batch` — Proxy stub |
| **Blockchain** | `POST /api/certify/blockchain` — Submit to chain | ❌ Not present |
| **Verify** | `GET /api/verify/[hash]` — Full 4-step verification | `GET /api/verify/[id]` — Proxy to API |

**Migration:**
```
CREATE 4 new API routes in apps/api/src/routes/:

1. routes/certify.ts (from studio's api/certify/route.ts)
   POST /api/certify — Certify container content
   GET  /api/certify — Health check + queue status

2. routes/batch.ts (from studio's api/certify/batch/route.ts)
   POST /api/batch/create — Create Merkle batch from queue
   GET  /api/batch — List batches, verify proofs
   GET  /api/batch/:id — Get specific batch

3. routes/blockchain.ts (from studio's api/certify/blockchain/route.ts)
   POST /api/blockchain/submit — Submit batch to chain
   GET  /api/blockchain/status — Connection status + stats

4. UPDATE routes/verify.ts (enhance existing)
   GET /api/verify/:hashOrId — Full 4-step verification (mirror studio logic)
```

---

### 10. DPP Batch Minting

| | Studio | GitChain |
|---|--------|----------|
| **File** | `src/lib/dpp/batch-mint.ts` | `packages/dpp/` (empty package) |
| **Features** | Gas-optimized batch NFT minting, EIP-1559, retries | Nothing |

**Migration:**
```
COPY studio's batch-mint.ts to packages/dpp/src/batch-mint.ts
ADAPT to gitchain's package structure
ADD to packages/dpp/src/index.ts exports
UPDATE package.json with ethers dependency
```

---

### 11. Deployment Infrastructure

| | Studio | GitChain |
|---|--------|----------|
| **Hardhat** | `hardhat.config.ts` with base-sepolia network | ❌ Missing |
| **Deploy (HH)** | `scripts/deploy.ts` — Hardhat deployment | ❌ Missing |
| **Deploy (ethers)** | `scripts/deploy-ethers.mjs` — Direct ethers.js deploy | ❌ Missing |

**Migration:**
```
COPY hardhat.config.ts to gitchain root
COPY scripts/deploy.ts to gitchain/scripts/
COPY scripts/deploy-ethers.mjs to gitchain/scripts/
ADD hardhat + @nomicfoundation/hardhat-toolbox to root devDependencies
ADD @openzeppelin/contracts to root dependencies
UPDATE references from "0711 Studio" to "GitChain"
```

---

### 12. Environment Configuration

| Variable | Studio Value | GitChain Action |
|----------|-------------|-----------------|
| `DEPLOYER_PRIVATE_KEY` | `0xfbedca90...` | Copy to gitchain `.env` |
| `CONTENT_CERTIFICATE_ADDRESS_MAINNET` | `0xAd31465A...` | Already in gitchain code |
| `BASE_MAINNET_RPC` | `https://mainnet.base.org` | Already in gitchain code |
| `BASE_SEPOLIA_RPC` | `https://sepolia.base.org` | Already in gitchain code |
| `PINATA_JWT` | `eyJhbGci...` | Copy to gitchain `.env` |
| `PINATA_GATEWAY` | `gateway.pinata.cloud` | Add to gitchain `.env` |
| `CONTENT_CHAIN_DB_HOST` | `localhost` | Change to gitchain's DB |
| `CONTENT_CHAIN_DB_PORT` | `5434` | Change to `5440` (gitchain) |
| `CONTENT_CHAIN_DB_NAME` | `content_chain` | Change to `gitchain` |
| `CONTENT_CHAIN_DB_USER` | `bosch_user` | Change to `gitchain` |
| `PROMPT_HASH_SALT` | `0711-studio-v1` | Change to `0711-gitchain-v1` |

---

## Migration Execution Plan

### Step 1: Fix the Critical ABI Mismatch (30 min)
> GitChain's blockchain.ts calls non-existent contract functions

**File:** `packages/chain/src/blockchain.ts`

Replace the `CONTRACT_ABI` array with the actual deployed contract's ABI from Studio:
```typescript
// WRONG (gitchain current):
"function registerContentBatch(bytes32 merkleRoot, string metadataUri) external returns (uint256 batchId)"
"function verifyContent(uint256 batchId, bytes32 contentHash, bytes32[] calldata merkleProof) external view returns (bool)"
"function getBatch(uint256 batchId) external view returns (...)"

// CORRECT (studio / actual contract):
"function certifyBatch(bytes32 _merkleRoot, string calldata _metadataURI, uint256 _itemCount, uint8 _schemaVersion) external returns (uint256)"
"function verifyCertification(uint256 _batchId, bytes32 _contentManifestHash, bytes32[] calldata _merkleProof) external view returns (bool)"
"function getCertification(uint256 _batchId) external view returns (bytes32, uint256, string, uint256, address)"
"function nextBatchId() external view returns (uint256)"
```

Update all method signatures to match the real contract.

### Step 2: Merge BlockchainService (1 hour)
> Combine Studio's production features with Gitchain's clean architecture

**File:** `packages/chain/src/blockchain.ts`

1. Add `getStatus()` method from Studio (connected, balance, wallet address)
2. Update `registerBatch()` → `certifyBatch()` with Studio's flow:
   - Accept `BatchResult` + `metadataURI`
   - Parse `BatchCertified` event for on-chain batch ID
   - Update local batch status via `updateBatchStatus()`
   - Return `{ success, txHash, blockNumber, onChainBatchId }`
3. Update `verifyContent()` → `verifyCertification()` signature
4. Update `getBatch()` → `getCertification()` with full return type
5. Add environment-based network auto-detection from Studio
6. Keep Gitchain's optional signer pattern (read-only mode)

### Step 3: Add Auto-Batching to Merkle (1 hour)
> Port Studio's timer-based batching system

**File:** `packages/chain/src/merkle.ts`

1. KEEP Gitchain's `keccak256` hashing (correct for OpenZeppelin)
2. ADD batch state management from Studio:
   ```typescript
   const batches: Map<number, CertificationBatch> = new Map();
   let batchCounter = 0;
   ```
3. ADD `startAutoBatching(onBatch)` / `stopAutoBatching()` from Studio
4. ADD `getBatch()`, `getAllBatches()`, `updateBatchStatus()`, `getProof()` from Studio
5. ADAPT `createBatch()` to use gitchain container queue instead of Studio manifest queue

### Step 4: Replace IPFS with Pinata (1 hour)
> Swap generic IPFS for Studio's production Pinata integration

**File:** `packages/ipfs/src/service.ts`

1. Add `pinata` to `packages/ipfs/package.json`
2. Replace `IPFSService` internals with Pinata SDK:
   - `uploadJSON()` → use `pinata.upload.public.json()`
   - `uploadFile()` → use `pinata.upload.public.file()`
   - `downloadJSON()` → fetch from Pinata gateway
   - `pin()` → use `pinata.upload.public.cid()`
3. ADD Studio's specialized functions:
   - `uploadManifest(upload)` — format manifest for IPFS
   - `uploadMerkleTree(batchId, root, leaves, tree)` — store tree
   - `uploadBatchMetadata(batchId, root, count, cids)` — batch reference
4. ADD `isIPFSConfigured()` and `getIPFSUrl()` helpers
5. ADD env vars: `PINATA_JWT`, `PINATA_GATEWAY`

### Step 5: Wire Real Verification (1 hour)
> Replace TODO placeholder with real blockchain calls

**File:** `packages/inject/src/verifier.ts`

Replace mock implementation:
```typescript
import { getBlockchainService } from "@0711/chain";
import { getProof, getBatch } from "@0711/chain/merkle";

async function verifyOnChain(container: Container): Promise<ChainProof> {
  const blockchain = getBlockchainService();
  const proof = getProof(container.chain?.contentHash || "");
  const batch = proof ? getBatch(proof.batchId) : null;

  if (!batch || batch.status !== "confirmed" || !batch.txHash || !proof) {
    return { containerId: container.id, verified: false, reason: "No confirmed batch" };
  }

  const verified = await blockchain.verifyCertification(
    proof.batchId, container.chain!.contentHash, proof.proof
  );

  const certification = await blockchain.getCertification(proof.batchId);

  return {
    containerId: container.id,
    verified,
    network: "base-mainnet",
    batchId: proof.batchId,
    txHash: batch.txHash,
    blockNumber: batch.blockNumber,
    verifiedAt: new Date().toISOString(),
  };
}
```

### Step 6: Create API Routes (2 hours)
> Port Studio's 4 API routes to Gitchain's Express API

**Files to create in `apps/api/src/routes/`:**

1. **`certify.ts`** — Port from `studio/src/app/api/certify/route.ts`
   - `POST /api/certify` — Accept container data, create manifest, run compliance, queue
   - `GET /api/certify` — Health + queue status + blockchain status
   - Adapt from Next.js route handler to Express route

2. **`batch.ts`** — Port from `studio/src/app/api/certify/batch/route.ts`
   - `POST /api/batch/create` — Create Merkle batch from queue
   - `GET /api/batch` — List all batches + queue size
   - `GET /api/batch/:id` — Get specific batch
   - `GET /api/batch/verify/:manifestHash` — Verify Merkle proof

3. **`blockchain.ts`** — Port from `studio/src/app/api/certify/blockchain/route.ts`
   - `POST /api/blockchain/submit` — Submit batch to Base Mainnet
   - `GET /api/blockchain/status` — Connection status + wallet + stats

4. **Update `verify.ts`** — Enhance with Studio's 4-step verification:
   - Step 1: Check local manifest store
   - Step 2: Get Merkle proof
   - Step 3: Get batch from proof
   - Step 4: Verify on blockchain if batch confirmed
   - Return complete chain: manifest + proof + batch + blockchain details + BaseScan links

### Step 7: Add Deployment Infrastructure (30 min)
> Copy build tools for contract deployment

1. Copy `hardhat.config.ts` to gitchain root
2. Copy `scripts/deploy.ts` to `gitchain/scripts/`
3. Copy `scripts/deploy-ethers.mjs` to `gitchain/scripts/`
4. Add to root `package.json`:
   ```json
   "devDependencies": {
     "hardhat": "^3.1.8",
     "@nomicfoundation/hardhat-toolbox": "^6.1.0"
   },
   "dependencies": {
     "@openzeppelin/contracts": "^5.4.0"
   }
   ```
5. Update deploy scripts to reference gitchain paths

### Step 8: Migrate DPP Batch Minting (30 min)
> Port gas-optimized minting to gitchain's DPP package

1. Copy `studio/src/lib/dpp/batch-mint.ts` → `packages/dpp/src/batch-mint.ts`
2. Update imports to use `@0711/chain` instead of relative paths
3. Add to `packages/dpp/src/index.ts`:
   ```typescript
   export { BatchMinter, mintDPPBatch } from "./batch-mint";
   ```
4. Add `ethers` to `packages/dpp/package.json` dependencies

### Step 9: Database Migration (30 min)
> Add content chain tables to gitchain's database

Create `database/migrations/006_content_chain.sql`:
```sql
-- Content Chain tables (migrated from 0711-Studio)
-- These store blockchain certification data

CREATE TABLE IF NOT EXISTS content_manifests (
  id SERIAL PRIMARY KEY,
  content_hash VARCHAR(64) NOT NULL UNIQUE,
  manifest_hash VARCHAR(64) NOT NULL,
  container_id UUID REFERENCES containers(id),  -- Link to gitchain container
  content_type VARCHAR(50) NOT NULL,
  model_id VARCHAR(100),
  prompt_hash VARCHAR(64),
  operator_id VARCHAR(100),
  organization_id UUID REFERENCES organizations(id),
  manifest_data JSONB NOT NULL,
  compliance_data JSONB,
  ipfs_cid VARCHAR(100),
  batch_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certification_batches (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL UNIQUE,
  merkle_root VARCHAR(64) NOT NULL,
  item_count INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  on_chain_batch_id INTEGER,
  tx_hash VARCHAR(66),
  block_number INTEGER,
  network VARCHAR(20) DEFAULT 'base-mainnet',
  ipfs_cid VARCHAR(100),
  metadata_uri TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS merkle_proofs (
  id SERIAL PRIMARY KEY,
  manifest_hash VARCHAR(64) NOT NULL,
  batch_id INTEGER NOT NULL REFERENCES certification_batches(batch_id),
  leaf_index INTEGER NOT NULL,
  proof JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manifest_hash, batch_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manifests_container ON content_manifests(container_id);
CREATE INDEX IF NOT EXISTS idx_manifests_batch ON content_manifests(batch_id);
CREATE INDEX IF NOT EXISTS idx_manifests_hash ON content_manifests(manifest_hash);
CREATE INDEX IF NOT EXISTS idx_batches_status ON certification_batches(status);
CREATE INDEX IF NOT EXISTS idx_proofs_batch ON merkle_proofs(batch_id);
```

### Step 10: Update chain/db.ts Connection (15 min)
> Point to gitchain's database instead of bosch-postgres

**File:** `packages/chain/src/db.ts`

```typescript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5440'),
  database: process.env.DB_NAME || 'gitchain',
  user: process.env.DB_USER || 'gitchain',
  password: process.env.DB_PASSWORD,
  max: 10,
});
```

Remove the `BOSCH_DB_*` fallbacks. Use gitchain's own connection pool from the API app if possible (avoid duplicate pools).

### Step 11: Environment Variables (15 min)
> Add blockchain + IPFS config to gitchain

Add to `.env.example`:
```bash
# Blockchain (Base Mainnet)
DEPLOYER_PRIVATE_KEY=       # Required for anchoring
CONTENT_CERTIFICATE_ADDRESS_MAINNET=0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7
BASE_MAINNET_RPC=https://mainnet.base.org
BASE_SEPOLIA_RPC=https://sepolia.base.org

# IPFS (Pinata)
PINATA_JWT=                 # Required for IPFS storage
PINATA_GATEWAY=gateway.pinata.cloud

# Content Chain
PROMPT_HASH_SALT=0711-gitchain-v1
```

Copy actual values from `0711-studio/.env.local` to gitchain's `.env`.

### Step 12: Update Hub UI (2 hours)
> Wire container detail "Chain" tab to real data

1. Container detail page — Chain tab:
   - Show real verification status (query `/api/verify/:id`)
   - Display: Merkle root, batch ID, tx hash, block number, network
   - Link to BaseScan: `https://basescan.org/tx/{txHash}`
   - "Verify Now" button → trigger `POST /api/certify` + `POST /api/batch/create` + `POST /api/blockchain/submit`
   - Verification badge: green checkmark for confirmed, yellow for pending, grey for uncertified

2. Verify app (`apps/verify/`):
   - Wire to real `/api/verify/:hash` endpoint
   - Show full verification chain: manifest → proof → batch → blockchain
   - Generate QR code linking to verification page

---

## Execution Timeline

| Step | Task | Time | Depends On |
|------|------|------|------------|
| **1** | Fix ABI mismatch | 30 min | — |
| **2** | Merge BlockchainService | 1 hr | Step 1 |
| **3** | Add auto-batching to Merkle | 1 hr | Step 1 |
| **4** | Replace IPFS with Pinata | 1 hr | — |
| **5** | Wire real verification | 1 hr | Steps 2, 3 |
| **6** | Create API routes | 2 hr | Steps 2, 3, 4 |
| **7** | Deployment infrastructure | 30 min | — |
| **8** | DPP batch minting | 30 min | — |
| **9** | Database migration | 30 min | — |
| **10** | Update DB connection | 15 min | Step 9 |
| **11** | Environment variables | 15 min | — |
| **12** | Hub UI wiring | 2 hr | Steps 5, 6 |

**Total: ~10 hours** (1.5 days focused work)

**Parallel tracks:**
- Track A: Steps 1→2→3→5 (blockchain core)
- Track B: Step 4 (IPFS)
- Track C: Steps 7, 8, 9, 10, 11 (infrastructure)
- Final: Steps 6, 12 (integration, depends on A+B)

---

## Post-Migration Verification

### Smoke Tests
1. `GET /api/blockchain/status` → returns `{ connected: true, contractDeployed: true, balance: "0.0x ETH" }`
2. `POST /api/certify` with test content → returns `{ success: true, manifestHash: "..." }`
3. `POST /api/batch/create` → returns `{ batchId: N, merkleRoot: "..." }`
4. `POST /api/blockchain/submit` with batchId → returns `{ txHash: "0x..." }` (testnet first!)
5. `GET /api/verify/<contentHash>` → returns full verification chain
6. Hub Chain tab shows real tx link to BaseScan

### Safety
- **Test on Base Sepolia first** before mainnet
- Verify wallet has sufficient ETH for gas
- Check that Merkle proofs generated with keccak256 verify correctly on-chain
- Ensure no Studio functionality breaks (Studio should continue working independently)

---

*This migration reuses ~1,500 lines of production-tested blockchain code from 0711-Studio.*
