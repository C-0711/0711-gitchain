"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppShell from "@/components/AppShell";

const t = {
  bg: "#ffffff",
  fg: "#1f2328",
  fgMuted: "#656d76",
  border: "#d1d9e0",
  activeBg: "#f6f8fa",
  activeBorder: "#fd8c73",
};

const navItems = [
  { href: "/settings/profile", label: "Profile", icon: "👤" },
  { href: "/settings/account", label: "Account", icon: "⚙️" },
  { href: "/settings/tokens", label: "API Tokens", icon: "🔑" },
  { href: "/settings/security", label: "Security", icon: "🛡️" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppShell>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: t.fg, marginBottom: 24 }}>
          Settings
        </h1>
        
        <div style={{ display: "flex", gap: 32 }}>
          {/* Sidebar */}
          <nav style={{ width: 220, flexShrink: 0 }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        marginBottom: 4,
                        borderRadius: 6,
                        fontSize: 14,
                        color: isActive ? t.fg : t.fgMuted,
                        backgroundColor: isActive ? t.activeBg : "transparent",
                        borderLeft: isActive ? `2px solid ${t.activeBorder}` : "2px solid transparent",
                        textDecoration: "none",
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
