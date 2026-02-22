/**
 * Format containers for LLM consumption
 */

import type { Container } from "@0711/core";

interface FormatOptions {
  format: "markdown" | "json" | "yaml";
  includeCitations: boolean;
  includeProofs: boolean;
  maxTokens?: number;
}

/**
 * Format containers into LLM-ready context
 */
export function formatContext(
  containers: Container[],
  options: FormatOptions
): string {
  const { format, includeCitations, includeProofs, maxTokens } = options;

  let output: string;

  switch (format) {
    case "json":
      output = formatJSON(containers, { includeCitations, includeProofs });
      break;
    case "yaml":
      output = formatYAML(containers, { includeCitations, includeProofs });
      break;
    case "markdown":
    default:
      output = formatMarkdown(containers, { includeCitations, includeProofs });
  }

  // Truncate if needed
  if (maxTokens) {
    const maxChars = maxTokens * 4;
    if (output.length > maxChars) {
      output = output.slice(0, maxChars) + "\n\n[...truncated]";
    }
  }

  return output;
}

function formatMarkdown(
  containers: Container[],
  opts: { includeCitations: boolean; includeProofs: boolean }
): string {
  const lines: string[] = [];

  lines.push("# Verified Context");
  lines.push("");
  lines.push(\`> \${containers.length} container(s) | Verified by GitChain\`);
  lines.push("");

  for (const container of containers) {
    lines.push(\`## \${container.meta.name}\`);
    lines.push("");
    lines.push(\`**ID:** \\\`\${container.id}\\\`\`);
    lines.push(\`**Type:** \${container.type} | **Version:** v\${container.version}\`);
    lines.push("");

    // Add data
    if (container.data) {
      lines.push("### Data");
      lines.push("");
      formatDataMarkdown(container.data, lines, 0);
      lines.push("");
    }

    // Add citations
    if (opts.includeCitations && container.citations?.length) {
      lines.push("### Sources");
      lines.push("");
      for (const citation of container.citations) {
        const page = citation.page ? \` (p.\${citation.page})\` : "";
        lines.push(\`- \${citation.documentId}\${page} [\${citation.confidence}]\`);
      }
      lines.push("");
    }

    // Add proof
    if (opts.includeProofs && container.chain) {
      lines.push("### Blockchain Proof");
      lines.push("");
      lines.push(\`- **Network:** \${container.chain.network}\`);
      lines.push(\`- **Batch:** \${container.chain.batchId}\`);
      if (container.chain.txHash) {
        lines.push(\`- **TX:** \\\`\${container.chain.txHash}\\\`\`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

function formatDataMarkdown(
  data: unknown,
  lines: string[],
  indent: number
): void {
  const prefix = "  ".repeat(indent);

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === "object" && item !== null) {
        lines.push(\`\${prefix}-\`);
        formatDataMarkdown(item, lines, indent + 1);
      } else {
        lines.push(\`\${prefix}- \${item}\`);
      }
    }
  } else if (typeof data === "object" && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "object" && value !== null) {
        lines.push(\`\${prefix}**\${key}:**\`);
        formatDataMarkdown(value, lines, indent + 1);
      } else {
        lines.push(\`\${prefix}**\${key}:** \${value}\`);
      }
    }
  } else {
    lines.push(\`\${prefix}\${data}\`);
  }
}

function formatJSON(
  containers: Container[],
  opts: { includeCitations: boolean; includeProofs: boolean }
): string {
  const output = containers.map((c) => ({
    id: c.id,
    type: c.type,
    version: c.version,
    meta: c.meta,
    data: c.data,
    ...(opts.includeCitations && c.citations ? { citations: c.citations } : {}),
    ...(opts.includeProofs && c.chain ? { chain: c.chain } : {}),
  }));

  return JSON.stringify(output, null, 2);
}

function formatYAML(
  containers: Container[],
  opts: { includeCitations: boolean; includeProofs: boolean }
): string {
  // Simple YAML formatting (for complex cases, use a library)
  const lines: string[] = [];

  for (const container of containers) {
    lines.push(\`- id: "\${container.id}"\`);
    lines.push(\`  type: \${container.type}\`);
    lines.push(\`  version: \${container.version}\`);
    lines.push(\`  name: "\${container.meta.name}"\`);
    
    if (container.data) {
      lines.push(\`  data:\`);
      formatYAMLData(container.data, lines, 4);
    }

    if (opts.includeCitations && container.citations?.length) {
      lines.push(\`  citations:\`);
      for (const c of container.citations) {
        lines.push(\`    - document: "\${c.documentId}"\`);
        if (c.page) lines.push(\`      page: \${c.page}\`);
        lines.push(\`      confidence: \${c.confidence}\`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

function formatYAMLData(data: unknown, lines: string[], indent: number): void {
  const prefix = " ".repeat(indent);

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === "object" && item !== null) {
        lines.push(\`\${prefix}-\`);
        formatYAMLData(item, lines, indent + 2);
      } else {
        lines.push(\`\${prefix}- \${item}\`);
      }
    }
  } else if (typeof data === "object" && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "object" && value !== null) {
        lines.push(\`\${prefix}\${key}:\`);
        formatYAMLData(value, lines, indent + 2);
      } else if (typeof value === "string") {
        lines.push(\`\${prefix}\${key}: "\${value}"\`);
      } else {
        lines.push(\`\${prefix}\${key}: \${value}\`);
      }
    }
  }
}
