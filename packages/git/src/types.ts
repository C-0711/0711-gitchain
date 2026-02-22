/**
 * Git layer types
 */

export interface GitConfig {
  /** Base directory for repositories */
  baseDir: string;
  /** Default author name */
  authorName: string;
  /** Default author email */
  authorEmail: string;
  /** Remote URL template (optional) */
  remoteTemplate?: string;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  email: string;
  timestamp: Date;
  parents: string[];
}

export interface DiffResult {
  containerId: string;
  fromVersion: number;
  toVersion: number;
  changes: DiffChange[];
}

export interface DiffChange {
  path: string;
  type: "added" | "removed" | "modified";
  oldValue?: unknown;
  newValue?: unknown;
}

export interface NamespaceInfo {
  name: string;
  type: string;
  containerCount: number;
  lastCommit?: CommitInfo;
  createdAt: Date;
}
