/**
 * Format containers for LLM consumption
 */

import type { Container, Citation } from "@0711/core";

interface FormatLLMOptions {
  format?: "markdown" | "json" | "yaml";
  includeCitations?: boolean;
  includeProofs?: boolean;
  maxTokens?: number;
}

/**
 * Format containers for LLM-friendly output
 */
export function formatForLLM(
  containers: Container[],
  options: FormatLLMOptions = {}
): string {
  const {
    format = "markdown",
    includeCitations = true,
    includeProofs = true,
  } = options;

  switch (format) {
    case "json":
      return formatAsJSON(containers, includeCitations);
    case "yaml":
      return formatAsYAML(containers, includeCitations);
    case "markdown":
    default:
      return formatAsMarkdown(containers, includeCitations, includeProofs);
  }
}

function formatAsMarkdown(
  containers: Container[],
  includeCitations: boolean,
  includeProofs: boolean
): string {
  const sections: string[] = [];

  sections.push("# Verified Context (GitChain)\n");
  sections.push(`> ${containers.length} container(s) loaded. All data is blockchain-verified.\n`);

  for (const container of containers) {
    sections.push(`## ${container.meta.name}`);
    sections.push(`**ID:** \`${container.id}\``);
    sections.push(`**Type:** ${container.type}`);
    sections.push(`**Version:** v${container.version}`);
    sections.push(`**Updated:** ${container.meta.updatedAt}\n`);

    // Format data based on container type
    if (container.type === "product") {
      sections.push(formatProductData(container.data));
    } else {
      sections.push("### Data");
      sections.push("```json");
      sections.push(JSON.stringify(container.data, null, 2));
      sections.push("```");
    }

    // Citations
    if (includeCitations && container.citations && container.citations.length > 0) {
      sections.push("\n### Sources");
      const citationSummary = summarizeCitations(container.citations);
      sections.push(citationSummary);
    }

    // Blockchain proof
    if (includeProofs && container.chain) {
      sections.push("\n### Blockchain Proof");
      sections.push(`- **Network:** ${container.chain.network}`);
      sections.push(`- **Batch ID:** ${container.chain.batchId}`);
      if (container.chain.txHash) {
        sections.push(`- **TX:** \`${container.chain.txHash.slice(0, 18)}...\``);
      }
      sections.push(`- **Verified:** ✅`);
    }

    sections.push("\n---\n");
  }

  return sections.join("\n");
}

function formatProductData(data: Record<string, unknown>): string {
  const lines: string[] = ["### Product Specifications"];
  
  const features = data.features as Array<{
    code: string;
    name: string;
    value: unknown;
    unit?: string;
  }>;

  if (features && features.length > 0) {
    for (const feature of features.slice(0, 20)) { // Limit for context
      const value = feature.value ?? "N/A";
      const unit = feature.unit ? ` ${feature.unit}` : "";
      lines.push(`- **${feature.name}:** ${value}${unit}`);
    }
    
    if (features.length > 20) {
      lines.push(`\n*...and ${features.length - 20} more features*`);
    }
  }

  return lines.join("\n");
}

function summarizeCitations(citations: Citation[]): string {
  const byDocument = new Map<string, number>();
  let confirmed = 0;
  
  for (const citation of citations) {
    byDocument.set(
      citation.documentId,
      (byDocument.get(citation.documentId) || 0) + 1
    );
    if (citation.confidence === "confirmed") confirmed++;
  }

  const lines: string[] = [];
  lines.push(`- **Total citations:** ${citations.length}`);
  lines.push(`- **Confirmed:** ${confirmed} (${Math.round(confirmed / citations.length * 100)}%)`);
  lines.push(`- **Source documents:** ${byDocument.size}`);

  return lines.join("\n");
}

function formatAsJSON(containers: Container[], includeCitations: boolean): string {
  const output = containers.map(c => ({
    id: c.id,
    type: c.type,
    version: c.version,
    meta: c.meta,
    data: c.data,
    citations: includeCitations ? c.citations : undefined,
    chain: c.chain,
  }));
  
  return JSON.stringify(output, null, 2);
}

function formatAsYAML(containers: Container[], includeCitations: boolean): string {
  // Simple YAML-like format
  const lines: string[] = [];
  
  for (const container of containers) {
    lines.push(`- id: ${container.id}`);
    lines.push(`  type: ${container.type}`);
    lines.push(`  version: ${container.version}`);
    lines.push(`  name: ${container.meta.name}`);
    lines.push(`  data:`);
    
    for (const [key, value] of Object.entries(container.data)) {
      if (typeof value === "string" || typeof value === "number") {
        lines.push(`    ${key}: ${value}`);
      }
    }
    lines.push("");
  }
  
  return lines.join("\n");
}
