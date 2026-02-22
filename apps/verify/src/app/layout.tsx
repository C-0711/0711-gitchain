import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify | GitChain",
  description: "Verify blockchain-anchored containers",
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
          <a href="/" className="text-xl font-bold text-emerald-400">
            GitChain Verify
          </a>
        </nav>
        {children}
      </body>
    </html>
  );
}
