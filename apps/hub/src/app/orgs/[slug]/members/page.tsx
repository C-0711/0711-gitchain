"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface Member {
  id: string;
  user_id: string;
  role: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  invited_by_name: string | null;
  invited_by_email: string | null;
  expires_at: string;
  created_at: string;
}

const roleBadgeStyle: Record<string, { bg: string; fg: string }> = {
  owner: { bg: "#ffebe9", fg: "#cf222e" },
  admin: { bg: "#fbefff", fg: "#8250df" },
  maintainer: { bg: "#ddf4ff", fg: "#0969da" },
  member: { bg: t.canvas, fg: t.fgMuted },
  viewer: { bg: t.canvas, fg: t.fgMuted },
};

const VALID_ROLES = ["owner", "admin", "maintainer", "member", "viewer"];

export default function OrgMembersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Role editing
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const isAdmin = role === "owner" || role === "admin";

  function getHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const h: HeadersInit = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }

  async function fetchData() {
    try {
      const headers = getHeaders();

      // Fetch org info + members in parallel
      const [orgRes, membersRes] = await Promise.all([
        fetch(`/api/organizations/${slug}`, { headers }),
        fetch(`/api/organizations/${slug}/members`, { headers }),
      ]);

      if (!orgRes.ok) {
        if (orgRes.status === 404) throw new Error("Organization not found");
        throw new Error("Failed to fetch organization");
      }

      const orgData = await orgRes.json();
      setOrgName(orgData.organization.name);
      setRole(orgData.role || null);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      // Fetch invites (admin only — will 403 for non-admins, which is fine)
      try {
        const invitesRes = await fetch(`/api/organizations/${slug}/invite`, { headers });
        if (invitesRes.ok) {
          const invitesData = await invitesRes.json();
          setInvites(invitesData.invites || []);
        }
      } catch {
        // Non-admins can't see invites
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [slug]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);

    try {
      const res = await fetch(`/api/organizations/${slug}/invite`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteMsg({ type: "error", text: data.error || "Failed to send invite" });
        return;
      }

      setInviteMsg({ type: "success", text: `Invite sent to ${inviteEmail}` });
      setInviteEmail("");
      setInviteRole("member");
      // Refresh invites
      fetchData();
    } catch {
      setInviteMsg({ type: "error", text: "Network error" });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/organizations/${slug}/members/${memberId}`, {
        method: "PATCH",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to change role");
        return;
      }

      setEditingMemberId(null);
      fetchData();
    } catch {
      alert("Network error");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from ${orgName}?`)) return;

    try {
      const res = await fetch(`/api/organizations/${slug}/members/${memberId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to remove member");
        return;
      }

      fetchData();
    } catch {
      alert("Network error");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("Revoke this invite?")) return;

    try {
      const res = await fetch(`/api/organizations/${slug}/invite?id=${inviteId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to revoke invite");
        return;
      }

      fetchData();
    } catch {
      alert("Network error");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>
            Loading members...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
          <Card>
            <div style={{ textAlign: "center", padding: 40 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
                Error
              </h3>
              <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 20 }}>{error}</p>
              <Link
                href={`/orgs/${slug}`}
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  backgroundColor: t.accent,
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Back to Organization
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title={`${orgName} — Members`} />

        {/* Invite Form (admin only) */}
        {isAdmin && (
          <Card>
            <SectionTitle>Invite a new member</SectionTitle>
            <form
              onSubmit={handleInvite}
              style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 12 }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{ display: "block", fontSize: 13, color: t.fgMuted, marginBottom: 4 }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 14,
                    backgroundColor: t.canvas,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    color: t.fg,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{ display: "block", fontSize: 13, color: t.fgMuted, marginBottom: 4 }}
                >
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    fontSize: 14,
                    backgroundColor: t.canvas,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    color: t.fg,
                    outline: "none",
                  }}
                >
                  {VALID_ROLES.filter((r) => r !== "owner").map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={inviting}
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: inviting ? t.fgMuted : t.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: inviting ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </form>
            {inviteMsg && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  backgroundColor:
                    inviteMsg.type === "success" ? "rgba(35,134,54,0.1)" : "rgba(248,81,73,0.1)",
                  border: `1px solid ${inviteMsg.type === "success" ? "#238636" : "#f85149"}`,
                  color: inviteMsg.type === "success" ? "#3fb950" : "#f85149",
                }}
              >
                {inviteMsg.text}
              </div>
            )}
          </Card>
        )}

        {/* Members List */}
        <div style={{ marginTop: 24 }}>
          <SectionTitle>Members ({members.length})</SectionTitle>
          <div
            style={{
              backgroundColor: "#fff",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              overflow: "hidden",
              marginTop: 8,
            }}
          >
            {members.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: t.fgMuted, fontSize: 14 }}>
                No members yet
              </div>
            ) : (
              members.map((member, i) => {
                const badge = roleBadgeStyle[member.role] || roleBadgeStyle.member;
                const displayName = member.name || member.username || member.email;

                return (
                  <div
                    key={member.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderBottom: i < members.length - 1 ? `1px solid ${t.border}` : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #238636, #0969da)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: t.fg }}>
                          {displayName}
                        </div>
                        <div style={{ fontSize: 12, color: t.fgMuted }}>{member.email}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {editingMemberId === member.user_id && isAdmin ? (
                        <select
                          defaultValue={member.role}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                          onBlur={() => setEditingMemberId(null)}
                          autoFocus
                          style={{
                            padding: "4px 8px",
                            fontSize: 12,
                            fontFamily: mono,
                            backgroundColor: t.canvas,
                            border: `1px solid ${t.border}`,
                            borderRadius: 6,
                            color: t.fg,
                            outline: "none",
                          }}
                        >
                          {VALID_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => (isAdmin ? setEditingMemberId(member.user_id) : undefined)}
                          style={{
                            padding: "0 8px",
                            fontSize: 11,
                            lineHeight: "22px",
                            borderRadius: 12,
                            fontFamily: mono,
                            textTransform: "capitalize",
                            backgroundColor: badge.bg,
                            color: badge.fg,
                            cursor: isAdmin ? "pointer" : "default",
                          }}
                        >
                          {member.role}
                        </span>
                      )}

                      {isAdmin && member.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id, displayName)}
                          style={{
                            padding: "4px 8px",
                            fontSize: 12,
                            backgroundColor: "transparent",
                            color: "#f85149",
                            border: "1px solid #f85149",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Invites */}
        {isAdmin && invites.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <SectionTitle>Pending Invites ({invites.length})</SectionTitle>
            <div
              style={{
                backgroundColor: "#fff",
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                overflow: "hidden",
                marginTop: 8,
              }}
            >
              {invites.map((inv, i) => (
                <div
                  key={inv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: i < invites.length - 1 ? `1px solid ${t.border}` : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, color: t.fg }}>{inv.email}</div>
                    <div style={{ fontSize: 12, color: t.fgMuted }}>
                      Invited as{" "}
                      <span style={{ fontFamily: mono, textTransform: "capitalize" }}>
                        {inv.role}
                      </span>
                      {inv.invited_by_name && ` by ${inv.invited_by_name}`}
                      {" \u2022 Expires "}
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      backgroundColor: "transparent",
                      color: "#f85149",
                      border: "1px solid #f85149",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
