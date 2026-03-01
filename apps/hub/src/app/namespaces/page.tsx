"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

const Ic = {
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

interface Namespace {
  name: string;
  displayName?: string;
  type?: string;
  description?: string;
  containerCount?: number;
  createdAt?: string;
}

const typeBadgeColors: Record<string, { bg: string; fg: string; border: string }> = {
  product: { bg: "#dafbe1", fg: "#1a7f37", border: "#aceebb" },
  knowledge: { bg: "#fff8c5", fg: "#9a6700", border: "#f5e0a0" },
  project: { bg: "#ddf4ff", fg: "#0969da", border: "#b6d7f6" },
  campaign: { bg: "#fbefff", fg: "#8250df", border: "#e4c5f0" },
  memory: { bg: "#fff1e5", fg: "#bc4c00", border: "#ffd8b5" },
};

export default function NamespacesPage() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch("/api/namespaces", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load namespaces");
        return r.json();
      })
      .then((d) => {
        setNamespaces(d.namespaces || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <PageHeader
            title="Namespaces"
            description="Organize containers by organization, team, or project"
          />
          <Link
            href="/namespaces/new"
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
            <Ic.Plus /> Create namespace
          </Link>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: 24,
              backgroundColor: "#ffebe9",
              border: "1px solid #cf222e",
              borderRadius: 6,
              color: "#cf222e",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>Loading...</div>
        ) : namespaces.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              backgroundColor: "#fff",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
            }}
          >
            <Ic.Folder />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "16px 0 8px" }}>
              No namespaces yet
            </h3>
            <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 20 }}>
              Create your first namespace to organize your containers
            </p>
            <Link
              href="/namespaces/new"
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
              <Ic.Plus /> Create namespace
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
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.canvas }}>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: t.fgMuted,
                    }}
                  >
                    Namespace
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: t.fgMuted,
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontSize: 12,
                      fontWeight: 600,
                      color: t.fgMuted,
                    }}
                  >
                    Containers
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontSize: 12,
                      fontWeight: 600,
                      color: t.fgMuted,
                    }}
                  >
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {namespaces.map((ns) => {
                  const badge = typeBadgeColors[ns.type || ""] || {
                    bg: t.canvas,
                    fg: t.fgMuted,
                    border: t.border,
                  };
                  return (
                    <tr key={ns.name} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "12px 16px" }}>
                        <Link
                          href={`/namespaces/${ns.name}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            textDecoration: "none",
                          }}
                        >
                          <span style={{ color: t.fgMuted }}>
                            <Ic.Folder />
                          </span>
                          <div>
                            <span
                              style={{
                                fontFamily: mono,
                                fontSize: 14,
                                fontWeight: 600,
                                color: t.link,
                              }}
                            >
                              {ns.name}
                            </span>
                            {ns.displayName && (
                              <div style={{ fontSize: 13, color: t.fgMuted, marginTop: 2 }}>
                                {ns.displayName}
                              </div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {ns.type && (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0 8px",
                              fontSize: 11,
                              fontFamily: mono,
                              lineHeight: "22px",
                              borderRadius: 12,
                              backgroundColor: badge.bg,
                              border: `1px solid ${badge.border}`,
                              color: badge.fg,
                            }}
                          >
                            {ns.type}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <span style={{ fontFamily: mono, fontSize: 13, color: t.fg }}>
                          {ns.containerCount || 0}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <span style={{ fontFamily: mono, fontSize: 12, color: "#8b949e" }}>
                          {ns.createdAt ? new Date(ns.createdAt).toLocaleDateString() : "--"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
