import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitChain Hub",
  description: "Blockchain-verified context for AI agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            margin: 0;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
