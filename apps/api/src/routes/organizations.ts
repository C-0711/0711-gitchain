/**
 * GitChain Organization Routes
 * 
 * Organization management endpoints.
 */

import { Router, Request, Response, NextFunction } from "express";
import { OrganizationService, OrgRole } from "../services/organizations.js";

export function createOrganizationsRouter(orgService: OrganizationService): Router {
  const router = Router();

  // ===========================================
  // ORGANIZATION CRUD
  // ===========================================

  /**
   * GET /organizations
   * List all organizations (public)
   */
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit = "50", offset = "0" } = req.query;
      const result = await orgService.list({
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /organizations/mine
   * List current user's organizations
   */
  router.get("/mine", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const organizations = await orgService.listUserOrgs(user.id);
      res.json({ organizations });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /organizations/:slug
   * Get organization by slug
   */
  router.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const user = (req as any).user;

      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Get user's role if authenticated
      const member = user ? await orgService.getMember(org.id, user.id) : null;
      const stats = await orgService.getStats(org.id);

      res.json({ 
        organization: org, 
        role: member?.role || null,
        stats,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /organizations
   * Create new organization
   */
  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug, name, description, website } = req.body;

      if (!slug || !name) {
        return res.status(400).json({ error: "slug and name are required" });
      }

      // Validate slug format
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
        return res.status(400).json({ 
          error: "Invalid slug. Use lowercase letters, numbers, and hyphens only." 
        });
      }

      const org = await orgService.create({
        slug,
        name,
        description,
        website,
        userId: user.id,
      });

      res.status(201).json({ organization: org });
    } catch (err: any) {
      if (err.message === "Organization slug already taken") {
        return res.status(409).json({ error: err.message });
      }
      next(err);
    }
  });

  /**
   * PATCH /organizations/:slug
   * Update organization (requires admin)
   */
  router.patch("/:slug", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug } = req.params;
      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Check admin permission
      const isAdmin = await orgService.isAdmin(org.id, user.id);
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { name, description, avatar_url, website, billing_email, settings } = req.body;

      const updated = await orgService.update(org.id, {
        name,
        description,
        avatar_url,
        website,
        billing_email,
        settings,
      }, user.id);

      res.json({ organization: updated });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /organizations/:slug
   * Delete organization (requires owner)
   */
  router.delete("/:slug", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug } = req.params;
      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Check owner permission
      const isOwner = await orgService.isOwner(org.id, user.id);
      if (!isOwner) {
        return res.status(403).json({ error: "Only the owner can delete an organization" });
      }

      await orgService.delete(org.id, user.id);
      res.json({ message: "Organization deleted" });
    } catch (err) {
      next(err);
    }
  });

  // ===========================================
  // MEMBERS
  // ===========================================

  /**
   * GET /organizations/:slug/members
   * List organization members
   */
  router.get("/:slug/members", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const members = await orgService.getMembers(org.id);
      res.json({ members });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /organizations/:slug/members
   * Add member directly (requires admin)
   */
  router.post("/:slug/members", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug } = req.params;
      const { userId, role = "member" } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Check admin permission
      const isAdmin = await orgService.isAdmin(org.id, user.id);
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Validate role
      const validRoles: OrgRole[] = ["admin", "maintainer", "member", "viewer"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const member = await orgService.addMember(org.id, userId, role, user.id);
      res.status(201).json({ member });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PATCH /organizations/:slug/members/:userId
   * Update member role (requires admin)
   */
  router.patch("/:slug/members/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug, userId: targetUserId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: "role is required" });
      }

      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Check admin permission
      const isAdmin = await orgService.isAdmin(org.id, user.id);
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await orgService.updateMemberRole(org.id, targetUserId, role, user.id);
      res.json({ message: "Role updated" });
    } catch (err: any) {
      if (err.message.includes("owner")) {
        return res.status(400).json({ error: err.message });
      }
      next(err);
    }
  });

  /**
   * DELETE /organizations/:slug/members/:userId
   * Remove member (requires admin, or self-removal)
   */
  router.delete("/:slug/members/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug, userId: targetUserId } = req.params;

      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Check permission: admin or self-removal
      const isAdmin = await orgService.isAdmin(org.id, user.id);
      const isSelf = user.id === targetUserId;
      
      if (!isAdmin && !isSelf) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await orgService.removeMember(org.id, targetUserId, user.id);
      res.json({ message: "Member removed" });
    } catch (err: any) {
      if (err.message.includes("owner")) {
        return res.status(400).json({ error: err.message });
      }
      next(err);
    }
  });

  // ===========================================
  // INVITES
  // ===========================================

  /**
   * GET /organizations/:slug/invites
   * List pending invites (requires admin)
   */
  router.get("/:slug/invites", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug } = req.params;
      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isAdmin = await orgService.isAdmin(org.id, user.id);
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const invites = await orgService.getPendingInvites(org.id);
      res.json({ invites });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /organizations/:slug/invites
   * Create invite (requires admin)
   */
  router.post("/:slug/invites", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug } = req.params;
      const { email, role = "member" } = req.body;

      if (!email) {
        return res.status(400).json({ error: "email is required" });
      }

      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isAdmin = await orgService.isAdmin(org.id, user.id);
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const invite = await orgService.createInvite(org.id, email, role, user.id);
      
      // In production, send email here
      const inviteUrl = `https://gitchain.0711.io/invite/${invite.token}`;
      
      res.status(201).json({ invite, inviteUrl });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /organizations/invites/:token/accept
   * Accept invite
   */
  router.post("/invites/:token/accept", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { token } = req.params;

      const member = await orgService.acceptInvite(token, user.id);
      if (!member) {
        return res.status(404).json({ error: "Invalid or expired invite" });
      }

      res.json({ member, message: "Invite accepted" });
    } catch (err) {
      next(err);
    }
  });

  /**
   * DELETE /organizations/:slug/invites/:inviteId
   * Cancel invite (requires admin)
   */
  router.delete("/:slug/invites/:inviteId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug, inviteId } = req.params;

      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isAdmin = await orgService.isAdmin(org.id, user.id);
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await orgService.cancelInvite(inviteId, user.id);
      res.json({ message: "Invite cancelled" });
    } catch (err) {
      next(err);
    }
  });

  // ===========================================
  // AUDIT LOG
  // ===========================================

  /**
   * GET /organizations/:slug/audit
   * Get audit log (requires admin)
   */
  router.get("/:slug/audit", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { slug } = req.params;
      const { limit = "50", offset = "0" } = req.query;

      const org = await orgService.getBySlug(slug);
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const isAdmin = await orgService.isAdmin(org.id, user.id);
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const entries = await orgService.getAuditLog(org.id, {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });

      res.json({ entries });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
