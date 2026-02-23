"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell, { PageHeader, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

const Ic = {
  Shield: ({ s = 12 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/></svg>,
  Layers: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0Z"/></svg>,
};

interface Container {
  id: string;
  type: string;
  namespace: string;
  name: string;
  identifier: string;
  version: string;
  stats?: { atoms?: number };
  updatedAt: string;
  chainAnchored?: boolean;
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/containers")
      .then(r => r.json())
      .then(d => { setContainers(d.containers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <PageHeader title="Your Containers" description="Manage your versioned knowledge containers" />
          <Link href="/containers/new" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", backgroundColor: "#238636", color: "#fff",
            borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>
            <Ic.Plus /> New container
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>Loading...</div>
        ) : containers.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 60, backgroundColor: "#fff",
            border: `1px solid ${t.border}`, borderRadius: 8,
          }}>
            <Ic.Layers />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "16px 0 8px" }}>No containers yet</h3>
            <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 20 }}>Create your first container to get started</p>
            <Link href="/containers/new" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", backgroundColor: "#238636", color: "#fff",
              borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              <Ic.Plus /> Create container
            </Link>
          </div>
        ) : (
          <div style={{ backgroundColor: "#fff", border: `1px solid ${t.border}`, borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: "#f6f8fa" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: t.fgMuted }}>Container</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: t.fgMuted }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: t.fgMuted }}>Atoms</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: t.fgMuted }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: t.fgMuted }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {containers.map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/containers/${c.id}`} style={{ fontFamily: mono, fontSize: 14, color: t.link, textDecoration: "none" }}>
                        {c.namespace}/{c.type}:{c.identifier}
                      </Link>
                      {c.name && <div style={{ fontSize: 13, color: t.fgMuted, marginTop: 2 }}>{c.name}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 13, color: t.fg, textTransform: "capitalize" }}>{c.type}</span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <span style={{ fontFamily: mono, fontSize: 13, color: t.fg }}>{c.stats?.atoms?.toLocaleString() || 0}</span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {c.chainAnchored ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "0 6px", fontSize: 11, fontFamily: mono, lineHeight: "18px",
                          borderRadius: 12, backgroundColor: "#dafbe1", border: "1px solid #aceebb", color: "#1a7f37",
                        }}>
                          <Ic.Shield s={10} /> verified
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: t.fgMuted }}>draft</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <span style={{ fontFamily: mono, fontSize: 12, color: "#8b949e" }}>
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
