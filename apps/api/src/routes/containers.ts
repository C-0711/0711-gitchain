/**
 * GitChain Container Routes
 * 
 * Container CRUD endpoints with real database.
 */

import { Router, Request, Response, NextFunction } from "express";
import { ContainerService } from "../services/containers";

export function createContainersRouter(containerService: ContainerService): Router {
  const router = Router();

  /**
   * GET /containers
   * List containers with filtering and pagination
   */
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        type,
        namespace,
        search,
        limit = "50",
        offset = "0",
        orderBy = "created_at",
        orderDir = "desc",
      } = req.query;

      const result = await containerService.list({
        type: type as string | undefined,
        namespace: namespace as string | undefined,
        search: search as string | undefined,
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
   * GET /containers/:id
   * Get single container by ID or container_id
   */
  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      let container;
      
      // Check if it's a UUID or container_id format
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id);
      } else {
        container = await containerService.getById(id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      // Increment view count
      await containerService.incrementStat(container.id, "view_count");

      res.json({ container });
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
      const { type, namespace, identifier, data, meta } = req.body;

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

      const container = await containerService.create({
        type,
        namespace,
        identifier,
        data,
        meta,
        userId: user?.id,
      });

      res.status(201).json({ container });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PUT /containers/:id
   * Update container
   */
  router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { data, meta, message } = req.body;

      // Get container (support both UUID and container_id)
      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id);
      } else {
        container = await containerService.getById(id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      const updated = await containerService.update(container.id, {
        data,
        meta,
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
   * Soft delete container
   */
  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Get container (support both UUID and container_id)
      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id);
      } else {
        container = await containerService.getById(id);
      }

      if (!container) {
        return res.status(404).json({ error: "Container not found" });
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

  /**
   * GET /containers/:id/history
   * Get version history (commits)
   */
  router.get("/:id/history", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Get container
      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id);
      } else {
        container = await containerService.getById(id);
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
      const { id } = req.params;

      // Get container
      let container;
      if (id.startsWith("0711:")) {
        container = await containerService.getByContainerId(id);
      } else {
        container = await containerService.getById(id);
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
