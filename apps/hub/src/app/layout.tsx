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
      <body className="bg-gray-900 text-white min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-8">
            <a href="/" className="text-xl font-bold text-emerald-400">
              GitChain
            </a>
            <div className="flex gap-6 text-gray-400">
              <a href="/containers" className="hover:text-white">Containers</a>
              <a href="/verify" className="hover:text-white">Verify</a>
              <a href="/docs" className="hover:text-white">Docs</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
