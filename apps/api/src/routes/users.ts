/**
 * GitChain User Routes
 *
 * User profile, password, session, and public profile endpoints.
 */

import { Router, Request, Response } from "express";

import {
  sendSuccess,
  sendBadRequest,
  sendUnauthorized,
  sendNotFound,
  sendNoContent,
  asyncHandler,
} from "../lib/response.js";
import { AuthService } from "../services/auth.js";
import { ContainerService } from "../services/containers.js";

export function createUsersRouter(
  authService: AuthService,
  containerService: ContainerService
): Router {
  const router = Router();

  // ===========================================
  // CURRENT USER PROFILE
  // ===========================================

  /**
   * GET /user - Get current user profile
   */
  router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user) return sendUnauthorized(res);
      sendSuccess(res, { user });
    })
  );

  /**
   * PATCH /user - Update current user profile
   */
  router.patch(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user) return sendUnauthorized(res);

      const { name, bio, company, location, website } = req.body;

      const updated = await authService.updateProfile(user.id, {
        name,
        bio,
        company,
        location,
        website,
      });

      if (!updated) return sendNotFound(res, "User");

      sendSuccess(res, { user: updated });
    })
  );

  /**
   * PATCH /user/username - Change username
   */
  router.patch(
    "/username",
    asyncHandler(async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user) return sendUnauthorized(res);

      const { username } = req.body;
      if (!username || typeof username !== "string") {
        return sendBadRequest(res, "Username is required");
      }

      const result = await authService.changeUsername(user.id, username.toLowerCase());
      if (!result.success) {
        return sendBadRequest(res, result.error || "Failed to change username");
      }

      const updated = await authService.getUserById(user.id);
      sendSuccess(res, { user: updated });
    })
  );

  // ===========================================
  // PASSWORD
  // ===========================================

  /**
   * POST /user/password - Change password
   */
  router.post(
    "/password",
    asyncHandler(async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user) return sendUnauthorized(res);

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return sendBadRequest(res, "currentPassword and newPassword are required");
      }

      if (newPassword.length < 8) {
        return sendBadRequest(res, "New password must be at least 8 characters");
      }

      const changed = await authService.changePassword(user.id, currentPassword, newPassword);
      if (!changed) {
        return sendBadRequest(res, "Current password is incorrect");
      }

      sendSuccess(res, { message: "Password updated successfully" });
    })
  );

  // ===========================================
  // SESSIONS
  // ===========================================

  /**
   * GET /user/sessions - List active sessions
   */
  router.get(
    "/sessions",
    asyncHandler(async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user) return sendUnauthorized(res);

      // Sessions are JWT-based, so we don't track individual sessions in DB
      // Return a single "current session" indicator
      sendSuccess(res, {
        sessions: [
          {
            id: "current",
            browser: req.headers["user-agent"] || "Unknown",
            ip: req.ip || "Unknown",
            last_active: new Date().toISOString(),
            is_current: true,
          },
        ],
      });
    })
  );

  /**
   * DELETE /user/sessions - Revoke all sessions
   */
  router.delete(
    "/sessions",
    asyncHandler(async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user) return sendUnauthorized(res);

      await authService.revokeAllSessions(user.id);
      sendNoContent(res);
    })
  );

  // ===========================================
  // ACCOUNT DELETION
  // ===========================================

  /**
   * DELETE /user - Delete account
   */
  router.delete(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user) return sendUnauthorized(res);

      const { confirmUsername } = req.body;

      // Safety check
      if (!confirmUsername) {
        return sendBadRequest(res, "Please confirm by providing your username");
      }

      const fullUser = await authService.getUserById(user.id);
      if (!fullUser || fullUser.username !== confirmUsername) {
        return sendBadRequest(res, "Username confirmation does not match");
      }

      await authService.deleteUser(user.id);
      sendSuccess(res, { message: "Account deleted" });
    })
  );

  // ===========================================
  // PUBLIC USER PROFILES
  // ===========================================

  /**
   * GET /users/:username - Public user profile
   */
  router.get(
    "/:username",
    asyncHandler(async (req: Request, res: Response) => {
      const { username } = req.params;

      const profile = await authService.getUserByUsername(username);
      if (!profile) {
        return sendNotFound(res, "User");
      }

      // Get user's public containers
      const containers = await containerService.list({
        visibility: "public",
        limit: 20,
        offset: 0,
        orderBy: "updated_at",
        orderDir: "desc",
      });

      // Filter to only this user's containers
      const userContainers = containers.containers.filter((c) => c.created_by === profile.id);

      sendSuccess(res, {
        user: profile,
        containers: userContainers,
        containerCount: userContainers.length,
      });
    })
  );

  return router;
}
