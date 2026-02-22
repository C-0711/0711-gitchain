# Verification Guide

Every GitChain container is blockchain-anchored for immutable verification.

## How It Works

1. **Content Hash** — Container data is hashed using SHA-256
2. **Merkle Tree** — Multiple hashes are combined into a Merkle tree
3. **Batch Registration** — Merkle root is recorded on Base Mainnet
4. **Verification** — Any container can be verified against the chain

```
┌─────────────────────────────────────────┐
│           Container Data                │
└────────────────┬────────────────────────┘
                 │ SHA-256
                 ▼
┌─────────────────────────────────────────┐
│           Content Hash                  │
└────────────────┬────────────────────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
┌──────────┐          ┌──────────┐
│ Hash A   │          │ Hash B   │
└────┬─────┘          └────┬─────┘
     │                     │
     └──────────┬──────────┘
                │ Merkle
                ▼
┌─────────────────────────────────────────┐
│           Merkle Root                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     Base Mainnet (Chain ID: 8453)       │
│     Contract: 0xAd31465A5618...         │
└─────────────────────────────────────────┘
```

## Verification Methods

### 1. Via API

```bash
curl https://api.gitchain.0711.io/api/verify/0711:product:bosch:7736606982:v3
```

Response:
```json
{
  "verified": true,
  "container": {
    "id": "0711:product:bosch:7736606982:v3",
    "meta": { "name": "CS7001iAW 17 O TH" }
  },
  "chain": {
    "network": "base-mainnet",
    "batchId": 42,
    "txHash": "0x7f3a5b2c...",
    "blockNumber": 18234567
  }
}
```

### 2. Via SDK

```typescript
import { GitChainClient } from "@0711/sdk";

const client = new GitChainClient();
const result = await client.verify("0711:product:bosch:7736606982:v3");

console.log(result.verified);  // true
console.log(result.chain.txHash);
```

### 3. Via CLI

```bash
gitchain verify 0711:product:bosch:7736606982:v3
```

### 4. Direct On-Chain

```solidity
// Contract: 0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7

function verifyContent(
    uint256 batchId,
    bytes32 contentHash,
    bytes32[] calldata merkleProof
) external view returns (bool);
```

## Verification Portal

Visit [verify.gitchain.0711.io](https://verify.gitchain.0711.io) to:

- Scan QR codes
- Enter container IDs
- View blockchain proofs
- Download verification certificates

## Batch Information

Each batch contains:

- **Merkle Root** — Cryptographic summary of all containers
- **Metadata URI** — IPFS link to batch metadata
- **Timestamp** — When batch was registered
- **Registrar** — Address that registered the batch

Query batch info:

```bash
curl https://api.gitchain.0711.io/api/verify/batch/42
```

## Smart Contract

- **Network:** Base Mainnet
- **Address:** `0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7`
- **Explorer:** [BaseScan](https://basescan.org/address/0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7)

## Verification Guarantees

✅ **Existence** — Container existed at registration time  
✅ **Integrity** — Data has not been modified  
✅ **Timestamp** — Proof of when data was registered  
✅ **Audit Trail** — Complete history via Git + blockchain
