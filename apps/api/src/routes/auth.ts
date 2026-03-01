/**
 * GitChain Auth Routes
 *
 * Authentication endpoints.
 */

import { Router, Request, Response, NextFunction } from "express";

import { AuthService } from "../services/auth.js";

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  /**
   * POST /auth/register
   */
  router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const result = await authService.register(email, password, name);

      res.status(201).json({
        user: result.user,
        token: result.token,
        expiresAt: result.expiresAt.toISOString(),
      });
    } catch (err: any) {
      if (err.message === "Email already registered") {
        return res.status(409).json({ error: err.message });
      }
      next(err);
    }
  });

  /**
   * POST /auth/login
   */
  router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const result = await authService.login(email, password);

      res.json({
        user: result.user,
        token: result.token,
        expiresAt: result.expiresAt.toISOString(),
      });
    } catch (err: any) {
      if (err.message === "Invalid email or password") {
        return res.status(401).json({ error: err.message });
      }
      next(err);
    }
  });

  /**
   * GET /auth/me
   */
  router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      res.json({ user });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /auth/logout
   */
  router.post("/logout", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (user) {
        await authService.revokeAllSessions(user.id);
      }
      res.json({ message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  });

  // ===========================================
  // API KEYS
  // ===========================================

  /**
   * POST /auth/api-keys
   */
  router.post("/api-keys", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { name, scopes } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const result = await authService.createApiKey(user.id, name, scopes);

      res.status(201).json({
        apiKey: result.apiKey,
        key: result.fullKey, // Only returned once!
        message: "Save this key securely. It won't be shown again.",
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /auth/api-keys
   */
  router.get("/api-keys", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const apiKeys = await authService.listApiKeys(user.id);
      res.json({ apiKeys });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /auth/api-keys/:id
   */
  router.delete("/api-keys/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const revoked = await authService.revokeApiKey(user.id, req.params.id);
      if (!revoked) {
        return res.status(404).json({ error: "API key not found" });
      }

      res.json({ message: "API key revoked" });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
