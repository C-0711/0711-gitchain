/**
 * IPFS types
 */

export interface IPFSConfig {
  /** IPFS API endpoint */
  apiUrl: string;
  /** Gateway URL for retrieval */
  gatewayUrl: string;
  /** Pinning service (optional) */
  pinningService?: {
    url: string;
    token: string;
  };
}

export interface UploadResult {
  cid: string;
  size: number;
  url: string;
  pinned: boolean;
}
