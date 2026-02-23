import Link from "next/link";

const t = {
  bg: "#fafaf9",
  surface: "#ffffff",
  fg: "#1a1a1a",
  fgMuted: "#6b6b6b",
  fgSubtle: "#9a9a9a",
  border: "#e5e5e3",
};

export default function Footer() {
  const sections = [
    {
      title: "Product",
      links: [
        { href: "/explore", label: "Explore" },
        { href: "/containers", label: "Containers" },
        { href: "/inject", label: "Inject API" },
        { href: "/verify", label: "Verification" },
        { href: "/docs", label: "Documentation" },
      ],
    },
    {
      title: "Developers",
      links: [
        { href: "/api-reference", label: "API Reference" },
        { href: "/docs/typescript-sdk", label: "TypeScript SDK" },
        { href: "/docs/python-sdk", label: "Python SDK" },
        { href: "https://github.com/C-0711/0711-gitchain", label: "GitHub", external: true },
      ],
    },
    {
      title: "Resources",
      links: [
        { href: "/docs/getting-started", label: "Getting Started" },
        { href: "/docs/container-types", label: "Container Types" },
        { href: "/docs/verification", label: "How Verification Works" },
        { href: "https://basescan.org/address/0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7", label: "Smart Contract", external: true },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "https://0711.io", label: "About 0711", external: true },
        { href: "mailto:hello@0711.io", label: "Contact" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
      ],
    },
  ];

  return (
    <footer style={{ borderTop: `1px solid ${t.border}`, backgroundColor: t.surface, marginTop: "auto" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 32,
          marginBottom: 32,
        }}>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: t.fg, marginBottom: 12 }}>
                {section.title}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {section.links.map((link) => (
                  <li key={link.href} style={{ marginBottom: 8 }}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener"
                        style={{ fontSize: 13, color: t.fgMuted, textDecoration: "none" }}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        style={{ fontSize: 13, color: t.fgMuted, textDecoration: "none" }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 24,
          borderTop: `1px solid ${t.border}`,
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.fg} strokeWidth="2.2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span style={{ fontWeight: 600, fontSize: 14, color: t.fg }}>GitChain</span>
            <span style={{ fontSize: 13, color: t.fgMuted }}>by 0711 Intelligence</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: t.fgMuted }}>
            <span>© 2026 0711 Intelligence</span>
            <a
              href="https://github.com/C-0711/0711-gitchain"
              target="_blank"
              rel="noopener"
              style={{ display: "flex", alignItems: "center", gap: 4, color: t.fgMuted, textDecoration: "none" }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
