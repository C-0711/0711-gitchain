/**
 * Tests for the C2PA content authenticity package.
 *
 * Covers:
 *  - Container signing produces a valid manifest
 *  - Manifest verification succeeds for valid signatures
 *  - Manifest verification fails for tampered content
 *  - Manifest serialization roundtrip works
 */

import type { Container } from "@0711/core";
import { describe, it, expect, beforeAll, jest } from "@jest/globals";

import { C2PAService } from "../src/service.js";
import { serializeEnvelope, deserializeEnvelope } from "../src/types.js";
import type { SignatureResult, SignedManifestEnvelope } from "../src/types.js";

// -------------------------------------------------------
// Fixtures
// -------------------------------------------------------

const SIGNING_KEY = "a01b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b";

function makeTestContainer(overrides: Partial<Container> = {}): Container {
  const now = new Date().toISOString();
  return {
    id: "0711:product:bosch:7736606982:v1",
    type: "product",
    namespace: "bosch",
    identifier: "7736606982",
    version: 1,
    meta: {
      name: "Compress 7000i AW 7 OR-S",
      description: "Heat pump outdoor unit",
      createdAt: now,
      updatedAt: now,
      author: "christoph.bertsch",
    },
    data: {
      supplierPid: "7736606982",
      name: "Compress 7000i AW 7 OR-S",
      descriptionShort: "Heat pump outdoor unit",
      features: [{ code: "EF000007", name: "Heating capacity", value: 7, unit: "kW" }],
    },
    citations: [
      {
        documentId: "bosch-datasheet-7736606982",
        confidence: "confirmed",
      },
    ],
    ...overrides,
  } as Container;
}

// -------------------------------------------------------
// Test suites
// -------------------------------------------------------

