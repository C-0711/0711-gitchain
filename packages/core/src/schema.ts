/**
 * Zod schema definitions for GitChain containers
 */

import { z } from "zod";

// Container types
export const ContainerTypeSchema = z.enum([
  "product",
  "campaign",
  "project",
  "memory",
  "knowledge",
]);

export type ContainerType = z.infer<typeof ContainerTypeSchema>;

// Citation schema
export const CitationSchema = z.object({
  documentId: z.string().min(1),
  page: z.number().int().positive().optional(),
  quote: z.string().optional(),
  confidence: z.enum(["confirmed", "likely", "inferred"]),
});

export type Citation = z.infer<typeof CitationSchema>;

// Media schema
export const MediaSchema = z.object({
  url: z.string().url(),
  type: z.string(),
  name: z.string().optional(),
  size: z.number().optional(),
  hash: z.string().optional(),
});

export type Media = z.infer<typeof MediaSchema>;

// Container metadata
export const ContainerMetaSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  author: z.string(),
  tags: z.array(z.string()).optional(),
});

export type ContainerMeta = z.infer<typeof ContainerMetaSchema>;

// Chain proof
export const ChainProofSchema = z.object({
  network: z.string(),
  batchId: z.number().int(),
  txHash: z.string().optional(),
  blockNumber: z.number().int().optional(),
  merkleRoot: z.string().optional(),
  merkleProof: z.array(z.string()).optional(),
});

export type ChainProof = z.infer<typeof ChainProofSchema>;

// Git info
export const GitInfoSchema = z.object({
  repository: z.string(),
  branch: z.string(),
  commit: z.string(),
  commitMessage: z.string().optional(),
  commitAt: z.string().datetime(),
});

export type GitInfo = z.infer<typeof GitInfoSchema>;

// Full container schema
export const ContainerSchema = z.object({
  id: z.string().regex(/^0711:[a-z]+:[a-z0-9-]+:[a-zA-Z0-9-]+:(v\d+|latest)$/),
  type: ContainerTypeSchema,
  namespace: z.string().min(1),
  identifier: z.string().min(1),
  version: z.number().int().positive(),
  meta: ContainerMetaSchema,
  data: z.record(z.unknown()),
  citations: z.array(CitationSchema).optional(),
  media: z.array(MediaSchema).optional(),
  chain: ChainProofSchema.optional(),
  git: GitInfoSchema.optional(),
});

export type Container = z.infer<typeof ContainerSchema>;

// Container ID format: 0711:{type}:{namespace}:{identifier}:{version}
export const ContainerIdSchema = z.string().regex(
  /^0711:(product|campaign|project|memory|knowledge):[a-z0-9-]+:[a-zA-Z0-9-]+:(v\d+|latest)$/,
  "Invalid container ID format. Expected: 0711:{type}:{namespace}:{identifier}:{version}"
);

// Validate a container
export function validateContainer(data: unknown): Container {
  return ContainerSchema.parse(data);
}

// Safely validate (returns result object)
export function safeValidateContainer(data: unknown): z.SafeParseReturnType<unknown, Container> {
  return ContainerSchema.safeParse(data);
}

// Validate container ID
export function validateContainerId(id: string): boolean {
  return ContainerIdSchema.safeParse(id).success;
}
