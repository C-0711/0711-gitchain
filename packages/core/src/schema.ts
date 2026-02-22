/**
 * Container schema validation using Zod
 */

import { z } from "zod";

// Container types enum
export const ContainerTypeSchema = z.enum([
  "product",
  "campaign", 
  "project",
  "memory",
  "knowledge"
]);

// Citation schema
export const CitationSchema = z.object({
  featureCode: z.string().optional(),
  documentId: z.string(),
  documentType: z.string().optional(),
  page: z.number().optional(),
  quote: z.string().optional(),
  confidence: z.enum(["confirmed", "likely", "conflict", "not_found"]),
  auditedAt: z.string().optional(),
  auditedBy: z.string().optional(),
});

// Media reference schema
export const MediaRefSchema = z.object({
  type: z.enum(["image", "document", "video", "cad"]),
  filename: z.string(),
  url: z.string().optional(),
  ipfsCid: z.string().optional(),
  hash: z.string().optional(),
  mimeType: z.string().optional(),
});

// Git info schema
export const GitInfoSchema = z.object({
  repository: z.string(),
  branch: z.string(),
  commit: z.string(),
  commitMessage: z.string().optional(),
  commitAt: z.string(),
});

// Chain proof schema
export const ChainProofSchema = z.object({
  network: z.string(),
  contractAddress: z.string(),
  batchId: z.number(),
  merkleRoot: z.string(),
  merkleProof: z.array(z.string()),
  txHash: z.string().optional(),
  blockNumber: z.number().optional(),
  timestamp: z.string().optional(),
});

// Container metadata schema
export const ContainerMetaSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: z.string(),
  schema: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Base container schema
export const ContainerSchema = z.object({
  id: z.string(),
  type: ContainerTypeSchema,
  namespace: z.string(),
  identifier: z.string(),
  version: z.number(),
  meta: ContainerMetaSchema,
  data: z.record(z.unknown()),
  citations: z.array(CitationSchema).optional(),
  media: z.array(MediaRefSchema).optional(),
  git: GitInfoSchema.optional(),
  chain: ChainProofSchema.optional(),
});

// Product feature schema
export const ProductFeatureSchema = z.object({
  code: z.string(),
  name: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  unit: z.string().optional(),
  source: z.string().optional(),
  confidence: z.string().optional(),
});

// Product container schema
export const ProductContainerSchema = ContainerSchema.extend({
  type: z.literal("product"),
  data: z.object({
    supplierPid: z.string(),
    name: z.string(),
    descriptionShort: z.string().optional(),
    descriptionLong: z.string().optional(),
    productLine: z.string().optional(),
    etimClass: z.string().optional(),
    features: z.array(ProductFeatureSchema),
  }),
});

// Validation helpers
export function validateContainer(data: unknown) {
  return ContainerSchema.safeParse(data);
}

export function validateProductContainer(data: unknown) {
  return ProductContainerSchema.safeParse(data);
}
