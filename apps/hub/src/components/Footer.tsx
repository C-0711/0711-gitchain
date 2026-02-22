import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/docs" className="hover:text-white">Documentation</Link>
            <Link href="/api" className="hover:text-white">API</Link>
            <a
              href="https://github.com/C-0711/0711-gitchain"
              target="_blank"
              rel="noopener"
              className="hover:text-white"
            >
              GitHub
            </a>
          </div>
          <div className="text-sm text-gray-500">
            © 2026 0711 Intelligence. Blockchain-verified context for AI.
          </div>
        </div>
      </div>
    </footer>
  );
}
