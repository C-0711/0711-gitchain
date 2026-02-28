/**
 * IPFS convenience functions
 */

import { getIPFSService } from "./service.js";
import type { IPFSConfig, UploadResult } from "./types.js";

/**
 * Upload JSON to IPFS
 */
export async function uploadJSON(
  data: unknown,
  config?: Partial<IPFSConfig>
): Promise<UploadResult> {
  const service = getIPFSService(config);
  return service.uploadJSON(data);
}

/**
 * Download JSON from IPFS
 */
export async function downloadJSON<T = unknown>(
  cid: string,
  config?: Partial<IPFSConfig>
): Promise<T> {
  const service = getIPFSService(config);
  return service.downloadJSON<T>(cid);
}

/**
 * Upload file to IPFS
 */
export async function uploadFile(
  content: Blob | Buffer,
  filename: string,
  config?: Partial<IPFSConfig>
): Promise<UploadResult> {
  const service = getIPFSService(config);
  return service.uploadFile(content, filename);
}

/**
 * Get gateway URL for CID
 */
export function getGatewayUrl(cid: string, config?: Partial<IPFSConfig>): string {
  const service = getIPFSService(config);
  return service.getGatewayUrl(cid);
}
