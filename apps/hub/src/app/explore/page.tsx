"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell, { PageHeader, Card, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

// Icons
const Ic = {
  Shield: ({ s = 12 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor"><path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="#656d76"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-1.06 1.06ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/></svg>,
  Filter: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="#656d76"><path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>,
};

// Container Card
function ContainerCard({ ns, id, name, desc, atoms, trust, chain, tags, updated }: {
  ns: string; id: string; name: string; desc: string; atoms: number; trust: number; chain?: boolean; tags: string[]; updated: string;
}) {
  const [hov, setHov] = useState(false);
  const trustColor = trust >= 90 ? "#1a7f37" : trust >= 70 ? "#9a6700" : "#cf222e";
  return (
    <Link
      href={`/containers/${ns}/${id.replace(":", "/")}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "block",
        border: `1px solid ${hov ? t.border : "#eaeef2"}`,
        borderRadius: 8,
        padding: 20,
        backgroundColor: "#fff",
        transition: "all 0.15s",
        textDecoration: "none",
        boxShadow: hov ? "0 3px 12px rgba(0,0,0,0.04)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: mono, fontSize: 14 }}>
          <span style={{ color: t.fgMuted }}>{ns} / </span>
          <span style={{ color: t.link, fontWeight: 600 }}>{id}</span>
        </span>
        {chain && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "0 6px", fontSize: 11, fontFamily: mono, lineHeight: "18px",
            borderRadius: 12, backgroundColor: "#dafbe1", border: "1px solid #aceebb", color: "#1a7f37",
          }}>
            <Ic.Shield s={10} /> verified
          </span>
        )}
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: t.fg, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.5, marginBottom: 12, minHeight: 40 }}>{desc}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {tags.map(tg => (
          <span key={tg} style={{
            padding: "0 8px", fontSize: 11, fontFamily: mono, lineHeight: "22px",
            borderRadius: 12, backgroundColor: "#f6f8fa", border: "1px solid #eaeef2", color: t.link,
          }}>{tg}</span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: t.fgMuted }}>
        <span><strong style={{ color: t.fg }}>{atoms.toLocaleString()}</strong> atoms</span>
        <span>Trust: <span style={{ fontFamily: mono, fontWeight: 600, color: trustColor }}>{trust}%</span></span>
        <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 11, color: "#8b949e" }}>{updated}</span>
      </div>
    </Link>
  );
}

// Filter tabs
const categories = ["All", "Products", "Campaigns", "Projects", "Knowledge", "Memories"];

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const containers = [
    { ns: "bosch", id: "product:BCS-VT-36", name: "Compress 3000 AWS 4 ORM", desc: "Split heat pump with outdoor and indoor unit. Full ETIM classification with 207 verified attributes.", atoms: 207, trust: 92, chain: true, tags: ["heat-pump", "ETIM", "DPP"], updated: "2h ago" },
    { ns: "bosch", id: "product:CS7800iLW", name: "Compress 7800i LW 12 M", desc: "Air-to-water heat pump 12kW. Complete specifications from manufacturer datasheets.", atoms: 184, trust: 97, chain: true, tags: ["heat-pump", "residential"], updated: "1d ago" },
    { ns: "pharma-eu", id: "compound:asp-2847", name: "ASP-2847 Compound", desc: "Phase III clinical trial data with regulatory submissions. All endpoints verified against EMA filings.", atoms: 128, trust: 97, chain: true, tags: ["pharma", "clinical", "EMA"], updated: "1d ago" },
    { ns: "auto-parts", id: "catalog:brake-v3", name: "Brake System Catalog v3", desc: "Complete brake system specifications covering 4,200 SKUs. ETIM classified with cross-references.", atoms: 4200, trust: 88, chain: true, tags: ["automotive", "ETIM", "catalog"], updated: "3d ago" },
    { ns: "supply-chain", id: "audit:q4-2025", name: "Q4 Supply Chain Audit", desc: "Supplier compliance scores, certifications, and ESG metrics across 340 tier-1 suppliers.", atoms: 1870, trust: 94, chain: true, tags: ["ESG", "compliance", "audit"], updated: "5d ago" },
    { ns: "energy-de", id: "asset:wind-farm-n7", name: "Wind Farm North 7", desc: "Performance data for 42 turbines including SCADA metrics, maintenance logs, and energy yield.", atoms: 2340, trust: 91, chain: true, tags: ["energy", "wind", "SCADA"], updated: "2w ago" },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="Explore" description="Discover public, verified data containers ready to inject into your AI workflows." />

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 10,
            backgroundColor: "#fff", border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 14px",
          }}>
            <Ic.Search />
            <input
              type="text"
              placeholder="Search containers by name, namespace, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 14, color: t.fg, backgroundColor: "transparent",
              }}
            />
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", backgroundColor: "#fff", border: `1px solid ${t.border}`, borderRadius: 6,
            fontSize: 14, color: t.fg, cursor: "pointer",
          }}>
            <Ic.Filter /> Filters
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${t.border}`, paddingBottom: 1 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                padding: "8px 16px",
                fontSize: 14,
                fontWeight: activeTab === cat ? 600 : 400,
                color: activeTab === cat ? t.fg : t.fgMuted,
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === cat ? "2px solid #fd8c73" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
              }}
            >{cat}</button>
          ))}
        </div>

        {/* Results count */}
        <div style={{ fontSize: 13, color: t.fgMuted, marginBottom: 16 }}>
          Showing <strong style={{ color: t.fg }}>{containers.length}</strong> containers
        </div>

        {/* Container Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {containers.map(c => <ContainerCard key={`${c.ns}/${c.id}`} {...c} />)}
        </div>
      </div>
    </AppShell>
  );
}
