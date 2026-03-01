"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";

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
  Chain: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3fb950"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e">
      <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-1.06 1.06ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
    </svg>
  ),
  Chev: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
    </svg>
  ),
  Hamburger: () => (
    <svg width="20" height="20" viewBox="0 0 16 16" fill={t.navFg}>
      <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z" />
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 16 16" fill={t.navFg}>
      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  ),
  Bell: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={t.navMuted}>
      <path d="M8 16a2 2 0 0 0 1.985-1.75H6.015A2 2 0 0 0 8 16ZM8 1.5A3.5 3.5 0 0 0 4.5 5c0 .642-.188 1.271-.544 1.817l-.724 1.109A1.25 1.25 0 0 0 4.287 10h7.426a1.25 1.25 0 0 0 1.055-1.924l-.723-1.11A3.527 3.527 0 0 1 11.5 5 3.5 3.5 0 0 0 8 1.5ZM3 5a5 5 0 0 1 10 0c0 .854.279 1.688.794 2.378l.724 1.11a2.75 2.75 0 0 1-2.32 4.262H3.802a2.75 2.75 0 0 1-2.32-4.262l.724-1.11A5.027 5.027 0 0 0 3 5Z" />
    </svg>
  ),
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile nav when route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

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
      {/* Responsive CSS */}
      <style>{`
        .gc-desktop-nav { display: flex; }
        .gc-desktop-search { display: flex; }
        .gc-desktop-new { display: flex; }
        .gc-hamburger { display: none; }
        @media (max-width: 767px) {
          .gc-desktop-nav { display: none !important; }
          .gc-desktop-search { display: none !important; }
          .gc-desktop-new { display: none !important; }
          .gc-hamburger { display: flex !important; }
        }
      `}</style>

      {/* Dark Navbar */}
      <nav
        style={{
          backgroundColor: t.navBg,
          borderBottom: `1px solid ${t.navBorder}`,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            height: 56,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Hamburger Button (mobile only) */}
          <button
            className="gc-hamburger"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: 6,
              padding: 0,
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#21262d")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <Icons.Close /> : <Icons.Hamburger />}
          </button>

          {/* Logo */}
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
          >
            <Icons.Chain />
            <span
              style={{ fontWeight: 700, fontSize: 18, color: t.navFg, letterSpacing: "-0.02em" }}
            >
              GitChain
            </span>
          </Link>

          {/* Nav Items (desktop) */}
          <div
            className="gc-desktop-nav"
            style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}
          >
            {navItems.map((item) => (
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

          {/* Search (desktop) */}
          <div
            className="gc-desktop-search"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#21262d",
              border: `1px solid ${t.navBorder}`,
              borderRadius: 6,
              padding: "5px 12px",
              width: 240,
            }}
          >
            <Icons.Search />
            <span style={{ color: t.navMuted, fontSize: 13 }}>Search containers...</span>
            <span
              style={{
                marginLeft: "auto",
                border: `1px solid ${t.navBorder}`,
                borderRadius: 4,
                padding: "0 6px",
                fontSize: 11,
                color: t.navMuted,
                fontFamily: mono,
              }}
            >
              /
            </span>
          </div>

          {/* New Button (desktop) */}
          <Link
            href="/containers/new"
            className="gc-desktop-new"
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

          {/* Notifications Bell */}
          <Link
            href="/notifications"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 6,
              textDecoration: "none",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#21262d")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            aria-label="Notifications"
          >
            <Icons.Bell />
            {/* Notification dot indicator */}
            <span
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#1f6feb",
                border: `2px solid ${t.navBg}`,
              }}
            />
          </Link>

          {/* User */}
          <div style={{ position: "relative" }}>
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
            >
              C
            </button>
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  top: 40,
                  right: 0,
                  width: 200,
                  backgroundColor: "#161b22",
                  border: `1px solid ${t.navBorder}`,
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  zIndex: 100,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.navBorder}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.navFg }}>
                    christoph@0711.io
                  </div>
                  <div style={{ fontSize: 12, color: t.navMuted, marginTop: 2 }}>Administrator</div>
                </div>
                <Link
                  href="/settings/profile"
                  onClick={() => setShowMenu(false)}
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    fontSize: 13,
                    color: t.navFg,
                    textDecoration: "none",
                    borderBottom: `1px solid ${t.navBorder}`,
                  }}
                >
                  Your profile
                </Link>
                <Link
                  href="/settings/tokens"
                  onClick={() => setShowMenu(false)}
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    fontSize: 13,
                    color: t.navFg,
                    textDecoration: "none",
                    borderBottom: `1px solid ${t.navBorder}`,
                  }}
                >
                  API tokens
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setShowMenu(false)}
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    fontSize: 13,
                    color: t.navFg,
                    textDecoration: "none",
                    borderBottom: `1px solid ${t.navBorder}`,
                  }}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("token");
                      window.location.href = "/auth/login";
                    }
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 16px",
                    fontSize: 13,
                    color: "#f85149",
                    textAlign: "left",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileNavOpen && (
          <div
            style={{
              backgroundColor: t.navBg,
              borderTop: `1px solid ${t.navBorder}`,
              padding: "8px 0",
              maxHeight: "calc(100vh - 56px)",
              overflowY: "auto",
            }}
          >
            {/* Mobile Search */}
            <div style={{ padding: "8px 24px 12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "#21262d",
                  border: `1px solid ${t.navBorder}`,
                  borderRadius: 6,
                  padding: "8px 12px",
                  width: "100%",
                }}
              >
                <Icons.Search />
                <span style={{ color: t.navMuted, fontSize: 13 }}>Search containers...</span>
              </div>
            </div>

            {/* Mobile Nav Links */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: "block",
                  padding: "10px 24px",
                  fontSize: 15,
                  fontWeight: isActive(item.href) ? 600 : 400,
                  color: isActive(item.href) ? t.navFg : t.navMuted,
                  backgroundColor: isActive(item.href) ? "#21262d" : "transparent",
                  textDecoration: "none",
                  borderLeft: isActive(item.href)
                    ? `2px solid ${t.accent}`
                    : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile New Container Button */}
            <div style={{ padding: "12px 24px" }}>
              <Link
                href="/containers/new"
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 14px",
                  backgroundColor: t.accent,
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  width: "100%",
                  transition: "background 0.15s",
                }}
              >
                <Icons.Plus /> New Container
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Click outside to close user menu */}
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)}
          style={{ position: "fixed", inset: 0, zIndex: 49 }}
        />
      )}

      {/* Click outside to close mobile nav */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 49,
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        />
      )}

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

