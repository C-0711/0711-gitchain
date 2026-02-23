import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/explore" className="hover:text-white transition">Explore</Link></li>
              <li><Link href="/containers" className="hover:text-white transition">Containers</Link></li>
              <li><Link href="/inject" className="hover:text-white transition">Inject API</Link></li>
              <li><Link href="/verify" className="hover:text-white transition">Verification</Link></li>
              <li><Link href="/docs" className="hover:text-white transition">Documentation</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Developers</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/api-reference" className="hover:text-white transition">API Reference</Link></li>
              <li><Link href="/docs/typescript-sdk" className="hover:text-white transition">TypeScript SDK</Link></li>
              <li><Link href="/docs/python-sdk" className="hover:text-white transition">Python SDK</Link></li>
              <li><Link href="/docs/inject-api" className="hover:text-white transition">Inject API Docs</Link></li>
              <li><a href="https://github.com/C-0711/0711-gitchain" target="_blank" rel="noopener" className="hover:text-white transition">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/docs/getting-started" className="hover:text-white transition">Getting Started</Link></li>
              <li><Link href="/docs/container-types" className="hover:text-white transition">Container Types</Link></li>
              <li><Link href="/docs/verification" className="hover:text-white transition">How Verification Works</Link></li>
              <li><a href="https://basescan.org/address/0xAd31465A5618Ffa27eC1f3c0056C2f5CC621aEc7" target="_blank" rel="noopener" className="hover:text-white transition">Smart Contract</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="https://0711.io" target="_blank" rel="noopener" className="hover:text-white transition">About 0711</a></li>
              <li><a href="mailto:hello@0711.io" className="hover:text-white transition">Contact</a></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span className="text-xl">⛓️</span>
            <span className="font-bold">GitChain</span>
            <span className="text-gray-500 text-sm">by 0711 Intelligence</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>© 2026 0711 Intelligence</span>
            <a href="https://github.com/C-0711/0711-gitchain" target="_blank" rel="noopener" className="hover:text-white transition flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
