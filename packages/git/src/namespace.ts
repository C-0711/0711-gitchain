/**
 * Namespace management for GitChain
 */

import fs from "fs";
import path from "path";
import { GitRepository } from "./repository";
import type { GitConfig, NamespaceInfo } from "./types";

const defaultConfig: GitConfig = {
  baseDir: process.env.GITCHAIN_DATA_DIR || "/data/gitchain/repos",
  authorName: "GitChain",
  authorEmail: "system@gitchain.0711.io",
};

/**
 * Create a new namespace
 */
export async function createNamespace(
  type: string,
  namespace: string,
  config: Partial<GitConfig> = {}
): Promise<void> {
  const fullConfig = { ...defaultConfig, ...config };
  const repoNamespace = `${type}/${namespace}`;
  const repo = new GitRepository(repoNamespace, fullConfig);
  await repo.init();

  // Create namespace metadata
  const metaPath = path.join(repo.getPath(), ".gitchain.json");
  const meta = {
    type,
    namespace,
    createdAt: new Date().toISOString(),
    version: "1.0",
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}

/**
 * List all namespaces
 */
export async function listNamespaces(
  type?: string,
  config: Partial<GitConfig> = {}
): Promise<NamespaceInfo[]> {
  const fullConfig = { ...defaultConfig, ...config };
  const baseDir = fullConfig.baseDir;

  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const namespaces: NamespaceInfo[] = [];
  const types = type ? [type] : fs.readdirSync(baseDir);

  for (const t of types) {
    const typeDir = path.join(baseDir, t);
    if (!fs.statSync(typeDir).isDirectory()) continue;

    const nsNames = fs.readdirSync(typeDir);
    for (const ns of nsNames) {
      const nsDir = path.join(typeDir, ns);
      if (!fs.statSync(nsDir).isDirectory()) continue;

      const repo = new GitRepository(`${t}/${ns}`, fullConfig);
      const containers = await repo.listContainers();
      const history = await repo.getHistory(undefined, 1);

      const metaPath = path.join(nsDir, ".gitchain.json");
      let createdAt = new Date();
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        createdAt = new Date(meta.createdAt);
      }

      namespaces.push({
        name: ns,
        type: t,
        containerCount: containers.length,
        lastCommit: history[0],
        createdAt,
      });
    }
  }

  return namespaces;
}