// Reusable Components for pages
export const PageHeader = ({ title, description }: { title: string; description?: string }) => (
  <div style={{ marginBottom: 24 }}>
    <h1 style={{ fontSize: 24, fontWeight: 700, color: t.fg, margin: 0, letterSpacing: "-0.02em" }}>
      {title}
    </h1>
    {description && (
      <p style={{ fontSize: 15, color: t.fgMuted, margin: "8px 0 0" }}>{description}</p>
    )}
  </div>
);

export const StatCard = ({
  icon,
  value,
  label,
  badge,
  href,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  badge?: string;
  href?: string;
}) => {
  const content = (
    <div
      style={{
        backgroundColor: "#fff",
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: t.fgMuted }}>{icon}</span>
        {badge && <span style={{ fontSize: 12, color: t.fgMuted }}>{badge}</span>}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: mono,
          color: t.fg,
          letterSpacing: "-0.02em",
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 13, color: t.fgMuted }}>{label}</div>
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  ) : (
    content
  );
};

export const Card = ({ children, padding = 20 }: { children: ReactNode; padding?: number }) => (
  <div
    style={{
      backgroundColor: "#fff",
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding,
    }}
  >
    {children}
  </div>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2
    style={{
      fontSize: 16,
      fontWeight: 600,
      color: t.fg,
      margin: "0 0 16px",
      letterSpacing: "-0.01em",
    }}
  >
    {children}
  </h2>
);

export const ActionRow = ({
  icon,
  label,
  href,
  badge,
}: {
  icon: ReactNode;
  label: string;
  href: string;
  badge?: string;
}) => (
  <Link
    href={href}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderBottom: `1px solid ${t.border}`,
      textDecoration: "none",
      color: t.fg,
      transition: "background 0.1s",
    }}
  >
    <span style={{ color: t.fgMuted }}>{icon}</span>
    <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
    {badge && <span style={{ fontSize: 12, color: "#1a7f37", fontWeight: 500 }}>{badge}</span>}
    <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}>
      <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  </Link>
);

export { t as theme };
