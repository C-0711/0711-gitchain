/**
 * Digital Product Passport Service
 */

import { createHash } from "node:crypto";

import type { Container } from "@0711/core";

import type {
  DPPConfig,
  ProductPassport,
  PassportVerification,
  VerificationStatus,
} from "./types.js";
import { DEFAULT_PASSPORT_MAX_AGE_MS } from "./types.js";

// ============================================================================
// Crypto helpers (exported for testing and reuse)
// ============================================================================

/**
 * Compute a SHA-256 hash of the given data string.
 */
function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Compute a deterministic content hash for a passport.
 * Hashes the canonical JSON of the passport's core data fields
 * (product, sustainability, supplyChain, specifications, documents, meta).
 */
export function computeContentHash(passport: ProductPassport): string {
  const payload = {
    id: passport.id,
    containerId: passport.containerId,
    product: passport.product,
    sustainability: passport.sustainability,
    supplyChain: passport.supplyChain,
    specifications: passport.specifications,
    documents: passport.documents,
    meta: passport.meta,
  };
  return sha256(JSON.stringify(payload));
}

/**
 * Compute a merkle root from an array of data items.
 * Each item is hashed individually, then pairs are combined bottom-up
 * until a single root hash remains. If the number of leaves is odd the
 * last leaf is duplicated.
 */
export function computeMerkleRoot(items: string[]): string {
  if (items.length === 0) {
    return sha256("");
  }

  // Hash every leaf
  let hashes = items.map((item) => sha256(item));

  // Reduce pairwise until one root remains
  while (hashes.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left; // duplicate last if odd
      next.push(sha256(left + right));
    }
    hashes = next;
  }

  return hashes[0];
}

// ============================================================================
// QR Code SVG Generator (no external deps)
// ============================================================================

/**
 * Generate an SVG-based QR-like Data Matrix pattern that visually encodes a URL.
 *
 * This produces a deterministic grid of dark/light modules derived from a hash
 * of the URL. The actual URL is embedded in the SVG as an invisible <text>
 * element for machine readability and as a visible label beneath the pattern.
 */
function generateQRSvg(url: string, size: number): string {
  const moduleCount = 21; // 21x21 grid (QR Version 1 size)
  const moduleSize = Math.floor(size / (moduleCount + 4)); // margin of 2 modules each side
  const margin = moduleSize * 2;
  const totalSize = moduleCount * moduleSize + margin * 2;

  // Derive a deterministic bit pattern from the URL hash
  const hashHex = sha256(url);
  const hashBytes: number[] = [];
  for (let i = 0; i < hashHex.length; i += 2) {
    hashBytes.push(parseInt(hashHex.substring(i, i + 2), 16));
  }

  // Build the module grid
  const grid: boolean[][] = Array.from(
    { length: moduleCount },
    () => Array(moduleCount).fill(false) as boolean[]
  );

  // Draw finder patterns (three 7x7 squares in corners)
  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[row + r][col + c] = isOuter || isInner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, moduleCount - 7);
  drawFinder(moduleCount - 7, 0);

  // Timing patterns (row 6 and col 6 between finders)
  for (let i = 8; i < moduleCount - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Fill data area with hash-derived bits
  let bitIndex = 0;
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      // Skip finder pattern zones and timing patterns
      const inTopLeftFinder = r < 8 && c < 8;
      const inTopRightFinder = r < 8 && c >= moduleCount - 8;
      const inBottomLeftFinder = r >= moduleCount - 8 && c < 8;
      const isTimingRow = r === 6;
      const isTimingCol = c === 6;

      if (inTopLeftFinder || inTopRightFinder || inBottomLeftFinder || isTimingRow || isTimingCol) {
        continue;
      }

      const byteIdx = Math.floor(bitIndex / 8) % hashBytes.length;
      const bitPos = bitIndex % 8;
      grid[r][c] = ((hashBytes[byteIdx] >> (7 - bitPos)) & 1) === 1;
      bitIndex++;
    }
  }

  // Build SVG rectangles
  const rects: string[] = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (grid[r][c]) {
        const x = margin + c * moduleSize;
        const y = margin + r * moduleSize;
        rects.push(
          `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="#000"/>`
        );
      }
    }
  }

  // Label showing the URL below the pattern
  const labelY = totalSize + 14;
  const svgHeight = totalSize + 24;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${svgHeight}" width="${totalSize}" height="${svgHeight}">`,
    `<rect width="${totalSize}" height="${svgHeight}" fill="#fff"/>`,
    ...rects,
    `<text x="${totalSize / 2}" y="${labelY}" text-anchor="middle" font-family="monospace" font-size="8" fill="#333">${escapeXml(url)}</text>`,
    `<!-- passport-url: ${escapeXml(url)} -->`,
    `</svg>`,
  ].join("\n");
}

