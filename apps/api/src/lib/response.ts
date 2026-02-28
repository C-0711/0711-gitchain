/**
 * Standardized API Response Format
 *
 * Success: { data: T, meta?: { total, page, limit } }
 * Error: { error: { code: string, message: string, details?: any } }
 */

import { Response } from "express";

// ============================================
// ERROR CODES
// ============================================

export const ErrorCodes = {
  // Authentication
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_EXPIRED: "AUTH_EXPIRED",
  AUTH_INVALID: "AUTH_INVALID",

  // Authorization
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",

  // Rate Limiting
  RATE_LIMITED: "RATE_LIMITED",

  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",

  // Business Logic
  INVITE_EXPIRED: "INVITE_EXPIRED",
  INVITE_ALREADY_USED: "INVITE_ALREADY_USED",
  CONTAINER_ALREADY_VERIFIED: "CONTAINER_ALREADY_VERIFIED",
  BATCH_PENDING: "BATCH_PENDING",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================
// RESPONSE TYPES
// ============================================

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    field?: string;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

// ============================================
// SUCCESS RESPONSES
// ============================================

/**
 * Send a successful response with data.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): void {
  res.status(statusCode).json({ data });
}

/**
 * Send a successful response with data and pagination metadata.
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { total: number; page: number; limit: number }
): void {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const hasMore = pagination.page < totalPages;

  res.status(200).json({
    data,
    meta: {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      hasMore,
      totalPages,
    },
  });
}

/**
 * Send a created response (201).
 */
export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

/**
 * Send a no content response (204).
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

// ============================================
// ERROR RESPONSES
// ============================================

/**
 * Send an error response.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: unknown
): void {
  const response: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
  res.status(statusCode).json(response);
}

/**
 * Send a validation error with field-level details.
 */
export function sendValidationError(
  res: Response,
  errors: Array<{ field: string; message: string }>
): void {
  res.status(400).json({
    error: {
      code: ErrorCodes.VALIDATION_ERROR,
      message: "Validation failed",
      details: errors,
    },
  });
}

// ============================================
// COMMON ERROR HELPERS
// ============================================

export function sendBadRequest(res: Response, message: string, details?: unknown): void {
  sendError(res, 400, ErrorCodes.INVALID_INPUT, message, details);
}

export function sendUnauthorized(res: Response, message: string = "Authentication required"): void {
  sendError(res, 401, ErrorCodes.AUTH_REQUIRED, message);
}

export function sendTokenExpired(res: Response): void {
  sendError(res, 401, ErrorCodes.AUTH_EXPIRED, "Token has expired");
}

export function sendForbidden(res: Response, message: string = "Access denied"): void {
  sendError(res, 403, ErrorCodes.FORBIDDEN, message);
}

export function sendNotFound(res: Response, resource: string = "Resource"): void {
  sendError(res, 404, ErrorCodes.NOT_FOUND, `${resource} not found`);
}

export function sendConflict(res: Response, message: string): void {
  sendError(res, 409, ErrorCodes.CONFLICT, message);
}

export function sendAlreadyExists(res: Response, resource: string): void {
  sendError(res, 409, ErrorCodes.ALREADY_EXISTS, `${resource} already exists`);
}

export function sendRateLimited(res: Response, retryAfter: number): void {
  res.setHeader("Retry-After", retryAfter.toString());
  sendError(res, 429, ErrorCodes.RATE_LIMITED, "Too many requests, please try again later");
}

export function sendInternalError(res: Response, message: string = "Internal server error"): void {
  sendError(res, 500, ErrorCodes.INTERNAL_ERROR, message);
}

export function sendServiceUnavailable(res: Response, message: string = "Service temporarily unavailable"): void {
  sendError(res, 503, ErrorCodes.SERVICE_UNAVAILABLE, message);
}

// ============================================
// ERROR CLASS
// ============================================

/**
 * Custom API error class for throwing structured errors.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  toResponse(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined && { details: this.details }),
      },
    };
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, ErrorCodes.INVALID_INPUT, message, details);
  }

  static unauthorized(message: string = "Authentication required"): ApiError {
    return new ApiError(401, ErrorCodes.AUTH_REQUIRED, message);
  }

  static forbidden(message: string = "Access denied"): ApiError {
    return new ApiError(403, ErrorCodes.FORBIDDEN, message);
  }

  static notFound(resource: string = "Resource"): ApiError {
    return new ApiError(404, ErrorCodes.NOT_FOUND, `${resource} not found`);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, ErrorCodes.CONFLICT, message);
  }

  static internal(message: string = "Internal server error"): ApiError {
    return new ApiError(500, ErrorCodes.INTERNAL_ERROR, message);
  }
}

// ============================================
// ASYNC HANDLER WRAPPER
// ============================================

import { Request, NextFunction, RequestHandler } from "express";

/**
 * Wrap async route handlers to catch errors automatically.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================
// ERROR HANDLER MIDDLEWARE
// ============================================

/**
 * Express error handler middleware that uses standard response format.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Already sent response
  if (res.headersSent) {
    return next(err);
  }

  // API Error (thrown intentionally)
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  // Validation errors (from zod or similar)
  if (err.name === "ZodError" && "issues" in err) {
    const zodErr = err as { issues: Array<{ path: string[]; message: string }> };
    sendValidationError(
      res,
      zodErr.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }))
    );
    return;
  }

  // JSON parse errors
  if (err instanceof SyntaxError && "body" in err) {
    sendBadRequest(res, "Invalid JSON in request body");
    return;
  }

  // Log unexpected errors (import logger dynamically to avoid circular deps)
  const requestId = (req as any).requestId;
  console.error(JSON.stringify({
    level: "error",
    time: new Date().toISOString(),
    msg: "Unhandled error",
    requestId,
    error: err.message,
    stack: err.stack,
  }));

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== "production";
  sendInternalError(
    res,
    isDev ? err.message : "An unexpected error occurred"
  );
}
