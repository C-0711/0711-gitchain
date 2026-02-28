import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://gitchain.0711.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GitChain - Verified Context for AI Agents",
    template: "%s | GitChain",
  },
  description:
    "Inject blockchain-verified context into AI agents. No hallucination. Full audit trail. Every fact traceable to its source and verified on Base Mainnet.",
  keywords: [
    "AI context",
    "blockchain verification",
    "LLM",
    "RAG",
    "product data",
    "digital product passport",
    "verified data",
    "AI agents",
    "Base blockchain",
    "Merkle proof",
    "context injection",
    "GitChain",
  ],
  authors: [{ name: "0711 Intelligence", url: "https://0711.io" }],
  creator: "0711 Intelligence",
  publisher: "0711 Intelligence",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "GitChain",
    title: "GitChain - Verified Context for AI Agents",
    description:
      "Inject blockchain-verified context into AI agents. No hallucination. Every fact traceable and verified on Base Mainnet.",
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
    site: "@0711_ai",
    creator: "@0711_ai",
    title: "GitChain - Verified Context for AI Agents",
    description:
      "No hallucination. Full audit trail. Every fact verified on blockchain.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GitChain",
  applicationCategory: "DeveloperApplication",
  description:
    "Blockchain-verified context injection for AI agents. No hallucination. Full audit trail.",
  url: siteUrl,
  author: {
    "@type": "Organization",
    name: "0711 Intelligence",
    url: "https://0711.io",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier available",
  },
  operatingSystem: "Any",
  softwareVersion: "1.0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
