/**
 * Search routes
 */

import fs from "fs";
import path from "path";

import { parseContainerId } from "@0711/core";
import { GitRepository } from "@0711/git";
import { Router } from "express";
import type { Router as IRouter } from "express";

const router: IRouter = Router();

const gitConfig = {
  baseDir: process.env.GITCHAIN_DATA_DIR || "/data/gitchain/repos",
  authorName: "GitChain API",
  authorEmail: "api@gitchain.0711.io",
};

interface SearchResult {
  id: string;
  type: string;
  namespace: string;
  identifier: string;
  version: number;
  name: string;
  score: number;
  highlights?: string[];
}

/**
 * GET /search - Search containers
 */
router.get("/", async (req, res) => {
  try {
    const { q, type, namespace, limit = 20, offset = 0 } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter q required" });
    }

    const query = q.toLowerCase();
    const results: SearchResult[] = [];

    // Scan through repositories
    const baseDir = gitConfig.baseDir;
    if (!fs.existsSync(baseDir)) {
      return res.json({ results: [], total: 0, query: q });
    }

    const types = type
      ? [type as string]
      : fs.readdirSync(baseDir).filter((f) => fs.statSync(path.join(baseDir, f)).isDirectory());

    for (const t of types) {
      const typeDir = path.join(baseDir, t);
      if (!fs.existsSync(typeDir)) continue;

      const namespaces = namespace
        ? [namespace as string]
        : fs.readdirSync(typeDir).filter((f) => fs.statSync(path.join(typeDir, f)).isDirectory());

      for (const ns of namespaces) {
        const nsDir = path.join(typeDir, ns);
        if (!fs.existsSync(nsDir)) continue;

        const files = fs.readdirSync(nsDir).filter((f) => f.endsWith(".json"));

        for (const file of files) {
          try {
            const filePath = path.join(nsDir, file);
            const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            const identifier = file.replace(".json", "");

            // Simple text search in name, description, and data
            const searchText = JSON.stringify(content).toLowerCase();
            const name = content.meta?.name || identifier;

            if (searchText.includes(query) || name.toLowerCase().includes(query)) {
              const repo = new GitRepository(`${t}/${ns}`, gitConfig);
              const history = await repo.getHistory(identifier, 1);
              const version = history.length;

              // Calculate simple relevance score
              let score = 0;
              if (name.toLowerCase().includes(query)) score += 10;
              if (identifier.toLowerCase().includes(query)) score += 5;
              score += (searchText.match(new RegExp(query, "g")) || []).length;

              results.push({
                id: `0711:${t}:${ns}:${identifier}:v${version}`,
                type: t,
                namespace: ns,
                identifier,
                version,
                name,
                score,
              });
            }
          } catch {
            // Skip invalid files
          }
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Apply pagination
    const total = results.length;
    const paged = results.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      results: paged,
      total,
      query: q,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /search/suggest - Autocomplete suggestions from database
 */
router.get("/suggest", async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== "string" || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const limitNum = Math.min(Number(limit) || 10, 20);

    // Search containers by name pattern using database
    const baseDir = gitConfig.baseDir;
    const suggestions: Array<{ text: string; type: string; id: string }> = [];

    if (!fs.existsSync(baseDir)) {
      return res.json({ suggestions: [], query: q });
    }

    const query = q.toLowerCase();
    const types = fs.readdirSync(baseDir).filter((f) => {
      try {
        return fs.statSync(path.join(baseDir, f)).isDirectory();
      } catch {
        return false;
      }
    });

    outer: for (const t of types) {
      const typeDir = path.join(baseDir, t);
      if (!fs.existsSync(typeDir)) continue;

      const namespaces = fs.readdirSync(typeDir).filter((f) => {
        try {
          return fs.statSync(path.join(typeDir, f)).isDirectory();
        } catch {
          return false;
        }
      });

      for (const ns of namespaces) {
        const nsDir = path.join(typeDir, ns);
        if (!fs.existsSync(nsDir)) continue;

        const files = fs.readdirSync(nsDir).filter((f) => f.endsWith(".json"));

        for (const file of files) {
          const identifier = file.replace(".json", "");
          if (identifier.toLowerCase().includes(query) || ns.toLowerCase().includes(query)) {
            try {
              const content = JSON.parse(fs.readFileSync(path.join(nsDir, file), "utf-8"));
              const name = content.meta?.name || identifier;
              suggestions.push({
                text: name,
                type: t,
                id: `0711:${t}:${ns}:${identifier}`,
              });
              if (suggestions.length >= limitNum) break outer;
            } catch {
              /* skip */
            }
          }
        }
      }
    }

    res.json({ suggestions, query: q });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
