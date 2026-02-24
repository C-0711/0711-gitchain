/**
 * GitChain Organization Service
 * 
 * CRUD operations for organizations with membership management.
 */

import crypto from "crypto";

// ===========================================
// TYPES
// ===========================================

export type OrgRole = "owner" | "admin" | "maintainer" | "member" | "viewer";
export type OrgPlan = "free" | "pro" | "enterprise";
export type MemberStatus = "pending" | "active" | "suspended";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  website: string | null;
  verified: boolean;
  verified_at: Date | null;
  verified_domains: string[];
  plan: OrgPlan;
  billing_email: string | null;
  sso_provider: string | null;
  sso_config: Record<string, unknown>;
  require_2fa: boolean;
  max_members: number | null;
  max_private_containers: number | null;
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  invited_at: Date;
  accepted_at: Date | null;
  status: MemberStatus;
  created_at: Date;
  // Joined fields
  email?: string;
  name?: string;
  username?: string;
  avatar_url?: string;
}

export interface OrgInvite {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  invited_by: string | null;
  token: string;
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
}

export interface CreateOrgInput {
  slug: string;
  name: string;
  description?: string;
  website?: string;
  userId: string;
}

export interface UpdateOrgInput {
  name?: string;
  description?: string;
  avatar_url?: string;
  website?: string;
  billing_email?: string;
  settings?: Record<string, unknown>;
}

// ===========================================
// DATABASE INTERFACE
// ===========================================

interface DatabaseConnector {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  insert<T>(table: string, data: Record<string, unknown>): Promise<T>;
  execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }>;
}

// ===========================================
// ROLE HIERARCHY
// ===========================================

const ROLE_LEVELS: Record<OrgRole, number> = {
  owner: 5,
  admin: 4,
  maintainer: 3,
  member: 2,
  viewer: 1,
};

function hasMinRole(userRole: OrgRole, minRole: OrgRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[minRole];
}

// ===========================================
// ORGANIZATION SERVICE CLASS
// ===========================================

export class OrganizationService {
  constructor(private db: DatabaseConnector) {}

  // ===========================================
  // CREATE
  // ===========================================

  async create(input: CreateOrgInput): Promise<Organization> {
    const { slug, name, description, website, userId } = input;

    // Check if slug is taken
    const existing = await this.getBySlug(slug);
    if (existing) {
      throw new Error("Organization slug already taken");
    }

    // Create organization
    const org = await this.db.insert<Organization>("organizations", {
      slug: slug.toLowerCase(),
      name,
      description: description || null,
      website: website || null,
      created_by: userId,
    });

    // Add creator as owner
    await this.db.insert("organization_members", {
      org_id: org.id,
      user_id: userId,
      role: "owner",
      invited_by: userId,
      accepted_at: new Date(),
      status: "active",
    });

    // Audit log
    await this.logAudit(org.id, userId, "org.created", "organization", org.id);

    return org;
  }

  // ===========================================
  // READ
  // ===========================================

  async getById(id: string): Promise<Organization | null> {
    return this.db.queryOne<Organization>(
      "SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
  }

  async getBySlug(slug: string): Promise<Organization | null> {
    return this.db.queryOne<Organization>(
      "SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL",
      [slug.toLowerCase()]
    );
  }

  async list(options: { limit?: number; offset?: number } = {}): Promise<{
    organizations: Organization[];
    total: number;
  }> {
    const { limit = 50, offset = 0 } = options;

    const countResult = await this.db.queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM organizations WHERE deleted_at IS NULL"
    );

    const organizations = await this.db.query<Organization>(
      "SELECT * FROM organizations WHERE deleted_at IS NULL ORDER BY name LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    return {
      organizations,
      total: parseInt(countResult?.count || "0", 10),
    };
  }

  async listUserOrgs(userId: string): Promise<(Organization & { role: OrgRole })[]> {
    return this.db.query<Organization & { role: OrgRole }>(
      `SELECT o.*, om.role
       FROM organizations o
       JOIN organization_members om ON o.id = om.org_id
       WHERE om.user_id = $1 AND om.status = 'active' AND o.deleted_at IS NULL
       ORDER BY o.name`,
      [userId]
    );
  }

  // ===========================================
  // UPDATE
  // ===========================================