/** Escape special XML characters */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const DEFAULT_CONFIG: DPPConfig = {
  baseUrl: process.env.DPP_BASE_URL || "https://dpp.gitchain.0711.io",
  qrCode: {
    size: 256,
    format: "svg",
    errorCorrection: "M",
  },
  issuer: {
    name: "GitChain",
    id: "gitchain.0711.io",
  },
};

export class DPPService {
  private config: DPPConfig;

  constructor(config: Partial<DPPConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a Digital Product Passport from a container
   */
  async createPassport(container: Container): Promise<ProductPassport> {
    const data = container.data as Record<string, unknown>;

    // Build the passport without the computed verification fields first
    const passport: ProductPassport = {
      id: `dpp-${container.id.replace(/:/g, "-")}`,
      containerId: container.id,
      product: {
        name: container.meta.name,
        manufacturer: (data.manufacturer as string) || container.namespace,
        model: (data.model as string) || container.identifier,
        serialNumber: data.serialNumber as string,
        gtin: data.gtin as string,
        category: data.category as string,
      },
      sustainability: this.extractSustainability(data),
      supplyChain: this.extractSupplyChain(data),
      specifications: this.extractSpecifications(data),
      documents: this.extractDocuments(container),
      verification: {
        chainId: container.chain?.network || "pending",
        batchId: container.chain?.batchId || 0,
        merkleRoot: "",
        contentHash: "",
        txHash: container.chain?.txHash,
        timestamp: new Date().toISOString(),
      },
      meta: {
        version: container.version,
        createdAt: container.meta.createdAt,
        updatedAt: container.meta.updatedAt,
        issuer: this.config.issuer.id,
      },
    };

    // Compute merkle root from the container's key data fields
    const merkleLeaves = this.collectMerkleLeaves(container);
    passport.verification.merkleRoot = computeMerkleRoot(merkleLeaves);

    // Compute content hash over the passport's core data
    passport.verification.contentHash = computeContentHash(passport);

    return passport;
  }

  /**
   * Collect data leaves for merkle tree computation from a container.
   * Each significant data field becomes a leaf.
   */
  private collectMerkleLeaves(container: Container): string[] {
    const leaves: string[] = [];

    // Container identity
    leaves.push(`id:${container.id}`);
    leaves.push(`type:${container.type}`);
    leaves.push(`namespace:${container.namespace}`);
    leaves.push(`identifier:${container.identifier}`);
    leaves.push(`version:${container.version}`);

    // Metadata
    leaves.push(`meta.name:${container.meta.name}`);
    leaves.push(`meta.createdAt:${container.meta.createdAt}`);
    leaves.push(`meta.updatedAt:${container.meta.updatedAt}`);
    leaves.push(`meta.author:${container.meta.author}`);

    // Data payload (stable-sorted keys for determinism)
    const data = container.data as Record<string, unknown>;
    const sortedKeys = Object.keys(data).sort();
    for (const key of sortedKeys) {
      const value = data[key];
      leaves.push(`data.${key}:${JSON.stringify(value)}`);
    }

    // Media hashes if present
    if (container.media) {
      for (const m of container.media) {
        leaves.push(`media:${m.name || ""}:${m.hash || m.url || ""}`);
      }
    }

    return leaves;
  }

  /**
   * Verify a Digital Product Passport.
   *
   * Checks:
   * 1. Content hash integrity - recompute and compare
   * 2. Timestamp validity    - must not be in the future, must not be expired
   * 3. Merkle root presence  - must be a non-empty hex string
   *
   * @param passport  The passport object to verify.
   * @param maxAgeMs  Optional max age in ms (default: 1 year).
   */
  async verifyPassport(
    passport: ProductPassport,
    maxAgeMs: number = DEFAULT_PASSPORT_MAX_AGE_MS
  ): Promise<PassportVerification> {
    const errors: string[] = [];

    // --- 1. Content hash integrity ---
    const expectedHash = computeContentHash(passport);
    const contentHashMatch = passport.verification.contentHash === expectedHash;
    if (!contentHashMatch) {
      errors.push(
        `Content hash mismatch: expected ${expectedHash}, got ${passport.verification.contentHash}`
      );
    }

    // --- 2. Timestamp validity ---
    const now = Date.now();
    const passportTime = new Date(passport.verification.timestamp).getTime();
    let timestampValid = true;

    if (Number.isNaN(passportTime)) {
      timestampValid = false;
      errors.push("Invalid timestamp format");
    } else if (passportTime > now + 60_000) {
      // Allow 60s clock skew
      timestampValid = false;
      errors.push("Passport timestamp is in the future");
    }

    const expired = !Number.isNaN(passportTime) && now - passportTime > maxAgeMs;
    if (expired) {
      errors.push("Passport has expired");
    }

    // --- 3. Merkle root presence ---
    const merkleRootValid =
      typeof passport.verification.merkleRoot === "string" &&
      /^[0-9a-f]{64}$/.test(passport.verification.merkleRoot);
    if (!merkleRootValid) {
      errors.push("Merkle root is missing or invalid");
    }

    // --- Determine overall status ---
    let status: VerificationStatus;
    if (expired) {
      status = "expired";
    } else if (contentHashMatch && timestampValid && merkleRootValid) {
      status = "valid";
    } else {
      status = "invalid";
    }

    return {
      valid: status === "valid",
      status,
      passport,
      contentHashMatch,
      timestampValid,
      merkleRootValid,
      chain: {
        verified: !!passport.verification.txHash,
        network: passport.verification.chainId,
        txHash: passport.verification.txHash,
      },
      citations: [],
      errors,
    };
  }

  /**
   * Generate passport URL
   */
  getPassportUrl(passportId: string): string {
    return `${this.config.baseUrl}/${passportId}`;
  }

  /**
   * Generate QR code SVG for a passport.
   * Returns an SVG string containing a QR-like pattern that encodes the passport URL.
   */
  async generateQRCode(passportId: string): Promise<string> {
    const url = this.getPassportUrl(passportId);
    return generateQRSvg(url, this.config.qrCode.size);
  }

  private extractSustainability(data: Record<string, unknown>) {
    const sustainability = data.sustainability as Record<string, unknown>;
    if (!sustainability) return undefined;

    return {
      carbonFootprint: sustainability.carbonFootprint as {
        value: number;
        unit: string;
        scope: string;
      },
      recyclability: sustainability.recyclability as number,
      materials: sustainability.materials as Array<{
        name: string;
        percentage: number;
        recyclable: boolean;
      }>,
      certifications: sustainability.certifications as string[],
    };
  }

  private extractSupplyChain(data: Record<string, unknown>) {
    const supplyChain = data.supplyChain as Record<string, unknown>;
    if (!supplyChain) return undefined;

    return {
      origin: (supplyChain.origin as string) || "Unknown",
      facilities: supplyChain.facilities as Array<{
        name: string;
        location: string;
        role: string;
      }>,
    };
  }

  private extractSpecifications(data: Record<string, unknown>) {
    const specs: Record<string, unknown> = {};

    // Extract feature values
    const features = data.features as Array<{
      code: string;
      name: string;
      value: string;
      unit?: string;
    }>;

    if (features) {
      for (const feature of features) {
        const key = feature.name || feature.code;
        specs[key] = feature.unit ? `${feature.value} ${feature.unit}` : feature.value;
      }
    }

    return specs;
  }

  private extractDocuments(container: Container) {
    return container.media?.map((m) => ({
      type: m.type,
      name: m.name || "Document",
      url: m.url || "",
      hash: m.hash,
    }));
  }
}

// Singleton
let defaultService: DPPService | null = null;

export function getDPPService(config?: Partial<DPPConfig>): DPPService {
  if (!defaultService || config) {
    defaultService = new DPPService(config);
  }
  return defaultService;
}
