/**
 * GitChain Container Routes
 * 
 * Container CRUD endpoints with visibility & access control.
 */

import { Router, Request, Response, NextFunction } from "express";
import { ContainerService, CollaboratorRole, ContainerVisibility } from "../services/containers";

export function createContainersRouter(containerService: ContainerService): Router {
  const router = Router();

  /**
   * GET /containers
   * List containers with filtering and pagination
   * Respects visibility & access control
   */
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const {
        type,
        namespace,
        search,
        visibility,
        limit = "50",
        offset = "0",
        orderBy = "created_at",
        orderDir = "desc",
      } = req.query;

      const result = await containerService.list({
        type: type as string | undefined,
        namespace: namespace as string | undefined,
        search: search as string | undefined,
        visibility: visibility as ContainerVisibility | undefined,
        userId: user?.id,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        orderBy: orderBy as string,
        orderDir: orderDir as "asc" | "desc",
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /containers/mine
   * List current user's containers (owned or collaborated)
   */
  router.get("/mine", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const {
        type,
        visibility,
        limit = "50",
        offset = "0",
      } = req.query;

      const result = await containerService.listUserContainers(user.id, {
        type: type as string | undefined,
        visibility: visibility as ContainerVisibility | undefined,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /containers/:id
   * Get single container by ID or container_id
   */
  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        return res.status(404).json({ error: "Container not found" });
      }

      // Get user's role
      const role = await containerService.getUserRole(container.id, user?.id);

      // Increment view count
      await containerService.incrementStat(container.id, "view_count");

      // Check if starred
      const starred = user?.id ? await containerService.isStarred(container.id, user.id) : false;

      res.json({ container, role, starred });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /containers
   * Create new container
   */
  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { type, namespace, identifier, data, meta, description, visibility = "public" } = req.body;

      // Validation
      if (!type || !namespace || !identifier || !data) {
        return res.status(400).json({
          error: "type, namespace, identifier, and data are required",
        });
      }

      if (!["product", "campaign", "project", "memory", "knowledge"].includes(type)) {
        return res.status(400).json({
          error: "Invalid type. Must be: product, campaign, project, memory, or knowledge",
        });
      }

      if (!["public", "private", "internal"].includes(visibility)) {
        return res.status(400).json({
          error: "Invalid visibility. Must be: public, private, or internal",
        });
      }

      // Private containers require auth
      if (visibility !== "public" && !user) {
        return res.status(401).json({
          error: "Authentication required to create private containers",
        });
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

      res.status(201).json({ container });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PUT /containers/:id
   * Update container (requires write access)
   */
  router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        return res.status(404).json({ error: "Container not found" });
      }

      // Check write access
      const hasAccess = await containerService.canAccess(container.id, user?.id, "write");
      if (!hasAccess) {
        return res.status(403).json({ error: "Write access required" });
      }

      const updated = await containerService.update(container.id, {
        data,
        meta,
        description,
        visibility,
        message,
        userId: user?.id,
      });

      res.json({ container: updated });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /containers/:id
   * Soft delete container (requires admin access)
   */
  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        return res.status(404).json({ error: "Container not found" });
      }

      // Check admin/owner access
      const role = await containerService.getUserRole(container.id, user?.id);
      if (role !== "owner" && role !== "admin") {
        return res.status(403).json({ error: "Owner or admin access required" });
      }

      const deleted = await containerService.delete(container.id);
      if (!deleted) {
        return res.status(404).json({ error: "Container not found" });
      }

      res.json({ message: "Container deleted" });
    } catch (err) {
      next(err);
    }
  });

  // ===========================================
  // COLLABORATORS
  // ===========================================

  /**
   * GET /containers/:id/collaborators
   * List container collaborators
   */
  router.get("/:id/collaborators", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id, user?.id);
      } else {
        container = await containerService.getById(id, user?.id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      const collaborators = await containerService.getCollaborators(container.id);
      res.json({ collaborators });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /containers/:id/collaborators
   * Add collaborator (requires admin access)
   */
  router.post("/:id/collaborators", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const { userId, role = "read" } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      if (!["admin", "write", "read"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be: admin, write, or read" });
      }

      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id, user.id);
      } else {
        container = await containerService.getById(id, user.id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      // Check admin/owner access
      const userRole = await containerService.getUserRole(container.id, user.id);
      if (userRole !== "owner" && userRole !== "admin") {
        return res.status(403).json({ error: "Admin access required to add collaborators" });
      }

      const collaborator = await containerService.addCollaborator(
        container.id,
        userId,
        role as CollaboratorRole,
        user.id
      );

      res.status(201).json({ collaborator });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /containers/:id/collaborators/:userId
   * Remove collaborator (requires admin access)
   */
  router.delete("/:id/collaborators/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id, userId: targetUserId } = req.params;

      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id, user.id);
      } else {
        container = await containerService.getById(id, user.id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      // Check admin/owner access (or self-removal)
      const userRole = await containerService.getUserRole(container.id, user.id);
      if (userRole !== "owner" && userRole !== "admin" && user.id !== targetUserId) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await containerService.removeCollaborator(container.id, targetUserId);
      res.json({ message: "Collaborator removed" });
    } catch (err) {
      next(err);
    }
  });

  // ===========================================
  // STARS
  // ===========================================

  /**
   * PUT /containers/:id/star
   * Star a container
   */
  router.put("/:id/star", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;

      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id, user.id);
      } else {
        container = await containerService.getById(id, user.id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      await containerService.star(container.id, user.id);
      res.json({ starred: true });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /containers/:id/star
   * Unstar a container
   */
  router.delete("/:id/star", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;

      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id, user.id);
      } else {
        container = await containerService.getById(id, user.id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      await containerService.unstar(container.id, user.id);
      res.json({ starred: false });
    } catch (err) {
      next(err);
    }
  });

  // ===========================================
  // HISTORY & FILES
  // ===========================================

  /**
   * GET /containers/:id/history
   * Get version history (commits)
   */
  router.get("/:id/history", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id, user?.id);
      } else {
        container = await containerService.getById(id, user?.id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      const history = await containerService.getHistory(container.id);
      res.json({ history });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /containers/:id/files
   * List files attached to container
   */
  router.get("/:id/files", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id, user?.id);
      } else {
        container = await containerService.getById(id, user?.id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      const files = await containerService.getFiles(container.id);
      res.json({ files });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
