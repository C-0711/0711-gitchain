import type { Metadata } from "next";
import "./globals.css";
import { CommandPalette } from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "GitChain — Verified Context for AI",
  description: "Version, verify, and inject structured data into AI workflows. Every fact traceable to its source. Every change anchored on-chain.",
  keywords: ["AI", "LLM", "context", "blockchain", "verification", "RAG", "knowledge base", "GitChain"],
  authors: [{ name: "0711 Intelligence", url: "https://0711.io" }],
  creator: "0711 Intelligence",
  publisher: "0711 Intelligence",
  metadataBase: new URL("https://gitchain.0711.io"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gitchain.0711.io",
    siteName: "GitChain",
    title: "GitChain — Verified Context for AI",
    description: "Version, verify, and inject structured data into AI workflows. Every fact traceable. Every change on-chain.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GitChain - Verified Context for AI Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitChain — Verified Context for AI",
    description: "Version, verify, and inject structured data into AI workflows. Every fact traceable. Every change on-chain.",
    images: ["/og-image.png"],
    creator: "@0711intelligence",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d1117" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            margin: 0;
          }
        `}} />
      </head>
      <body>
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
