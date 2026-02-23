"use client";

import Link from "next/link";
import AppShell, { PageHeader, Card, theme as t } from "@/components/AppShell";

const Ic = {
  Book: () => <svg width="24" height="24" viewBox="0 0 16 16" fill="#656d76"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Z"/></svg>,
  Code: () => <svg width="24" height="24" viewBox="0 0 16 16" fill="#656d76"><path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06-1.06L13.94 8l-3.72-3.72a.749.749 0 0 1 1.06-1.06Zm-6.56 0a.749.749 0 0 1 0 1.06L1.06 8l3.72 3.72a.749.749 0 0 1-1.06 1.06L-.53 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.749.749 0 0 1 1.06 0Z"/></svg>,
  Terminal: () => <svg width="24" height="24" viewBox="0 0 16 16" fill="#656d76"><path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25ZM7.25 8a.749.749 0 0 1-.22.53l-2.25 2.25a.749.749 0 0 1-1.06-1.06L5.44 8 3.72 6.28a.749.749 0 1 1 1.06-1.06l2.25 2.25c.141.14.22.331.22.53Zm1.5 1.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Z"/></svg>,
  Shield: () => <svg width="24" height="24" viewBox="0 0 16 16" fill="#656d76"><path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z"/></svg>,
  Zap: () => <svg width="24" height="24" viewBox="0 0 16 16" fill="#656d76"><path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.346 1.909 1.22 3.004l-7.34 7.142a1.249 1.249 0 0 1-2.33-.861l1.545-4.285H3.462c-1.57 0-2.346-1.909-1.22-3.004Z"/></svg>,
  Layers: () => <svg width="24" height="24" viewBox="0 0 16 16" fill="#656d76"><path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0Z"/></svg>,
};

const docs = [
  { href: "/docs/getting-started", icon: <Ic.Book />, title: "Getting Started", desc: "Quick introduction to GitChain concepts and setup" },
  { href: "/docs/container-types", icon: <Ic.Layers />, title: "Container Types", desc: "Products, campaigns, projects, memories, and knowledge bases" },
  { href: "/docs/inject-api", icon: <Ic.Zap />, title: "Inject API", desc: "Inject verified context into any AI model" },
  { href: "/docs/verification", icon: <Ic.Shield />, title: "Verification", desc: "How blockchain anchoring and Merkle proofs work" },
  { href: "/docs/typescript-sdk", icon: <Ic.Code />, title: "TypeScript SDK", desc: "Official SDK for Node.js and browser environments" },
  { href: "/docs/python-sdk", icon: <Ic.Terminal />, title: "Python SDK", desc: "Official SDK for Python applications" },
];

export default function DocsPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="Documentation" description="Learn how to use GitChain to build trustworthy AI applications" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {docs.map(doc => (
            <Link key={doc.href} href={doc.href} style={{
              display: "block", padding: 24, backgroundColor: "#fff",
              border: `1px solid ${t.border}`, borderRadius: 8, textDecoration: "none",
              transition: "border-color 0.15s",
            }}>
              <div style={{ marginBottom: 12 }}>{doc.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 16, color: t.fg, marginBottom: 6 }}>{doc.title}</div>
              <div style={{ fontSize: 14, color: t.fgMuted, lineHeight: 1.5 }}>{doc.desc}</div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 48 }}>
          <Card>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 16px" }}>Need Help?</h3>
            <p style={{ fontSize: 14, color: t.fgMuted, lineHeight: 1.6 }}>
              Join our community on Discord or open an issue on GitHub. We are happy to help you get started.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <a href="https://github.com/C-0711/0711-gitchain" target="_blank" rel="noopener" style={{
                padding: "8px 16px", backgroundColor: "#0d1117", color: "#fff",
                borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: "none",
              }}>GitHub</a>
              <a href="mailto:hello@0711.io" style={{
                padding: "8px 16px", backgroundColor: "#fff", color: t.fg,
                border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 14, fontWeight: 500, textDecoration: "none",
              }}>Contact Us</a>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
