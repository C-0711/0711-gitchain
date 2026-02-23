"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell, { PageHeader, StatCard, Card, SectionTitle, ActionRow, theme as t } from "@/components/AppShell";

// Icons
const Ic = {
  Layers: () => <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0ZM8 2.236 2.987 5.11 8 7.986l5.013-2.875Z"/></svg>,
  File: () => <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Z"/></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.346 1.909 1.22 3.004l-7.34 7.142a1.249 1.249 0 0 1-2.33-.861l1.545-4.285H3.462c-1.57 0-2.346-1.909-1.22-3.004Z"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z"/></svg>,
  Commit: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Z"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/></svg>,
  Book: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Z"/></svg>,
};

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

// Activity Item Component
function ActivityItem({ icon, container, action, actor, time, color }: { icon: React.ReactNode; container: string; action: string; actor: string; time: string; color?: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: `1px solid ${t.border}` }}>
      <span style={{ color: color || t.fgMuted }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div>
          <Link href={`/containers/${container}`} style={{ fontFamily: mono, fontSize: 14, color: t.link, textDecoration: "none" }}>{container}</Link>
        </div>
        <div style={{ fontSize: 13, color: t.fgMuted, marginTop: 2 }}>{action}</div>
        <div style={{ fontSize: 12, color: "#8b949e", marginTop: 2 }}>{actor} · {time}</div>
      </div>
    </div>
  );
}

// Pinned Container
function PinnedContainer({ id, trust }: { id: string; trust: number }) {
  const trustColor = trust >= 90 ? "#1a7f37" : trust >= 70 ? "#9a6700" : "#cf222e";
  return (
    <Link href={`/containers/${id}`} style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderBottom: `1px solid ${t.border}`,
      textDecoration: "none",
    }}>
      <Ic.Layers />
      <span style={{ flex: 1, fontFamily: mono, fontSize: 13, color: t.link }}>{id}</span>
      <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: trustColor }}>{trust}%</span>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="Dashboard" description="Your containers, activity, and platform overview" />

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          <StatCard icon={<Ic.Layers />} value={12} label="Your Containers" badge="+2 this week" href="/containers" />
          <StatCard icon={<Ic.File />} value="8,420" label="Total Atoms" badge="87% verified" />
          <StatCard icon={<Ic.Zap />} value="1,284" label="Injections (7d)" badge="+23% vs last week" />
          <StatCard icon={<Ic.Shield />} value={34} label="Chain Anchors" badge="All confirmed" />
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
          {/* Recent Activity */}
          <Card padding={0}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}` }}>
              <SectionTitle>Recent Activity</SectionTitle>
            </div>
            <div style={{ padding: "0 20px" }}>
              <ActivityItem icon={<Ic.Commit />} container="acme/product:widget-x1" action="Updated efficiency specs" actor="audit-pipeline" time="2 hours ago" color="#1a7f37" />
              <ActivityItem icon={<Ic.Shield />} container="pharma-eu/compound:asp-2847" action="Verification passed — 128 atoms" actor="system" time="5 hours ago" color="#8250df" />
              <ActivityItem icon={<Ic.Zap />} container="auto-parts/catalog:brake-v3" action="Injected into OpenAI context (4,200 atoms)" actor="d.mueller" time="1 day ago" color="#0969da" />
              <ActivityItem icon={<Ic.Commit />} container="supply-chain/audit:q4-2025" action="Added ESG compliance scores" actor="compliance-bot" time="2 days ago" color="#1a7f37" />
              <ActivityItem icon={<Ic.Plus />} container="energy-de/asset:wind-farm-n7" action="Container created from SCADA export" actor="d.mueller" time="3 days ago" color="#8b949e" />
            </div>
          </Card>

          {/* Right Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Quick Actions */}
            <Card padding={0}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}` }}>
                <SectionTitle>Quick Actions</SectionTitle>
              </div>
              <ActionRow icon={<Ic.Plus />} label="Create container" href="/containers/new" />
              <ActionRow icon={<Ic.Zap />} label="Inject context" href="/inject" />
              <ActionRow icon={<Ic.Shield />} label="Verify container" href="/verify" />
              <ActionRow icon={<Ic.Book />} label="Browse docs" href="/docs" />
            </Card>

            {/* Pinned Containers */}
            <Card padding={0}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}` }}>
                <SectionTitle>Pinned Containers</SectionTitle>
              </div>
              <PinnedContainer id="acme/product:widget-x1" trust={92} />
              <PinnedContainer id="pharma-eu/compound:asp-2847" trust={97} />
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
