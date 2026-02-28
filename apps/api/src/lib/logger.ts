/**
 * Structured Logging with Pino
 *
 * JSON-formatted logs for production, pretty logs for development.
 * Includes request correlation IDs and automatic sensitive data masking.
 */

import { Request, Response, NextFunction } from "express";

// ============================================
// LOG LEVELS
// ============================================

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

// ============================================
// CONFIGURATION
// ============================================

interface LoggerConfig {
  level: LogLevel;
  prettyPrint: boolean;
  serviceName: string;
  version: string;
}

const config: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || "info",
  prettyPrint: process.env.NODE_ENV !== "production",
  serviceName: process.env.SERVICE_NAME || "gitchain-api",
  version: process.env.API_VERSION || "1.0",
};

// ============================================
// SENSITIVE DATA MASKING
// ============================================

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "jwt",
  "credential",
  "private_key",
  "privateKey",
];

function maskSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 10) return obj; // Prevent infinite recursion

  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item, depth + 1));
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      masked[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

// ============================================
// LOGGER CLASS
// ============================================

class Logger {
  private minLevel: number;

  constructor() {
    this.minLevel = LOG_LEVELS[config.level];
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();
    const maskedData = data ? maskSensitiveData(data) : undefined;

    const logObject = {
      level,
      time: timestamp,
      service: config.serviceName,
      version: config.version,
      msg: message,
      ...(maskedData as Record<string, unknown> | undefined),
    };

    if (config.prettyPrint) {
      return this.prettyFormat(level, timestamp, message, maskedData);
    }

    return JSON.stringify(logObject);
  }

  private prettyFormat(
    level: LogLevel,
    timestamp: string,
    message: string,
    data?: unknown
  ): string {
    const colors: Record<LogLevel, string> = {
      trace: "\x1b[90m", // gray
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m", // green
      warn: "\x1b[33m", // yellow
      error: "\x1b[31m", // red
      fatal: "\x1b[35m", // magenta
    };
    const reset = "\x1b[0m";
    const color = colors[level];
    const timeStr = timestamp.split("T")[1].slice(0, 12);

    let output = `${color}[${timeStr}] ${level.toUpperCase().padEnd(5)}${reset} ${message}`;

    if (data && Object.keys(data as object).length > 0) {
      output += ` ${JSON.stringify(data)}`;
    }

    return output;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, data);

    if (level === "error" || level === "fatal") {
      console.error(formatted);
    } else if (level === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  trace(message: string, data?: Record<string, unknown>): void {
    this.log("trace", message, data);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }

  fatal(message: string, data?: Record<string, unknown>): void {
    this.log("fatal", message, data);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, context);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private context: Record<string, unknown>
  ) {}

  private merge(data?: Record<string, unknown>): Record<string, unknown> {
    return { ...this.context, ...data };
  }

  trace(message: string, data?: Record<string, unknown>): void {
    this.parent.trace(message, this.merge(data));
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.parent.debug(message, this.merge(data));
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.parent.info(message, this.merge(data));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.parent.warn(message, this.merge(data));
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.parent.error(message, this.merge(data));
  }

  fatal(message: string, data?: Record<string, unknown>): void {
    this.parent.fatal(message, this.merge(data));
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const logger = new Logger();

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================

export interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Express middleware for structured request logging.
 * Logs request start, completion, and errors.
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const requestId = (req as any).requestId || "-";
    const user = (req as any).user;

    const context: RequestLogContext = {
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.get("user-agent"),
      userId: user?.id,
    };

    // Log request start (debug level)
    logger.debug("Request started", context);

    // Capture response finish
    res.on("finish", () => {
      const duration = Date.now() - start;
      const logData = {
        ...context,
        statusCode: res.statusCode,
        duration_ms: duration,
        contentLength: res.get("content-length"),
      };

      // Log level based on status code
      if (res.statusCode >= 500) {
        logger.error("Request failed", logData);
      } else if (res.statusCode >= 400) {
        logger.warn("Request client error", logData);
      } else {
        logger.info("Request completed", logData);
      }
    });

    // Capture response close (client disconnect)
    res.on("close", () => {
      if (!res.writableEnded) {
        const duration = Date.now() - start;
        logger.warn("Request aborted", {
          ...context,
          duration_ms: duration,
        });
      }
    });

    next();
  };
}

// ============================================
// ERROR LOGGING
// ============================================

/**
 * Log an error with stack trace.
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  logger.error(error.message, {
    ...context,
    errorName: error.name,
    stack: error.stack,
  });
}

// ============================================
// DATABASE QUERY LOGGING
// ============================================

/**
 * Log a database query (debug level).
 */
export function logQuery(
  sql: string,
  params: unknown[] | undefined,
  duration: number,
  requestId?: string
): void {
  // Mask parameters that might contain sensitive data
  const maskedParams = params ? maskSensitiveData(params) : undefined;

  logger.debug("Database query", {
    requestId,
    sql: sql.substring(0, 200), // Truncate long queries
    params: maskedParams,
    duration_ms: duration,
  });
}

// ============================================
// AUDIT LOGGING
// ============================================

export interface AuditLogEntry {
  action: string;
  userId?: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ip?: string;
  requestId?: string;
}

/**
 * Log an audit event (always logs at info level).
 */
export function logAudit(entry: AuditLogEntry): void {
  logger.info("Audit event", {
    audit: true,
    ...entry,
    details: maskSensitiveData(entry.details),
  });
}
