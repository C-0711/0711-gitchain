import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitChain - Blockchain-Verified Context for AI",
  description: "No hallucination. Full audit trail. Every fact traceable and verified on blockchain.",
  openGraph: {
    title: "GitChain - Blockchain-Verified Context for AI",
    description: "Inject verified context into any AI agent. Every fact is traceable and blockchain-verified.",
    url: "https://gitchain.0711.io",
    siteName: "GitChain",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitChain - Blockchain-Verified Context for AI",
    description: "No hallucination. Full audit trail. Verified on blockchain.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
