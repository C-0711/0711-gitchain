"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

const Ic = {
  Shield: ({ s = 12 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
    </svg>
  ),
  Layers: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0Z" />
    </svg>
  ),
  Gear: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.04.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.103-.303c-.066-.019-.176-.011-.299.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.212.224l-.288 1.107c-.17.645-.716 1.195-1.459 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.065-1.289-.615-1.459-1.26l-.289-1.107c-.017-.066-.078-.158-.211-.224a5.909 5.909 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.049-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.04-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.103.303c.066.019.176.011.299-.071.214-.143.437-.272.668-.386.133-.066.194-.158.212-.224L5.84 1.29c.17-.645.716-1.195 1.459-1.26A8.394 8.394 0 0 1 8 0ZM5.5 8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z" />
    </svg>
  ),
};

interface Organization {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  website: string | null;
  verified: boolean;
  plan: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface OrgContainer {
  id: string;
  uuid: string;
  type: string;
  identifier: string;
  name: string;
  description: string;
  isVerified: boolean;
  stats?: { atoms?: number };
  updatedAt: string;
}

interface Stats {
  member_count: number;
  container_count: number;
  pending_invites: number;
}

const roleBadgeStyle: Record<string, { bg: string; fg: string }> = {
  owner: { bg: "#ffebe9", fg: "#cf222e" },
  admin: { bg: "#fbefff", fg: "#8250df" },
  member: { bg: t.canvas, fg: t.fgMuted },
};

export default function OrganizationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [containers, setContainers] = useState<OrgContainer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrg() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: HeadersInit = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const orgRes = await fetch(`/api/organizations/${slug}`, { headers });
        if (!orgRes.ok) {
          if (orgRes.status === 404) throw new Error("Organization not found");
          throw new Error("Failed to fetch organization");
        }
        const orgData = await orgRes.json();
        setOrg(orgData.organization);
        setRole(orgData.role || null);
        setStats(orgData.stats || null);
        setContainers(orgData.containers || []);

