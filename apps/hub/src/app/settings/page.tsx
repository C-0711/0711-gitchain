"use client";

import { useState } from "react";
import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

export default function SettingsPage() {
  const [apiKey] = useState("gc_sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    navigator.clipboard?.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="Settings" description="Manage your account and API configuration" />

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Profile */}
          <Card>
            <SectionTitle>Profile</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, alignItems: "center" }}>
              <label style={{ fontSize: 14, color: t.fgMuted }}>Display Name</label>
              <input type="text" defaultValue="Demo User" style={{
                padding: "8px 12px", fontSize: 14, border: `1px solid ${t.border}`,
                borderRadius: 6, backgroundColor: "#f6f8fa",
              }} />
              <label style={{ fontSize: 14, color: t.fgMuted }}>Email</label>
              <input type="email" defaultValue="demo@example.com" style={{
                padding: "8px 12px", fontSize: 14, border: `1px solid ${t.border}`,
                borderRadius: 6, backgroundColor: "#f6f8fa",
              }} />
            </div>
            <div style={{ marginTop: 20 }}>
              <button style={{
                padding: "8px 16px", fontSize: 14, fontWeight: 500,
                backgroundColor: "#238636", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",
              }}>Save Changes</button>
            </div>
          </Card>

          {/* API Keys */}
          <Card>
            <SectionTitle>API Keys</SectionTitle>
            <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 16 }}>
              Use this key to authenticate API requests. Keep it secret!
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{
                flex: 1, padding: "8px 12px", fontFamily: mono, fontSize: 13,
                backgroundColor: "#f6f8fa", border: `1px solid ${t.border}`, borderRadius: 6,
                color: t.fgMuted, letterSpacing: "0.5px",
              }}>
                {apiKey.slice(0, 20)}•••••••••••••
              </div>
              <button onClick={copyKey} style={{
                padding: "8px 16px", fontSize: 14, fontWeight: 500,
                backgroundColor: "#fff", color: t.fg, border: `1px solid ${t.border}`,
                borderRadius: 6, cursor: "pointer",
              }}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div style={{ marginTop: 16 }}>
              <button style={{
                padding: "8px 16px", fontSize: 14, fontWeight: 500,
                backgroundColor: "#fff", color: "#cf222e", border: "1px solid #cf222e",
                borderRadius: 6, cursor: "pointer",
              }}>Regenerate Key</button>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card>
            <SectionTitle>Danger Zone</SectionTitle>
            <div style={{
              padding: 16, border: "1px solid #cf222e", borderRadius: 6,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: t.fg }}>Delete Account</div>
                <div style={{ fontSize: 13, color: t.fgMuted }}>Permanently delete your account and all data</div>
              </div>
              <button style={{
                padding: "8px 16px", fontSize: 14, fontWeight: 500,
                backgroundColor: "#cf222e", color: "#fff", border: "none",
                borderRadius: 6, cursor: "pointer",
              }}>Delete Account</button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
