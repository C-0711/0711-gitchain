/**
 * @0711/ipfs - IPFS integration for GitChain
 * 
 * Upload and retrieve container metadata from IPFS.
 */

export { IPFSService, getIPFSService } from "./service.js";
export { uploadJSON, downloadJSON, uploadFile, getGatewayUrl } from "./operations.js";
export type { IPFSConfig, UploadResult } from "./types.js";
