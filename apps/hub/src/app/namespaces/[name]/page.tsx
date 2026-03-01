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
  Folder: () => (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="#656d76">
      <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.927-1.236A1.75 1.75 0 0 0 4.972 1Z" />
    </svg>
  ),
  Layers: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0Z" />
    </svg>
  ),
};

interface Container {
  id: string;
  uuid: string;
  type: string;
  identifier: string;
  name: string;
  description: string;
  isVerified: boolean;
  version?: number;
  stats?: { atoms?: number };
  updatedAt: string;
}

interface NamespaceData {
  name: string;
  displayName?: string;
  description?: string;
  type?: string;
  visibility?: string;
  containers: Container[];
  members?: Array<{ user_id: string; role: string; user_name?: string; email?: string }>;
  stats?: {
    containerCount: number;
    memberCount?: number;
    totalAtoms?: number;
    verifiedCount?: number;
  };
  createdAt?: string;
}

const typeBadgeColors: Record<string, { bg: string; fg: string; border: string }> = {
  product: { bg: "#dafbe1", fg: "#1a7f37", border: "#aceebb" },
  knowledge: { bg: "#fff8c5", fg: "#9a6700", border: "#f5e0a0" },
  project: { bg: "#ddf4ff", fg: "#0969da", border: "#b6d7f6" },
  campaign: { bg: "#fbefff", fg: "#8250df", border: "#e4c5f0" },
  memory: { bg: "#fff1e5", fg: "#bc4c00", border: "#ffd8b5" },
};