        // Fetch members separately
        try {
          const membersRes = await fetch(`/api/organizations/${slug}/members`, { headers });
          if (membersRes.ok) {
            const membersData = await membersRes.json();
            setMembers(membersData.members || []);
          }
        } catch {
          // Members fetch is optional
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading organization");
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [slug]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>
            Loading organization...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !org) {
    return (
      <AppShell>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
          <div
            style={{
              textAlign: "center",
              padding: 60,
              backgroundColor: "#fff",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
              Organization not found
            </h3>
            <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 20 }}>{error}</p>
            <Link
              href="/explore"
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
              Back to Explore
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const isAdmin = role === "owner" || role === "admin";

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Org Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: "linear-gradient(135deg, #238636, #0969da)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: t.fg, margin: 0 }}>
                  {org.name}
                </h1>
                {org.verified && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      padding: "0 6px",
                      fontSize: 11,
                      fontFamily: mono,
                      lineHeight: "18px",
                      borderRadius: 12,
                      backgroundColor: "#dafbe1",
                      border: "1px solid #aceebb",
                      color: "#1a7f37",
                    }}
                  >
                    <Ic.Shield s={10} /> verified
                  </span>
                )}
                {org.plan && (
                  <span
                    style={{
                      padding: "0 8px",
                      fontSize: 11,
                      fontFamily: mono,
                      lineHeight: "22px",
                      borderRadius: 12,
                      backgroundColor: t.canvas,
                      border: `1px solid ${t.border}`,
                      color: t.fgMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    {org.plan}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: mono, fontSize: 14, color: t.fgMuted }}>@{org.slug}</span>
              {org.description && (
                <p style={{ fontSize: 14, color: t.fgMuted, margin: "6px 0 0", maxWidth: 600 }}>
                  {org.description}
                </p>
              )}
            </div>
          </div>
          {isAdmin && (
            <Link
              href={`/orgs/${slug}/settings`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                backgroundColor: "#fff",
                color: t.fg,
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <Ic.Gear /> Settings
            </Link>
          )}
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Members", value: stats?.member_count || members.length || 0 },
            { label: "Containers", value: stats?.container_count || containers.length || 0 },
            { label: "Pending Invites", value: stats?.pending_invites || 0 },
            { label: "Your Role", value: role || "--" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: "#fff",
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: t.fg,
                  fontFamily: mono,
                  textTransform: "capitalize",
                }}
              >
                {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
              </div>
              <div style={{ fontSize: 13, color: t.fgMuted, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {/* Main content: Members list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <SectionTitle>Members</SectionTitle>
              {isAdmin && (
                <Link
                  href={`/orgs/${slug}/members`}
                  style={{ fontSize: 13, color: t.link, textDecoration: "none" }}
                >
                  Manage members
                </Link>
              )}
            </div>

            {members.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  backgroundColor: "#fff",
                  border: `1px dashed ${t.border}`,
                  borderRadius: 8,
                  color: t.fgMuted,
                  fontSize: 14,
                }}
              >
                No members yet
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#fff",
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {members.map((member, i) => {
                  const badge = roleBadgeStyle[member.role] || roleBadgeStyle.member;
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
                        {/* Avatar */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #238636, #0969da)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {(member.name || member.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: t.fg }}>
                            {member.name || member.username || member.email}
                          </div>
                          <div style={{ fontSize: 12, color: t.fgMuted }}>{member.email}</div>
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "0 8px",
                          fontSize: 11,
                          lineHeight: "22px",
                          borderRadius: 12,
                          fontFamily: mono,
                          textTransform: "capitalize",
                          backgroundColor: badge.bg,
                          color: badge.fg,
                        }}
                      >
                        {member.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Org Containers */}
            {containers.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <SectionTitle>Containers</SectionTitle>
                <div
                  style={{
                    backgroundColor: "#fff",
                    border: `1px solid ${t.border}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {containers.map((c, i) => (
                    <Link
                      key={c.uuid || c.id}
                      href={`/containers/${c.uuid || c.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderBottom: i < containers.length - 1 ? `1px solid ${t.border}` : "none",
                        textDecoration: "none",
                        color: t.fg,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: t.link }}>
                            {c.name || c.identifier}
                          </span>
                          {c.isVerified && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                padding: "0 6px",
                                fontSize: 11,
                                fontFamily: mono,
                                lineHeight: "18px",
                                borderRadius: 12,
                                backgroundColor: "#dafbe1",
                                border: "1px solid #aceebb",
                                color: "#1a7f37",
                              }}
                            >
                              <Ic.Shield s={10} /> verified
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p
                            style={{
                              fontSize: 13,
                              color: t.fgMuted,
                              margin: "4px 0 0",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c.description}
                          </p>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginTop: 4,
                            fontSize: 12,
                            color: t.fgMuted,
                          }}
                        >
                          <span
                            style={{
                              padding: "0 6px",
                              fontSize: 11,
                              lineHeight: "18px",
                              borderRadius: 10,
                              backgroundColor: t.canvas,
                              border: `1px solid ${t.border}`,
                              textTransform: "capitalize",
                            }}
                          >
                            {c.type}
                          </span>
                          <span>{c.stats?.atoms?.toLocaleString() || 0} atoms</span>
                        </div>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill={t.fgMuted}
                        style={{ flexShrink: 0, marginLeft: 12 }}
                      >
                        <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Quick Actions */}
          <div style={{ width: 260, flexShrink: 0 }}>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: t.fg, margin: "0 0 12px" }}>
                Quick Actions
              </h3>
              <div style={{ display: "grid", gap: 8 }}>
                <Link
                  href={`/containers/new?org=${slug}`}
                  style={{
                    display: "block",
                    padding: "10px 14px",
                    textAlign: "center",
                    backgroundColor: t.accent,
                    color: "#fff",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  + New Container
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href={`/orgs/${slug}/members/invite`}
                      style={{
                        display: "block",
                        padding: "10px 14px",
                        textAlign: "center",
                        backgroundColor: "#fff",
                        color: t.fg,
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      Invite Member
                    </Link>
                    <Link
                      href={`/orgs/${slug}/settings`}
                      style={{
                        display: "block",
                        padding: "10px 14px",
                        textAlign: "center",
                        backgroundColor: "#fff",
                        color: t.fg,
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      Settings
                    </Link>
                  </>
                )}
              </div>
            </Card>

            {/* Org Info */}
            <div style={{ marginTop: 16 }}>
              <Card>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: t.fg, margin: "0 0 12px" }}>
                  About
                </h3>
                <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                  {org.website && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8, color: t.fgMuted }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-.025 5.475a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 1 1-2.83-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25Z" />
                      </svg>
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: t.link, textDecoration: "none" }}
                      >
                        {org.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.fgMuted }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z" />
                    </svg>
                    <span>Created {new Date(org.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
