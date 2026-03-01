/**
 * Admin Routes
 *
 * Administrative endpoints for system management, audit logs, and monitoring.
 * Requires admin role.
 */

import { Router, Request, Response } from "express";

import { queryAuditLog, queryAccessLog } from "../lib/audit.js";
import {
  sendSuccess,
  sendPaginated,
  sendUnauthorized,
  sendForbidden,
  asyncHandler,
} from "../lib/response.js";

export function createAdminRouter(): Router {
  const router = Router();

  // Admin auth middleware
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    const user = (req as any).user;

    if (!user) {
      return sendUnauthorized(res);
    }

    // Check for admin role (stored in user record or JWT claims)
    if (!user.is_admin && user.role !== "admin") {
      return sendForbidden(res, "Admin access required");
    }

    next();
  };

  // Apply admin middleware to all routes
  router.use(requireAdmin);

  /**
   * GET /admin/audit
   * Query audit log entries
   */
  router.get(
    "/audit",
    asyncHandler(async (req: Request, res: Response) => {
      const {
        user_id,
        action,
        resource_type,
        resource_id,
        from,
        to,
        limit = "50",
        offset = "0",
        page = "1",
      } = req.query;

      const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const offsetNum = parseInt(offset as string, 10) || (pageNum - 1) * limitNum;

      const result = await queryAuditLog({
        userId: user_id as string | undefined,
        action: action as string | undefined,
        resourceType: resource_type as string | undefined,
        resourceId: resource_id as string | undefined,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        limit: limitNum,
        offset: offsetNum,
      });

      sendPaginated(res, result.entries, {
        total: result.total,
        page: pageNum,
        limit: limitNum,
      });
    })
  );

  /**
   * GET /admin/access-logs
   * Query access log entries
   */
  router.get(
    "/access-logs",
    asyncHandler(async (req: Request, res: Response) => {
      const {
        user_id,
        method,
        path,
        status_code,
        from,
        to,
        limit = "50",
        offset = "0",
        page = "1",
      } = req.query;

      const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const offsetNum = parseInt(offset as string, 10) || (pageNum - 1) * limitNum;

      const result = await queryAccessLog({
        userId: user_id as string | undefined,
        method: method as string | undefined,
        path: path as string | undefined,
        statusCode: status_code ? parseInt(status_code as string, 10) : undefined,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        limit: limitNum,
        offset: offsetNum,
      });

      sendPaginated(res, result.entries, {
        total: result.total,
        page: pageNum,
        limit: limitNum,
      });
    })
  );

  /**
   * GET /admin/stats
   * Get system statistics
   */
  router.get(
    "/stats",
    asyncHandler(async (req: Request, res: Response) => {
      const auditResult = await queryAuditLog({ limit: 1, offset: 0 });
      const accessResult = await queryAccessLog({ limit: 1, offset: 0 });

      sendSuccess(res, {
        timestamp: new Date().toISOString(),
        auditEntries: auditResult.total,
        accessLogEntries: accessResult.total,
      });
    })
  );

  return router;
}
