// 0711 Studio IPFS Service
// Uploads manifests and Merkle trees to IPFS via Pinata

import { PinataSDK } from 'pinata';

// ============================================
// CONFIGURATION
// ============================================

const PINATA_JWT = process.env.PINATA_JWT || '';
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';

// ============================================
// TYPES
// ============================================

export interface IPFSUploadResult {
  success: boolean;
  cid?: string;
  url?: string;
  size?: number;
  error?: string;
}

export interface ManifestUpload {
  contentHash: string;
  manifest: any;
  batchId?: number;
  merkleRoot?: string;
}

// ============================================
// IPFS SERVICE
// ============================================

let pinata: PinataSDK | null = null;

function getPinata(): PinataSDK {
  if (!pinata) {
    if (!PINATA_JWT) {
      throw new Error('PINATA_JWT not configured');
    }
    pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });
  }
  return pinata;
}

// Upload JSON data to IPFS
export async function uploadJSON(
  data: any,
  name: string,
  metadata?: Record<string, string>
): Promise<IPFSUploadResult> {
  try {
    const client = getPinata();
    
    const result = await client.upload.public.json(data, {
      metadata: {
        name,
        keyvalues: metadata || {},
      },
    });

    return {
      success: true,
      cid: result.cid,
      url: `https://${PINATA_GATEWAY}/ipfs/${result.cid}`,
      size: JSON.stringify(data).length,
    };
  } catch (error) {
    console.error('[IPFS] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'IPFS upload failed',
    };
  }
}

// Upload content manifest to IPFS
export async function uploadManifest(upload: ManifestUpload): Promise<IPFSUploadResult> {
  const data = {
    version: '1.0',
    type: 'content-manifest',
    contentHash: upload.contentHash,
    manifest: upload.manifest,
    batchId: upload.batchId,
    merkleRoot: upload.merkleRoot,
    timestamp: new Date().toISOString(),
    generator: '0711 Studio',
  };

  return uploadJSON(
    data,
    `manifest-${upload.contentHash.slice(0, 16)}`,
    {
      contentHash: upload.contentHash,
      batchId: upload.batchId?.toString() || '',
    }
  );
}

// Upload Merkle tree to IPFS
export async function uploadMerkleTree(
  batchId: number,
  merkleRoot: string,
  leaves: string[],
  tree: string[][]
): Promise<IPFSUploadResult> {
  const data = {
    version: '1.0',
    type: 'merkle-tree',
    batchId,
    merkleRoot,
    leafCount: leaves.length,
    leaves,
    tree,
    timestamp: new Date().toISOString(),
    generator: '0711 Studio',
  };

  return uploadJSON(
    data,
    `merkle-tree-batch-${batchId}`,
    {
      batchId: batchId.toString(),
      merkleRoot,
    }
  );
}

// Upload batch metadata to IPFS (for blockchain reference)
export async function uploadBatchMetadata(
  batchId: number,
  merkleRoot: string,
  itemCount: number,
  manifestCIDs: string[]
): Promise<IPFSUploadResult> {
  const data = {
    version: '1.0',
    type: 'certification-batch',
    batchId,
    merkleRoot,
    itemCount,
    manifestCIDs,
    timestamp: new Date().toISOString(),
    generator: '0711 Studio',
    network: process.env.CONTENT_CERTIFICATE_ADDRESS_MAINNET ? 'base-mainnet' : 'base-sepolia',
    contract: process.env.CONTENT_CERTIFICATE_ADDRESS_MAINNET || process.env.CONTENT_CERTIFICATE_ADDRESS_SEPOLIA,
  };

  return uploadJSON(
    data,
    `batch-${batchId}-metadata`,
    {
      batchId: batchId.toString(),
      merkleRoot,
      itemCount: itemCount.toString(),
    }
  );
}

// Fetch content from IPFS
export async function fetchFromIPFS(cid: string): Promise<any> {
  try {
    const url = getIPFSUrl(cid);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`IPFS fetch failed: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('[IPFS] Fetch error:', error);
    throw error;
  }
}

// Check if IPFS is configured
export function isIPFSConfigured(): boolean {
  return !!PINATA_JWT;
}

// Get IPFS gateway URL for a CID
export function getIPFSUrl(cid: string): string {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}

// Pin existing CID (if uploaded elsewhere)
export async function pinCID(cid: string, name?: string): Promise<IPFSUploadResult> {
  try {
    const client = getPinata();
    
    const result = await client.upload.public.cid(cid, {
      metadata: {
        name: name || `pinned-${cid.slice(0, 16)}`,
      },
    });

    return {
      success: true,
      cid: result.cid,
      url: getIPFSUrl(result.cid),
    };
  } catch (error) {
    console.error('[IPFS] Pin error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'IPFS pin failed',
    };
  }
}
