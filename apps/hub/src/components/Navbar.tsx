"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// GitChain Design V2 - GitHub × Claude Fusion
const t = {
  bg: "#ffffff",
  canvas: "#fafaf9",
  sunken: "#f4f4f2",
  border: "#e5e5e3",
  borderStrong: "#d1d1cf",
  fg: "#1a1a1a",
  fgMuted: "#6b6b6b",
  fgSubtle: "#9a9a9a",
  link: "#0969da",
  accent: "#c45a1e",
  accentHover: "#a84c18",
};

export default function Navbar() {
  const pathname = usePathname();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/containers", label: "Containers" },
    { href: "/namespaces", label: "Namespaces" },
    { href: "/inject", label: "Inject" },
    { href: "/verify", label: "Verify" },
    { href: "/docs", label: "Docs" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      backgroundColor: t.bg,
      borderBottom: `1px solid ${t.border}`,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 48 }}>
          {/* Left side */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: t.fg }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" }}>GitChain</span>
            </Link>
            
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: isActive(item.href) ? 500 : 400,
                    color: isActive(item.href) ? t.fg : t.fgMuted,
                    backgroundColor: isActive(item.href) ? t.sunken : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => !isActive(item.href) && (e.currentTarget.style.backgroundColor = t.sunken)}
                  onMouseLeave={(e) => !isActive(item.href) && (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Search - triggers CommandPalette */}
            <button
              onClick={() => {
                // Dispatch keyboard event to open command palette
                document.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
                );
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: t.sunken,
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                padding: "5px 10px",
                width: 220,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = t.borderStrong}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = t.border}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill={t.fgSubtle}>
                <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-1.06 1.06ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/>
              </svg>
              <span style={{ color: t.fgSubtle, fontSize: 13 }}>Search...</span>
              <span style={{
                marginLeft: "auto",
                border: `1px solid ${t.border}`,
                borderRadius: 4,
                padding: "0px 5px",
                fontSize: 11,
                color: t.fgSubtle,
                fontFamily: "monospace",
                backgroundColor: t.bg,
              }}>⌘K</span>
            </button>

            {/* Create dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 12px",
                  backgroundColor: t.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = t.accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = t.accent}
              >
                New
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"/>
                </svg>
              </button>
              
              {showCreateMenu && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  marginTop: 6,
                  width: 200,
                  backgroundColor: t.bg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  padding: "4px 0",
                  zIndex: 100,
                }}>
                  <Link href="/containers/new" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", textDecoration: "none", color: t.fg, fontSize: 13 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688Z"/></svg>
                    <span>New container</span>
                  </Link>
                  <Link href="/namespaces/new" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", textDecoration: "none", color: t.fg, fontSize: 13 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.927-1.236A1.75 1.75 0 0 0 4.972 1ZM1.5 2.75a.25.25 0 0 1 .25-.25h3.222a.25.25 0 0 1 .2.1l.927 1.236c.374.498.97.789 1.601.789h6.55a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25Z"/></svg>
                    <span>New namespace</span>
                  </Link>
                </div>
              )}
            </div>

            {/* User */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 2,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: t.sunken,
                  border: `1px solid ${t.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 500,
                  color: t.fgMuted,
                }}>D</div>
                <svg width="10" height="10" viewBox="0 0 16 16" fill={t.fgSubtle}>
                  <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"/>
                </svg>
              </button>

              {showUserMenu && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  marginTop: 6,
                  width: 180,
                  backgroundColor: t.bg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  padding: "4px 0",
                  zIndex: 100,
                }}>
                  <div style={{ padding: "8px 12px", borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: t.fg }}>Demo User</div>
                    <div style={{ fontSize: 12, color: t.fgMuted }}>demo@example.com</div>
                  </div>
                  <Link href="/settings" style={{ display: "block", padding: "8px 12px", textDecoration: "none", color: t.fg, fontSize: 13 }}>Settings</Link>
                  <div style={{ borderTop: `1px solid ${t.border}`, margin: "4px 0" }} />
                  <button style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontSize: 13, color: "#cf222e", cursor: "pointer" }}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