export default function NamespaceDetailPage() {
  const params = useParams();
  const name = params.name as string;

  const [namespace, setNamespace] = useState<NamespaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`/api/namespaces/${encodeURIComponent(name)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) throw new Error("Namespace not found");
          throw new Error("Failed to load namespace");
        }
        return r.json();
      })
      .then((data) => {
        setNamespace(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [name]);

  const sortedContainers = [...(namespace?.containers || [])].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "atoms") return (b.stats?.atoms || 0) - (a.stats?.atoms || 0);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>
            Loading namespace...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !namespace) {
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
            <div style={{ marginBottom: 16, color: t.fgMuted }}>
              <Ic.Folder />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
              Namespace not found
            </h3>
            <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 20 }}>
              {error || "The namespace you requested could not be found."}
            </p>
            <Link
              href="/namespaces"
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
              Browse Namespaces
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const typeBadge = typeBadgeColors[namespace.type || ""] || {
    bg: t.canvas,
    fg: t.fgMuted,
    border: t.border,
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #238636, #0969da)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {(namespace.displayName || namespace.name).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 700, color: t.fg, margin: 0 }}>
                    {namespace.displayName || namespace.name}
                  </h1>
                  {namespace.type && (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0 8px",
                        fontSize: 11,
                        fontFamily: mono,
                        lineHeight: "22px",
                        borderRadius: 12,
                        backgroundColor: typeBadge.bg,
                        border: `1px solid ${typeBadge.border}`,
                        color: typeBadge.fg,
                      }}
                    >
                      {namespace.type}
                    </span>
                  )}
                </div>
                <span style={{ fontFamily: mono, fontSize: 14, color: t.fgMuted }}>
                  @{namespace.name}
                </span>
              </div>
            </div>
            {namespace.description && (
              <p style={{ fontSize: 14, color: t.fgMuted, margin: "8px 0 0", maxWidth: 600 }}>
                {namespace.description}
              </p>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginTop: 12,
                fontSize: 13,
                color: t.fgMuted,
              }}
            >
              <span>
                <strong style={{ color: t.fg }}>
                  {namespace.stats?.containerCount || sortedContainers.length}
                </strong>{" "}
                containers
              </span>
              {namespace.stats?.totalAtoms != null && (
                <span>
                  <strong style={{ color: t.fg }}>
                    {namespace.stats.totalAtoms.toLocaleString()}
                  </strong>{" "}
                  atoms
                </span>
              )}
              {namespace.stats?.verifiedCount != null && (
                <span>
                  <strong style={{ color: t.fg }}>{namespace.stats.verifiedCount}</strong> verified
                </span>
              )}
              {namespace.stats?.memberCount != null && namespace.stats.memberCount > 0 && (
                <span>
                  <strong style={{ color: t.fg }}>{namespace.stats.memberCount}</strong> members
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/containers/new?namespace=${namespace.name}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              backgroundColor: t.accent,
              color: "#fff",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Ic.Plus /> New container
          </Link>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {/* Main: Containers list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <SectionTitle>Containers</SectionTitle>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "6px 10px",
                  fontSize: 13,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  backgroundColor: "#fff",
                  color: t.fg,
                  cursor: "pointer",
                }}
              >
                <option value="recent">Recently updated</option>
                <option value="name">Name</option>
                <option value="atoms">Most atoms</option>
              </select>
            </div>

            {sortedContainers.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 48,
                  backgroundColor: "#fff",
                  border: `1px dashed ${t.border}`,
                  borderRadius: 8,
                }}
              >
                <div style={{ marginBottom: 12, color: t.fgMuted }}>
                  <Ic.Layers />
                </div>
                <p style={{ fontSize: 14, color: t.fgMuted, margin: "0 0 16px" }}>
                  No containers yet
                </p>
                <Link
                  href={`/containers/new?namespace=${namespace.name}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    backgroundColor: t.accent,
                    color: "#fff",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <Ic.Plus /> Create the first container
                </Link>
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
                {sortedContainers.map((c, i) => (
                  <Link
                    key={c.uuid || c.id}
                    href={`/containers/${c.uuid || c.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      borderBottom:
                        i < sortedContainers.length - 1 ? `1px solid ${t.border}` : "none",
                      textDecoration: "none",
                      color: t.fg,
                      transition: "background 0.1s",
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
                        {c.version != null && (
                          <span style={{ fontSize: 11, color: t.fgMuted, fontFamily: mono }}>
                            v{c.version}
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
                          gap: 16,
                          marginTop: 6,
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
                        <span style={{ fontFamily: mono, fontSize: 11, color: "#8b949e" }}>
                          {new Date(c.updatedAt).toLocaleDateString()}
                        </span>
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
            )}
          </div>

          {/* Sidebar */}
          <div style={{ width: 280, flexShrink: 0 }}>
            {/* About */}
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: t.fg, margin: "0 0 12px" }}>
                About
              </h3>
              <p style={{ fontSize: 13, color: t.fgMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
                {namespace.description || "No description provided."}
              </p>
              <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                {namespace.visibility && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.fgMuted }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z" />
                    </svg>
                    <span style={{ textTransform: "capitalize" }}>{namespace.visibility}</span>
                  </div>
                )}
                {namespace.createdAt && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.fgMuted }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z" />
                    </svg>
                    <span>Created {new Date(namespace.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Members */}
            {namespace.members && namespace.members.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Card>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: t.fg, margin: "0 0 12px" }}>
                    Members
                  </h3>
                  <div style={{ display: "grid", gap: 8 }}>
                    {namespace.members.map((member, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #238636, #0969da)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          {(member.user_name || member.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, color: t.fg, flex: 1 }}>
                          {member.user_name || member.email || member.user_id}
                        </span>
                        <span
                          style={{ fontSize: 11, color: t.fgMuted, textTransform: "capitalize" }}
                        >
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ marginTop: 16 }}>
              <Card>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: t.fg, margin: "0 0 12px" }}>
                  Quick Actions
                </h3>
                <div style={{ display: "grid", gap: 8 }}>
                  <Link
                    href={`/containers/new?namespace=${namespace.name}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: t.fgMuted,
                      textDecoration: "none",
                    }}
                  >
                    <Ic.Plus /> New Container
                  </Link>
                  <Link
                    href={`/inject?namespace=${namespace.name}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: t.fgMuted,
                      textDecoration: "none",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                    Inject All
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
