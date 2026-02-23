"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell, { PageHeader, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

const Ic = {
  Plus: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/></svg>,
  Folder: () => <svg width="20" height="20" viewBox="0 0 16 16" fill="#656d76"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.927-1.236A1.75 1.75 0 0 0 4.972 1Z"/></svg>,
};

interface Namespace {
  name: string;
  displayName?: string;
  containerCount?: number;
  createdAt?: string;
}

export default function NamespacesPage() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/namespaces")
      .then(r => r.json())
      .then(d => { setNamespaces(d.namespaces || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <PageHeader title="Namespaces" description="Organize containers by organization, team, or project" />
          <Link href="/namespaces/new" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", backgroundColor: "#238636", color: "#fff",
            borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>
            <Ic.Plus /> New namespace
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>Loading...</div>
        ) : namespaces.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 60, backgroundColor: "#fff",
            border: `1px solid ${t.border}`, borderRadius: 8,
          }}>
            <Ic.Folder />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "16px 0 8px" }}>No namespaces yet</h3>
            <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 20 }}>Create your first namespace to organize your containers</p>
            <Link href="/namespaces/new" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", backgroundColor: "#238636", color: "#fff",
              borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              <Ic.Plus /> Create namespace
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {namespaces.map(ns => (
              <Link
                key={ns.name}
                href={`/namespaces/${ns.name}`}
                style={{
                  display: "block", padding: 20, backgroundColor: "#fff",
                  border: `1px solid ${t.border}`, borderRadius: 8, textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Ic.Folder />
                  <span style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: t.link }}>{ns.name}</span>
                </div>
                {ns.displayName && <div style={{ fontSize: 14, color: t.fg, marginBottom: 8 }}>{ns.displayName}</div>}
                <div style={{ fontSize: 13, color: t.fgMuted }}>
                  {ns.containerCount || 0} containers
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
