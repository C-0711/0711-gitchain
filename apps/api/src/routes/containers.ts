/**
 * GitChain Container Routes
 *
 * Container CRUD endpoints with visibility & access control.
 * Uses standardized API response format.
 */

import { Router, Request, Response } from "express";
import { ContainerService, CollaboratorRole, ContainerVisibility } from "../services/containers.js";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  asyncHandler,
} from "../lib/response.js";

export function createContainersRouter(containerService: ContainerService): Router {
  const router = Router();

  /**
   * GET /containers
   * List containers with filtering and pagination
   * Respects visibility & access control
   */
  router.get("/", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const {
      type,
      namespace,
      search,
      visibility,
      limit = "50",
      offset = "0",
      page = "1",
      orderBy = "created_at",
      orderDir = "desc",
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);
    const offsetNum = parseInt(offset as string, 10) || 0;
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);

    const result = await containerService.list({
      type: type as string | undefined,
      namespace: namespace as string | undefined,
      search: search as string | undefined,
      visibility: visibility as ContainerVisibility | undefined,
      userId: user?.id,
      limit: limitNum,
      offset: offsetNum || (pageNum - 1) * limitNum,
      orderBy: orderBy as string,
      orderDir: orderDir as "asc" | "desc",
    });

    sendPaginated(res, result.containers, {
      total: result.total,
      page: pageNum,
      limit: limitNum,
    });
  }));

  /**
   * GET /containers/mine
   * List current user's containers (owned or collaborated)
   */
  router.get("/mine", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      return sendUnauthorized(res);
    }

    const {
      type,
      visibility,
      limit = "50",
      offset = "0",
      page = "1",
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);

    const result = await containerService.listUserContainers(user.id, {
      type: type as string | undefined,
      visibility: visibility as ContainerVisibility | undefined,
      limit: limitNum,
      offset: parseInt(offset as string, 10) || (pageNum - 1) * limitNum,
    });

    sendPaginated(res, result.containers, {
      total: result.total,
      page: pageNum,
      limit: limitNum,
    });
  }));

  /**
   * GET /containers/:id
   * Get single container by ID or container_id
   */
  router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    let container;

    // Check if it's a UUID or container_id format
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user?.id);
    } else {
      container = await containerService.getById(id, user?.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    // Get user's role
    const role = await containerService.getUserRole(container.id, user?.id);

    // Increment view count
    await containerService.incrementStat(container.id, "view_count");

    // Check if starred
    const starred = user?.id ? await containerService.isStarred(container.id, user.id) : false;

    sendSuccess(res, { container, role, starred });
  }));

  /**
   * POST /containers
   * Create new container
   */
  router.post("/", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { type, namespace, identifier, data, meta, description, visibility = "public" } = req.body;

    // Validation
    if (!type || !namespace || !identifier || !data) {
      return sendBadRequest(res, "type, namespace, identifier, and data are required");
    }

    if (!["product", "campaign", "project", "memory", "knowledge"].includes(type)) {
      return sendBadRequest(res, "Invalid type. Must be: product, campaign, project, memory, or knowledge");
    }

    if (!["public", "private", "internal"].includes(visibility)) {
      return sendBadRequest(res, "Invalid visibility. Must be: public, private, or internal");
    }

    // Private containers require auth
    if (visibility !== "public" && !user) {
      return sendUnauthorized(res, "Authentication required to create private containers");
    }

    const container = await containerService.create({
      type,
      namespace,
      identifier,
      data,
      meta,
      description,
      visibility,
      userId: user?.id,
    });

    sendCreated(res, container);
  }));

  /**
   * PUT /containers/:id
   * Update container (requires write access)
   */
  router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const { data, meta, description, visibility, message } = req.body;

    // Get container (support both UUID and container_id)
    let container;
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user?.id);
    } else {
      container = await containerService.getById(id, user?.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    // Check write access
    const hasAccess = await containerService.canAccess(container.id, user?.id, "write");
    if (!hasAccess) {
      return sendForbidden(res, "Write access required");
    }

    const updated = await containerService.update(container.id, {
      data,
      meta,
      description,
      visibility,
      message,
      userId: user?.id,
    });

    sendSuccess(res, updated);
  }));

  /**
   * DELETE /containers/:id
   * Soft delete container (requires admin access)
   */
  router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    // Get container (support both UUID and container_id)
    let container;
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user?.id);
    } else {
      container = await containerService.getById(id, user?.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    // Check admin/owner access
    const role = await containerService.getUserRole(container.id, user?.id);
    if (role !== "owner" && role !== "admin") {
      return sendForbidden(res, "Owner or admin access required");
    }

    const deleted = await containerService.delete(container.id);
    if (!deleted) {
      return sendNotFound(res, "Container");
    }

    sendNoContent(res);
  }));

  // ===========================================
  // COLLABORATORS
  // ===========================================

  /**
   * GET /containers/:id/collaborators
   * List container collaborators
   */
  router.get("/:id/collaborators", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    let container;
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user?.id);
    } else {
      container = await containerService.getById(id, user?.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    const collaborators = await containerService.getCollaborators(container.id);
    sendSuccess(res, collaborators);
  }));

  /**
   * POST /containers/:id/collaborators
   * Add collaborator (requires admin access)
   */
  router.post("/:id/collaborators", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      return sendUnauthorized(res);
    }

    const { id } = req.params;
    const { userId, role = "read" } = req.body;

    if (!userId) {
      return sendBadRequest(res, "userId is required");
    }

    if (!["admin", "write", "read"].includes(role)) {
      return sendBadRequest(res, "Invalid role. Must be: admin, write, or read");
    }

    let container;
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user.id);
    } else {
      container = await containerService.getById(id, user.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    // Check admin/owner access
    const userRole = await containerService.getUserRole(container.id, user.id);
    if (userRole !== "owner" && userRole !== "admin") {
      return sendForbidden(res, "Admin access required to add collaborators");
    }

    const collaborator = await containerService.addCollaborator(
      container.id,
      userId,
      role as CollaboratorRole,
      user.id
    );

    sendCreated(res, collaborator);
  }));

  /**
   * DELETE /containers/:id/collaborators/:userId
   * Remove collaborator (requires admin access)
   */
  router.delete("/:id/collaborators/:userId", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      return sendUnauthorized(res);
    }

    const { id, userId: targetUserId } = req.params;

    let container;
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user.id);
    } else {
      container = await containerService.getById(id, user.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    // Check admin/owner access (or self-removal)
    const userRole = await containerService.getUserRole(container.id, user.id);
    if (userRole !== "owner" && userRole !== "admin" && user.id !== targetUserId) {
      return sendForbidden(res, "Admin access required");
    }

    await containerService.removeCollaborator(container.id, targetUserId);
    sendNoContent(res);
  }));

  // ===========================================
  // STARS
  // ===========================================

  /**
   * PUT /containers/:id/star
   * Star a container
   */
  router.put("/:id/star", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      return sendUnauthorized(res);
    }

    const { id } = req.params;

    let container;
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user.id);
    } else {
      container = await containerService.getById(id, user.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    await containerService.star(container.id, user.id);
    sendSuccess(res, { starred: true });
  }));

  /**
   * DELETE /containers/:id/star
   * Unstar a container
   */
  router.delete("/:id/star", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      return sendUnauthorized(res);
    }

    const { id } = req.params;

    let container;
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user.id);
    } else {
      container = await containerService.getById(id, user.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    await containerService.unstar(container.id, user.id);
    sendSuccess(res, { starred: false });
  }));

  // ===========================================
  // HISTORY & FILES
  // ===========================================

  /**
   * GET /containers/:id/history
   * Get version history (commits)
   */
  router.get("/:id/history", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    let container;
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user?.id);
    } else {
      container = await containerService.getById(id, user?.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    const history = await containerService.getHistory(container.id);
    sendSuccess(res, history);
  }));

  /**
   * GET /containers/:id/files
   * List files attached to container
   */
  router.get("/:id/files", asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    let container;
    if (id.startsWith("0711:")) {
      container = await containerService.getByContainerId(id, user?.id);
    } else {
      container = await containerService.getById(id, user?.id);
    }

    if (!container) {
      return sendNotFound(res, "Container");
    }

    const files = await containerService.getFiles(container.id);
    sendSuccess(res, files);
  }));

  return router;
}