  async update(id: string, input: UpdateOrgInput, actorId: string): Promise<Organization | null> {
    const org = await this.getById(id);
    if (!org) return null;

    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(input.description);
    }
    if (input.avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      params.push(input.avatar_url);
    }
    if (input.website !== undefined) {
      updates.push(`website = $${paramIndex++}`);
      params.push(input.website);
    }
    if (input.billing_email !== undefined) {
      updates.push(`billing_email = $${paramIndex++}`);
      params.push(input.billing_email);
    }
    if (input.settings !== undefined) {
      updates.push(`settings = $${paramIndex++}`);
      params.push(JSON.stringify(input.settings));
    }

    if (updates.length === 0) return org;

    params.push(id);
    await this.db.execute(
      `UPDATE organizations SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${paramIndex}`,
      params
    );

    await this.logAudit(id, actorId, "org.updated", "organization", id, org, input);

    return this.getById(id);
  }

  async delete(id: string, actorId: string): Promise<boolean> {
    const result = await this.db.execute(
      "UPDATE organizations SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );

    if (result.rowCount > 0) {
      await this.logAudit(id, actorId, "org.deleted", "organization", id);
    }

    return result.rowCount > 0;
  }

  // ===========================================
  // MEMBERS
  // ===========================================

  async getMembers(orgId: string): Promise<OrgMember[]> {
    return this.db.query<OrgMember>(
      `SELECT om.*, u.email, u.name, u.username, u.avatar_url
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.org_id = $1
       ORDER BY 
         CASE om.role 
           WHEN 'owner' THEN 1 
           WHEN 'admin' THEN 2 
           WHEN 'maintainer' THEN 3 
           WHEN 'member' THEN 4 
           ELSE 5 
         END,
         om.created_at`,
      [orgId]
    );
  }

  async getMember(orgId: string, userId: string): Promise<OrgMember | null> {
    return this.db.queryOne<OrgMember>(
      `SELECT om.*, u.email, u.name, u.username, u.avatar_url
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.org_id = $1 AND om.user_id = $2`,
      [orgId, userId]
    );
  }

  async addMember(
    orgId: string,
    userId: string,
    role: OrgRole,
    invitedBy: string
  ): Promise<OrgMember> {
    const member = await this.db.insert<OrgMember>("organization_members", {
      org_id: orgId,
      user_id: userId,
      role,
      invited_by: invitedBy,
      accepted_at: new Date(),
      status: "active",
    });

    await this.logAudit(orgId, invitedBy, "member.added", "user", userId, null, { role });

    return member;
  }

  async updateMemberRole(
    orgId: string,
    userId: string,
    newRole: OrgRole,
    actorId: string
  ): Promise<boolean> {
    const member = await this.getMember(orgId, userId);
    if (!member) return false;

    // Can't change owner role directly
    if (member.role === "owner") {
      throw new Error("Cannot change owner role. Transfer ownership instead.");
    }

    const result = await this.db.execute(
      "UPDATE organization_members SET role = $1, updated_at = NOW() WHERE org_id = $2 AND user_id = $3",
      [newRole, orgId, userId]
    );

    if (result.rowCount > 0) {
      await this.logAudit(orgId, actorId, "member.role_changed", "user", userId, 
        { role: member.role }, { role: newRole });
    }

    return result.rowCount > 0;
  }

  async removeMember(orgId: string, userId: string, actorId: string): Promise<boolean> {
    const member = await this.getMember(orgId, userId);
    if (!member) return false;

    // Can't remove owner
    if (member.role === "owner") {
      throw new Error("Cannot remove owner. Transfer ownership first.");
    }

    const result = await this.db.execute(
      "DELETE FROM organization_members WHERE org_id = $1 AND user_id = $2",
      [orgId, userId]
    );

    if (result.rowCount > 0) {
      await this.logAudit(orgId, actorId, "member.removed", "user", userId);
    }

    return result.rowCount > 0;
  }

  async transferOwnership(orgId: string, newOwnerId: string, currentOwnerId: string): Promise<boolean> {
    // Verify current owner
    const currentMember = await this.getMember(orgId, currentOwnerId);
    if (!currentMember || currentMember.role !== "owner") {
      throw new Error("Only the owner can transfer ownership");
    }

    // Verify new owner is a member
    const newOwnerMember = await this.getMember(orgId, newOwnerId);
    if (!newOwnerMember) {
      throw new Error("New owner must be an existing member");
    }

    // Demote current owner to admin
    await this.db.execute(
      "UPDATE organization_members SET role = 'admin' WHERE org_id = $1 AND user_id = $2",
      [orgId, currentOwnerId]
    );

    // Promote new owner
    await this.db.execute(
      "UPDATE organization_members SET role = 'owner' WHERE org_id = $1 AND user_id = $2",
      [orgId, newOwnerId]
    );

    await this.logAudit(orgId, currentOwnerId, "ownership.transferred", "user", newOwnerId,
      { old_owner: currentOwnerId }, { new_owner: newOwnerId });

    return true;
  }

  // ===========================================
  // INVITES
  // ===========================================

  async createInvite(
    orgId: string,
    email: string,
    role: OrgRole,
    invitedBy: string
  ): Promise<OrgInvite> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await this.db.insert<OrgInvite>("organization_invites", {
      org_id: orgId,
      email: email.toLowerCase(),
      role,
      invited_by: invitedBy,
      token,
      expires_at: expiresAt,
    });

    await this.logAudit(orgId, invitedBy, "invite.created", "invite", invite.id, null, { email, role });

    return invite;
  }

  async getInviteByToken(token: string): Promise<OrgInvite | null> {
    return this.db.queryOne<OrgInvite>(
      "SELECT * FROM organization_invites WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()",
      [token]
    );
  }

  async acceptInvite(token: string, userId: string): Promise<OrgMember | null> {
    const invite = await this.getInviteByToken(token);
    if (!invite) return null;

    // Mark invite as accepted
    await this.db.execute(
      "UPDATE organization_invites SET accepted_at = NOW() WHERE id = $1",
      [invite.id]
    );

    // Add as member
    return this.addMember(invite.org_id, userId, invite.role, invite.invited_by || userId);
  }

  async getPendingInvites(orgId: string): Promise<OrgInvite[]> {
    return this.db.query<OrgInvite>(
      "SELECT * FROM organization_invites WHERE org_id = $1 AND accepted_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC",
      [orgId]
    );
  }

  async cancelInvite(inviteId: string, actorId: string): Promise<boolean> {
    const result = await this.db.execute(
      "DELETE FROM organization_invites WHERE id = $1",
      [inviteId]
    );
    return result.rowCount > 0;
  }

  // ===========================================
  // ACCESS CONTROL
  // ===========================================

  async hasRole(orgId: string, userId: string, minRole: OrgRole): Promise<boolean> {
    const member = await this.getMember(orgId, userId);
    if (!member || member.status !== "active") return false;
    return hasMinRole(member.role, minRole);
  }

  async isOwner(orgId: string, userId: string): Promise<boolean> {
    return this.hasRole(orgId, userId, "owner");
  }

  async isAdmin(orgId: string, userId: string): Promise<boolean> {
    return this.hasRole(orgId, userId, "admin");
  }

  async isMember(orgId: string, userId: string): Promise<boolean> {
    return this.hasRole(orgId, userId, "viewer");
  }

  // ===========================================
  // AUDIT LOG
  // ===========================================

  private async logAudit(
    orgId: string,
    actorId: string | null,
    action: string,
    targetType: string,
    targetId: string,
    oldValue?: unknown,
    newValue?: unknown
  ): Promise<void> {
    await this.db.insert("organization_audit_log", {
      org_id: orgId,
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      old_value: oldValue ? JSON.stringify(oldValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
    });
  }

  async getAuditLog(orgId: string, options: { limit?: number; offset?: number } = {}): Promise<unknown[]> {
    const { limit = 50, offset = 0 } = options;
    return this.db.query(
      `SELECT al.*, u.email as actor_email, u.name as actor_name
       FROM organization_audit_log al
       LEFT JOIN users u ON al.actor_id = u.id
       WHERE al.org_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );
  }

  // ===========================================
  // STATS
  // ===========================================

  async getStats(orgId: string): Promise<{
    member_count: number;
    container_count: number;
    pending_invites: number;
  }> {
    const memberCount = await this.db.queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM organization_members WHERE org_id = $1 AND status = 'active'",
      [orgId]
    );

    const containerCount = await this.db.queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM containers WHERE org_id = $1 AND deleted_at IS NULL",
      [orgId]
    );

    const inviteCount = await this.db.queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM organization_invites WHERE org_id = $1 AND accepted_at IS NULL AND expires_at > NOW()",
      [orgId]
    );

    return {
      member_count: parseInt(memberCount?.count || "0", 10),
      container_count: parseInt(containerCount?.count || "0", 10),
      pending_invites: parseInt(inviteCount?.count || "0", 10),
    };
  }
}
