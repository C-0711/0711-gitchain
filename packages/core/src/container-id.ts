/**
 * Container ID utilities
 * 
 * Format: 0711:{type}:{namespace}:{identifier}:{version}
 * 
 * Examples:
 *   0711:product:bosch:7736606982:v3
 *   0711:campaign:0711:q1-launch:latest
 *   0711:project:client:migration:v5
 */

import type { ContainerType } from "./types.js";

export interface ParsedContainerId {
  prefix: "0711";
  type: ContainerType;
  namespace: string;
  identifier: string;
  version: string | number;  // "latest" or number
}

export function parseContainerId(id: string): ParsedContainerId {
  const parts = id.split(":");
  
  if (parts.length !== 5) {
    throw new Error(`Invalid container ID format: ${id}. Expected 0711:type:namespace:identifier:version`);
  }
  
  const [prefix, type, namespace, identifier, versionStr] = parts;
  
  if (prefix !== "0711") {
    throw new Error(`Invalid container ID prefix: ${prefix}. Must be "0711"`);
  }
  
  const validTypes: ContainerType[] = ["product", "campaign", "project", "memory", "knowledge"];
  if (!validTypes.includes(type as ContainerType)) {
    throw new Error(`Invalid container type: ${type}. Must be one of: ${validTypes.join(", ")}`);
  }
  
  let version: string | number = versionStr;
  if (versionStr !== "latest") {
    const match = versionStr.match(/^v?(\d+)$/);
    if (match) {
      version = parseInt(match[1], 10);
    }
  }
  
  return {
    prefix: "0711",
    type: type as ContainerType,
    namespace,
    identifier,
    version,
  };
}

export function buildContainerId(
  type: ContainerType,
  namespace: string,
  identifier: string,
  version: number | "latest" = "latest"
): string {
  const versionStr = typeof version === "number" ? `v${version}` : version;
  return `0711:${type}:${namespace}:${identifier}:${versionStr}`;
}

export function isValidContainerId(id: string): boolean {
  try {
    parseContainerId(id);
    return true;
  } catch {
    return false;
  }
}

export function getLatestId(id: string): string {
  const parsed = parseContainerId(id);
  return buildContainerId(parsed.type, parsed.namespace, parsed.identifier, "latest");
}