describe("C2PAService", () => {
  let service: C2PAService;
  let container: Container;

  beforeAll(() => {
    service = new C2PAService({
      signingKey: SIGNING_KEY,
      signer: { name: "TestRunner", url: "https://test.local" },
      claimGenerator: "GitChain-Test/0.0.1",
    });
    container = makeTestContainer();
  });

  // =====================================================
  // Signing
  // =====================================================

  describe("signContainer()", () => {
    it("produces a successful SignatureResult", async () => {
      const result = await service.signContainer(container);

      expect(result.success).toBe(true);
      expect(result.manifest).toBeDefined();
      expect(result.signedData).toBeInstanceOf(Buffer);
      expect(result.envelope).toBeDefined();
    });

    it("manifest contains expected claim metadata", async () => {
      const result = await service.signContainer(container);
      const m = result.manifest;

      expect(m.format).toBe("c2pa");
      expect(m.title).toBe(container.meta.name);
      expect(m.claimGenerator).toBe("GitChain-Test/0.0.1");
      expect(m.claimId).toBeTruthy();
      expect(m.instanceId).toMatch(/^urn:uuid:/);
    });

    it("manifest signature uses HMAC-SHA256 algorithm", async () => {
      const result = await service.signContainer(container);

      expect(result.manifest.signature.algorithm).toBe("HMAC-SHA256");
      expect(result.manifest.signature.issuer).toBe("TestRunner");
      expect(result.manifest.signature.time).toBeTruthy();
    });

    it("includes content hash assertion", async () => {
      const result = await service.signContainer(container);
      const hashAssertion = result.manifest.assertions.find((a) => a.label === "c2pa.hash.data");

      expect(hashAssertion).toBeDefined();
      expect(hashAssertion!.data.name).toBe("sha256");
      expect(typeof hashAssertion!.data.hash).toBe("string");
      expect((hashAssertion!.data.hash as string).length).toBe(64); // hex SHA-256
    });

    it("includes gitchain.container assertion", async () => {
      const result = await service.signContainer(container);
      const gcAssertion = result.manifest.assertions.find((a) => a.label === "gitchain.container");

      expect(gcAssertion).toBeDefined();
      expect(gcAssertion!.data.id).toBe(container.id);
      expect(gcAssertion!.data.type).toBe(container.type);
    });

    it("includes citations as ingredients", async () => {
      const result = await service.signContainer(container);

      expect(result.manifest.ingredients).toBeDefined();
      expect(result.manifest.ingredients!.length).toBe(1);
      expect(result.manifest.ingredients![0].documentId).toBe("bosch-datasheet-7736606982");
      expect(result.manifest.ingredients![0].relationship).toBe("inputTo");
    });

    it("envelope has valid HMAC signature and key fingerprint", async () => {
      const result = await service.signContainer(container);
      const env = result.envelope;

      expect(env.version).toBe(1);
      expect(typeof env.hmacSignature).toBe("string");
      expect(env.hmacSignature.length).toBe(64); // hex HMAC-SHA256
      expect(typeof env.keyFingerprint).toBe("string");
      expect(env.keyFingerprint.length).toBe(64);
    });
  });

  // =====================================================
  // Verification — valid signatures
  // =====================================================

  describe("verifyManifest() — valid signatures", () => {
    let signedData: Buffer;

    beforeAll(async () => {
      const result = await service.signContainer(container);
      signedData = result.signedData;
    });

    it("returns valid=true for an untampered envelope", async () => {
      const verification = await service.verifyManifest(signedData);

      expect(verification.valid).toBe(true);
      expect(verification.manifest).toBeDefined();
      expect(verification.errors).toBeUndefined();
    });

    it("returns the manifest in verification result", async () => {
      const verification = await service.verifyManifest(signedData);

      expect(verification.manifest!.claimId).toBeTruthy();
      expect(verification.manifest!.title).toBe(container.meta.name);
    });
  });

  // =====================================================
  // Verification — tampered content
  // =====================================================

  describe("verifyManifest() — tampered content", () => {
    it("fails when manifest content is altered", async () => {
      const result = await service.signContainer(container);
      const envelope: SignedManifestEnvelope = JSON.parse(result.signedData.toString());

      // Tamper with the manifest title
      envelope.manifest.title = "TAMPERED TITLE";

      const tampered = Buffer.from(JSON.stringify(envelope));
      const verification = await service.verifyManifest(tampered);

      expect(verification.valid).toBe(false);
      expect(verification.errors).toBeDefined();
      expect(verification.errors!.some((e) => e.includes("HMAC"))).toBe(true);
    });

    it("fails when HMAC signature is replaced", async () => {
      const result = await service.signContainer(container);
      const envelope: SignedManifestEnvelope = JSON.parse(result.signedData.toString());

      // Replace HMAC with a bogus value (same length)
      envelope.hmacSignature = "0".repeat(64);

      const tampered = Buffer.from(JSON.stringify(envelope));
      const verification = await service.verifyManifest(tampered);

      expect(verification.valid).toBe(false);
      expect(verification.errors).toBeDefined();
    });

    it("fails when signed with a different key", async () => {
      // Sign with key A
      const serviceA = new C2PAService({
        signingKey: "aa".repeat(32),
        signer: { name: "A", url: "https://a.local" },
      });
      const resultA = await serviceA.signContainer(container);

      // Verify with key B
      const serviceB = new C2PAService({
        signingKey: "bb".repeat(32),
        signer: { name: "B", url: "https://b.local" },
      });
      const verification = await serviceB.verifyManifest(resultA.signedData);

      expect(verification.valid).toBe(false);
      expect(verification.errors).toBeDefined();
    });

    it("returns valid=false for completely invalid data", async () => {
      const garbage = Buffer.from("not json at all");
      const verification = await service.verifyManifest(garbage);

      expect(verification.valid).toBe(false);
      expect(verification.errors).toBeDefined();
    });

    it("returns valid=false for bare unsigned manifest", async () => {
      const bareManifest = Buffer.from(
        JSON.stringify({
          claimId: "test",
          format: "c2pa",
          instanceId: "urn:uuid:test",
          title: "Test",
          claimGenerator: "test",
          signature: { issuer: "test", time: new Date().toISOString(), algorithm: "HMAC-SHA256" },
          assertions: [],
        })
      );
      const verification = await service.verifyManifest(bareManifest);

      expect(verification.valid).toBe(false);
      expect(verification.errors!.some((e) => e.includes("not wrapped"))).toBe(true);
    });
  });

  // =====================================================
  // Serialization roundtrip
  // =====================================================

  describe("manifest serialization roundtrip", () => {
    it("serializeEnvelope/deserializeEnvelope roundtrip preserves data", async () => {
      const result = await service.signContainer(container);
      const original = result.envelope;

      // Serialize to JSON string
      const json = serializeEnvelope(original);
      expect(typeof json).toBe("string");

      // Deserialize back
      const restored = deserializeEnvelope(json);
      expect(restored).not.toBeNull();
      expect(restored!.version).toBe(original.version);
      expect(restored!.hmacSignature).toBe(original.hmacSignature);
      expect(restored!.keyFingerprint).toBe(original.keyFingerprint);
      expect(restored!.manifest.claimId).toBe(original.manifest.claimId);
      expect(restored!.manifest.title).toBe(original.manifest.title);
    });

    it("serialized envelope can be verified after roundtrip", async () => {
      const result = await service.signContainer(container);
      const json = serializeEnvelope(result.envelope);
      const restored = deserializeEnvelope(json);
      expect(restored).not.toBeNull();

      // Re-serialize and verify
      const restoredBuffer = Buffer.from(JSON.stringify(restored));
      const verification = await service.verifyManifest(restoredBuffer);

      expect(verification.valid).toBe(true);
    });

    it("deserializeEnvelope returns null for invalid JSON", () => {
      expect(deserializeEnvelope("not json")).toBeNull();
    });

    it("deserializeEnvelope returns null for wrong structure", () => {
      expect(deserializeEnvelope('{"version": 2}')).toBeNull();
      expect(deserializeEnvelope('{"version": 1}')).toBeNull();
      expect(
        deserializeEnvelope('{"version": 1, "hmacSignature": "abc", "keyFingerprint": "def"}')
      ).toBeNull();
    });

    it("signedData buffer matches serialized envelope", async () => {
      const result = await service.signContainer(container);
      const fromBuffer = JSON.parse(result.signedData.toString());
      const fromEnvelope = JSON.parse(serializeEnvelope(result.envelope));

      expect(fromBuffer).toEqual(fromEnvelope);
    });
  });

  // =====================================================
  // extractManifest
  // =====================================================

  describe("extractManifest()", () => {
    it("extracts manifest from signed envelope", async () => {
      const result = await service.signContainer(container);
      const manifest = service.extractManifest(result.signedData);

      expect(manifest).not.toBeNull();
      expect(manifest!.claimId).toBe(result.manifest.claimId);
    });

    it("returns null for invalid data", () => {
      expect(service.extractManifest(Buffer.from("garbage"))).toBeNull();
    });
  });

  // =====================================================
  // Dev key warning
  // =====================================================

  describe("development key fallback", () => {
    it("signs and verifies with auto-generated dev key when no key configured", async () => {
      // Temporarily remove env var to test dev key path
      const original = process.env.C2PA_SIGNING_KEY;
      delete process.env.C2PA_SIGNING_KEY;

      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      try {
        const devService = new C2PAService({
          signer: { name: "Dev", url: "https://dev.local" },
        });

        const result = await devService.signContainer(container);
        expect(result.success).toBe(true);

        const verification = await devService.verifyManifest(result.signedData);
        expect(verification.valid).toBe(true);

        // Should have warned about dev key
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("No signing key configured"));
      } finally {
        warnSpy.mockRestore();
        if (original !== undefined) {
          process.env.C2PA_SIGNING_KEY = original;
        }
      }
    });
  });
});
