"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, Card, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

// Icons
const Ic = {
  Shield: ({ s = 12 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#656d76">
      <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-1.06 1.06ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
    </svg>
  ),
  Filter: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#656d76">
      <path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
    </svg>
  ),
  Commit: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Z" />
    </svg>
  ),
};

interface Container {
  id: string;
  uuid: string;
  type: string;
  namespace: string;
  identifier: string;
  name: string;
  description: string;
  isVerified: boolean;
  snr: string;
  manufacturer: string;
  etim: { classCode: string; className: string } | null;
  stats: { atoms: number; categories: string };
  updatedAt: string;
}

// Container Card
function ContainerCard({
  uuid,
  ns,
  id,
  name,
  desc,
  atoms,
  verified,
  tags,
  updated,
  etim,
}: {
  uuid: string;
  ns: string;
  id: string;
  name: string;
  desc: string;
  atoms: number;
  verified: boolean;
  tags: string[];
  updated: string;
  etim?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={`/containers/${uuid}`}
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
        {verified && (
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
      <div style={{ fontWeight: 600, fontSize: 15, color: t.fg, marginBottom: 4 }}>{name}</div>
      <div
        style={{ fontSize: 13, color: t.fgMuted, lineHeight: 1.5, marginBottom: 12, minHeight: 40 }}
      >
        {desc}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {tags.map((tg) => (
          <span
            key={tg}
            style={{
              padding: "0 8px",
              fontSize: 11,
              fontFamily: mono,
              lineHeight: "22px",
              borderRadius: 12,
              backgroundColor: "#f6f8fa",
              border: "1px solid #eaeef2",
              color: t.link,
            }}
          >
            {tg}
          </span>
        ))}
      </div>
      <div
        style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: t.fgMuted }}
      >
        <span>
          <strong style={{ color: t.fg }}>{atoms.toLocaleString()}</strong> atoms
        </span>
        {etim && <span style={{ fontFamily: mono, fontSize: 11, color: "#8b949e" }}>{etim}</span>}
        <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 11, color: "#8b949e" }}>
          {updated}
        </span>
      </div>
    </Link>
  );
}

// Filter tabs
const categories = ["All", "Products", "Knowledge", "Campaigns"];

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/containers")
      .then((r) => r.json())
      .then((data) => {
        setContainers(data.containers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = containers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.namespace.toLowerCase().includes(q) ||
        c.identifier.toLowerCase().includes(q)
      );
    }
    if (activeTab === "All") return true;
    if (activeTab === "Products") return c.type === "product";
    return true;
  });

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader
          title="Explore"
          description="Discover public, verified data containers ready to inject into your AI workflows."
        />

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: "#fff",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              padding: "8px 14px",
            }}
          >
            <Ic.Search />
            <input
              type="text"
              placeholder="Search containers by name, namespace, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
                color: t.fg,
                backgroundColor: "transparent",
              }}
            />
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              backgroundColor: "#fff",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              fontSize: 14,
              color: t.fg,
              cursor: "pointer",
            }}
          >
            <Ic.Filter /> Filters
          </button>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            borderBottom: `1px solid ${t.border}`,
            paddingBottom: 1,
          }}
        >
          {categories.map((cat) => (
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
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div style={{ fontSize: 13, color: t.fgMuted, marginBottom: 16 }}>
          {loading ? (
            "Loading..."
          ) : (
            <>
              Showing <strong style={{ color: t.fg }}>{filtered.length}</strong> containers
            </>
          )}
        </div>

        {/* Container Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>
            Loading containers...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>
            No containers found.{search && " Try a different search term."}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((c) => {
              const tags: string[] = [];
              if (c.type) tags.push(c.type);
              if (c.etim?.classCode) tags.push(`ETIM ${c.etim.classCode}`);
              if (c.isVerified) tags.push("chain-verified");
              if (c.manufacturer) tags.push(c.manufacturer.split(" ")[0]);

              return (
                <ContainerCard
                  key={c.uuid}
                  uuid={c.uuid}
                  ns={c.namespace}
                  id={`${c.type}:${c.identifier}`}
                  name={c.name}
                  desc={
                    c.description || `${c.stats.atoms} atoms · ${c.stats.categories} categories`
                  }
                  atoms={c.stats.atoms}
                  verified={c.isVerified}
                  tags={tags}
                  updated={timeAgo(c.updatedAt)}
                  etim={c.etim?.className}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
