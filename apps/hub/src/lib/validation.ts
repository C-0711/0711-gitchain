/**
 * GitChain Hub - Input Validation Schemas
 *
 * Uses Zod for runtime type validation and input sanitization.
 */

import { z } from "zod";
import { NextResponse } from "next/server";

// ===========================================
// COMMON SCHEMAS
// ===========================================

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email too long")
  .transform((v) => v.toLowerCase().trim());

// Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .refine(
    (v) => /[A-Z]/.test(v),
    "Password must contain at least one uppercase letter"
  )
  .refine(
    (v) => /[a-z]/.test(v),
    "Password must contain at least one lowercase letter"
  )
  .refine(
    (v) => /[0-9]/.test(v),
    "Password must contain at least one number"
  );

// Simple password (less strict, for login)
export const loginPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .max(128, "Password too long");

// Username validation (alphanumeric + dash, 3-39 chars, GitHub style)
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(39, "Username must be 39 characters or less")
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i,
    "Username must start and end with alphanumeric, can contain dashes"
  )
  .transform((v) => v.toLowerCase());

// Name validation
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name too long")
  .transform((v) => v.trim());

// Organization slug (lowercase, alphanumeric + dash)
export const slugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(50, "Slug must be 50 characters or less")
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    "Slug must be lowercase, start/end with alphanumeric, can contain dashes"
  );

// URL validation
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(500, "URL too long")
  .optional()
  .or(z.literal(""));

// Bio/description (max 500 chars, strip HTML)
export const bioSchema = z
  .string()
  .max(500, "Bio must be 500 characters or less")
  .transform((v) => stripHtml(v).trim())
  .optional();

// UUID validation
export const uuidSchema = z
  .string()
  .uuid("Invalid ID format");

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Sort order
export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

// ===========================================
// AUTH SCHEMAS
// ===========================================

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

// ===========================================
// CONTAINER SCHEMAS
// ===========================================

export const containerTypeSchema = z.enum([
  "product",
  "company",
  "service",
  "location",
  "document",
  "generic",
]);

export const createContainerSchema = z.object({
  type: containerTypeSchema,
  namespace: slugSchema,
  identifier: z.string().min(1).max(255),
  version: z.string().min(1).max(50).optional(),
  data: z.record(z.unknown()).optional(),
  meta: z.record(z.unknown()).optional(),
  visibility: z.enum(["public", "private", "internal"]).default("public"),
});

// ===========================================
// ORGANIZATION SCHEMAS
// ===========================================

export const createOrgSchema = z.object({
  slug: slugSchema,
  name: nameSchema,
  description: bioSchema,
  website: urlSchema,
});

// ===========================================
// USER PROFILE SCHEMAS
// ===========================================

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  username: usernameSchema.optional(),
  bio: bioSchema,
  company: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  website: urlSchema,
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Strip HTML tags from a string (prevent XSS)
 */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Validate request body against a schema.
 * Returns parsed data or a NextResponse with validation errors.
 */
export async function validateBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return {
        error: NextResponse.json(
          {
            error: "Validation failed",
            errors,
          },
          { status: 400 }
        ),
      };
    }

    return { data: result.data };
  } catch (e) {
    return {
      error: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a schema.
 */
export function validateQuery<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): { data: z.infer<T> } | { error: NextResponse } {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return {
      error: NextResponse.json(
        {
          error: "Invalid query parameters",
          errors,
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}
