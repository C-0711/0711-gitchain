/**
 * @0711/ipfs - IPFS integration for GitChain
 * 
 * Upload and retrieve container metadata from IPFS.
 */

export { IPFSService, getIPFSService } from "./service";
export { uploadJSON, downloadJSON, uploadFile, getGatewayUrl } from "./operations";
export type { IPFSConfig, UploadResult } from "./types";
