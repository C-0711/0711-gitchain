"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, ReactNode } from "react";

// Design tokens - GitHub Primer
const t = {
  navBg: "#0d1117",
  navBorder: "#21262d",
  navFg: "#e6edf3",
  navMuted: "#8b949e",
  accent: "#238636",
  accentHover: "#2ea043",
  bg: "#ffffff",
  canvas: "#f6f8fa",
  fg: "#1f2328",
  fgMuted: "#656d76",
  border: "#d1d9e0",
  link: "#0969da",
};

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

// Icons
const Icons = {
  Chain: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-1.06 1.06ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/></svg>,
  Chev: () => <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"/></svg>,
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/explore", label: "Explore" },
    { href: "/containers", label: "Containers" },
    { href: "/namespaces", label: "Namespaces" },
    { href: "/inject", label: "Inject" },
    { href: "/verify", label: "Verify" },
    { href: "/docs", label: "Docs" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: t.canvas }}>
      {/* Dark Navbar */}
      <nav style={{
        backgroundColor: t.navBg,
        borderBottom: `1px solid ${t.navBorder}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 16 }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Icons.Chain />
            <span style={{ fontWeight: 700, fontSize: 18, color: t.navFg, letterSpacing: "-0.02em" }}>GitChain</span>
          </Link>

          {/* Nav Items */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: isActive(item.href) ? 500 : 400,
                  color: isActive(item.href) ? t.navFg : t.navMuted,
                  backgroundColor: isActive(item.href) ? "#21262d" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#21262d",
            border: `1px solid ${t.navBorder}`,
            borderRadius: 6,
            padding: "5px 12px",
            width: 240,
          }}>
            <Icons.Search />
            <span style={{ color: t.navMuted, fontSize: 13 }}>Search containers...</span>
            <span style={{
              marginLeft: "auto",
              border: `1px solid ${t.navBorder}`,
              borderRadius: 4,
              padding: "0 6px",
              fontSize: 11,
              color: t.navMuted,
              fontFamily: mono,
            }}>/</span>
          </div>

          {/* New Button */}
          <Link
            href="/containers/new"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 14px",
              backgroundColor: t.accent,
              color: "#fff",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 0.15s",
            }}
          >
            <Icons.Plus /> New
          </Link>

          {/* User */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#21262d",
              border: `1px solid ${t.navBorder}`,
              color: t.navMuted,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >D</button>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

// Reusable Components for pages
export const PageHeader = ({ title, description }: { title: string; description?: string }) => (
  <div style={{ marginBottom: 24 }}>
    <h1 style={{ fontSize: 24, fontWeight: 700, color: t.fg, margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
    {description && <p style={{ fontSize: 15, color: t.fgMuted, margin: "8px 0 0" }}>{description}</p>}
  </div>
);

export const StatCard = ({ icon, value, label, badge, href }: { icon: ReactNode; value: string | number; label: string; badge?: string; href?: string }) => {
  const content = (
    <div style={{
      backgroundColor: "#fff",
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: t.fgMuted }}>{icon}</span>
        {badge && <span style={{ fontSize: 12, color: t.fgMuted }}>{badge}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, fontFamily: mono, color: t.fg, letterSpacing: "-0.02em" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 13, color: t.fgMuted }}>{label}</div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{content}</Link> : content;
};

export const Card = ({ children, padding = 20 }: { children: ReactNode; padding?: number }) => (
  <div style={{
    backgroundColor: "#fff",
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding,
  }}>{children}</div>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 style={{ fontSize: 16, fontWeight: 600, color: t.fg, margin: "0 0 16px", letterSpacing: "-0.01em" }}>{children}</h2>
);

export const ActionRow = ({ icon, label, href, badge }: { icon: ReactNode; label: string; href: string; badge?: string }) => (
  <Link href={href} style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderBottom: `1px solid ${t.border}`,
    textDecoration: "none",
    color: t.fg,
    transition: "background 0.1s",
  }}>
    <span style={{ color: t.fgMuted }}>{icon}</span>
    <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
    {badge && <span style={{ fontSize: 12, color: "#1a7f37", fontWeight: 500 }}>{badge}</span>}
    <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/></svg>
  </Link>
);

export { t as theme };
