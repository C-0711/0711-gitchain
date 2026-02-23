/**
 * Container ID parsing and generation
 */

export interface ParsedContainerId {
  type: string;
  namespace: string;
  identifier: string;
  version: number | "latest";
}

/**
 * Parse a container ID into its components
 * 
 * @example
 * parseContainerId("0711:product:bosch:7736606982:v3")
 * // { type: "product", namespace: "bosch", identifier: "7736606982", version: 3 }
 */
export function parseContainerId(id: string): ParsedContainerId {
  const parts = id.split(":");

  if (parts.length !== 5 || parts[0] !== "0711") {
    throw new Error(`Invalid container ID format: ${id}`);
  }

  const [, type, namespace, identifier, versionStr] = parts;

  let version: number | "latest";
  if (versionStr === "latest") {
    version = "latest";
  } else if (versionStr.startsWith("v")) {
    version = parseInt(versionStr.slice(1), 10);
    if (isNaN(version)) {
      throw new Error(`Invalid version in container ID: ${versionStr}`);
    }
  } else {
    throw new Error(`Invalid version format: ${versionStr}`);
  }

  return { type, namespace, identifier, version };
}

/**
 * Build a container ID from components
 */
export function buildContainerId(
  type: string,
  namespace: string,
  identifier: string,
  version: number | "latest" = "latest"
): string {
  const versionStr = version === "latest" ? "latest" : `v${version}`;
  return `0711:${type}:${namespace}:${identifier}:${versionStr}`;
}

/**
 * Get the latest version ID for a container
 */
export function toLatestId(id: string): string {
  const parsed = parseContainerId(id);
  return buildContainerId(parsed.type, parsed.namespace, parsed.identifier, "latest");
}

/**
 * Check if ID requests latest version
 */
export function isLatestVersion(id: string): boolean {
  return id.endsWith(":latest");
}

/**
 * Validate container ID format without parsing
 */
export function isValidContainerId(id: string): boolean {
  return /^0711:(product|campaign|project|memory|knowledge):[a-z0-9-]+:[a-zA-Z0-9-]+:(v\d+|latest)$/.test(id);
}
