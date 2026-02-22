/**
 * Git repository management using isomorphic-git
 */

import git from "isomorphic-git";
import fs from "fs";
import path from "path";
import type { GitConfig, CommitInfo } from "./types";

export class GitRepository {
  private config: GitConfig;
  private repoPath: string;

  constructor(namespace: string, config: GitConfig) {
    this.config = config;
    this.repoPath = path.join(config.baseDir, namespace);
  }

  /**
   * Initialize repository if it does not exist
   */
  async init(): Promise<void> {
    if (!fs.existsSync(this.repoPath)) {
      fs.mkdirSync(this.repoPath, { recursive: true });
    }

    const gitDir = path.join(this.repoPath, ".git");
    if (!fs.existsSync(gitDir)) {
      await git.init({ fs, dir: this.repoPath, defaultBranch: "main" });
    }
  }

  /**
   * Write a container to the repository
   */
  async writeContainer(
    identifier: string,
    content: object,
    message?: string
  ): Promise<string> {
    await this.init();

    const filePath = path.join(this.repoPath, `${identifier}.json`);
    const relativePath = `${identifier}.json`;

    // Write file
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));

    // Stage file
    await git.add({ fs, dir: this.repoPath, filepath: relativePath });

    // Commit
    const commitMessage = message || `Update container ${identifier}`;
    const hash = await git.commit({
      fs,
      dir: this.repoPath,
      message: commitMessage,
      author: {
        name: this.config.authorName,
        email: this.config.authorEmail,
      },
    });

    return hash;
  }

  /**
   * Read a container from the repository
   */
  async readContainer(identifier: string): Promise<object | null> {
    const filePath = path.join(this.repoPath, `${identifier}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  }

  /**
   * Get commit history for a container
   */
  async getHistory(identifier?: string, limit = 50): Promise<CommitInfo[]> {
    await this.init();

    const commits = await git.log({
      fs,
      dir: this.repoPath,
      depth: limit,
      filepath: identifier ? `${identifier}.json` : undefined,
    });

    return commits.map((commit) => ({
      hash: commit.oid,
      message: commit.commit.message,
      author: commit.commit.author.name,
      email: commit.commit.author.email,
      timestamp: new Date(commit.commit.author.timestamp * 1000),
      parents: commit.commit.parent,
    }));
  }

  /**
   * Get container at specific version
   */
  async readAtCommit(identifier: string, commitHash: string): Promise<object | null> {
    try {
      const { blob } = await git.readBlob({
        fs,
        dir: this.repoPath,
        oid: commitHash,
        filepath: `${identifier}.json`,
      });

      const content = new TextDecoder().decode(blob);
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * List all containers in repository
   */
  async listContainers(): Promise<string[]> {
    await this.init();

    const files = fs.readdirSync(this.repoPath);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  }

  /**
   * Create a tag for a release
   */
  async createTag(tagName: string, message: string): Promise<void> {
    await git.annotatedTag({
      fs,
      dir: this.repoPath,
      ref: tagName,
      message,
      tagger: {
        name: this.config.authorName,
        email: this.config.authorEmail,
      },
    });
  }

  /**
   * Get repository path
   */
  getPath(): string {
    return this.repoPath;
  }
}
