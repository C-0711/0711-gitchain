import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 to-transparent"></div>
        <div className="max-w-6xl mx-auto px-6 py-20 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm mb-6">
              <span>⛓️</span>
              <span>Blockchain-verified context for AI</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              The trust layer for<br />
              <span className="text-emerald-400">AI agent knowledge</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              GitChain is where verified facts live. Every piece of knowledge is versioned like code, 
              anchored on blockchain, and ready to inject into any AI agent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/containers/new"
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition"
              >
                Create a Container
              </Link>
              <Link
                href="/explore"
                className="px-8 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-semibold transition"
              >
                Explore Containers
              </Link>
            </div>
          </div>

          {/* Code Preview */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-sm text-gray-400 ml-2">inject.ts</span>
              </div>
              <pre className="p-6 text-sm overflow-x-auto">
                <code>{`import { inject } from "@0711/inject";

// Get verified context for your AI agent
const context = await inject({
  containers: ["0711:product:acme:widget-001:v2"],
  verify: true,
  format: "markdown"
});

// Every fact is traceable, every output is verified
console.log(context.formatted);
// ✓ Verified on Base Mainnet (block #18234567)`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why GitChain?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The problem with AI isn&apos;t intelligence — it&apos;s trust. GitChain provides 
            the verified knowledge layer that AI agents need.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 hover:border-emerald-500/50 transition">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-2xl mb-4">
              📦
            </div>
            <h3 className="text-xl font-semibold mb-3">Containers</h3>
            <p className="text-gray-400">
              Like Git repositories, but for knowledge. Version your data, track changes, 
              and maintain full history with Git-style versioning.
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-2xl mb-4">
              💉
            </div>
            <h3 className="text-xl font-semibold mb-3">Inject API</h3>
            <p className="text-gray-400">
              One API call to inject verified context into any AI agent. 
              Works with ChatGPT, Claude, Gemini, or your custom models.
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 hover:border-purple-500/50 transition">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-2xl mb-4">
              ⛓️
            </div>
            <h3 className="text-xl font-semibold mb-3">Blockchain Proofs</h3>
            <p className="text-gray-400">
              Every fact is anchored on Base Mainnet. Merkle proofs ensure 
              data integrity. Verify any claim, any time.
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 hover:border-yellow-500/50 transition">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center text-2xl mb-4">
              📜
            </div>
            <h3 className="text-xl font-semibold mb-3">Citations</h3>
            <p className="text-gray-400">
              Every piece of data traces back to its source. PDFs, documents, 
              databases — full audit trail included.
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 hover:border-orange-500/50 transition">
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center text-2xl mb-4">
              🏭
            </div>
            <h3 className="text-xl font-semibold mb-3">Container Types</h3>
            <p className="text-gray-400">
              Products, campaigns, projects, memories, knowledge bases. 
              Different types for different use cases, one unified API.
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 hover:border-pink-500/50 transition">
            <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center text-2xl mb-4">
              🔐
            </div>
            <h3 className="text-xl font-semibold mb-3">DPP & C2PA</h3>
            <p className="text-gray-400">
              Built-in support for Digital Product Passports and C2PA 
              content authenticity. Compliance-ready from day one.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">100%</div>
              <div className="text-gray-400">Verified Data</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">Base</div>
              <div className="text-gray-400">Mainnet Anchored</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">Git</div>
              <div className="text-gray-400">Style Versioning</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">Open</div>
              <div className="text-gray-400">Source SDKs</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to verify your AI&apos;s knowledge?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join the growing network of verified knowledge containers. 
            Start building trust into your AI applications today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs/getting-started"
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition"
            >
              Read the Docs
            </Link>
            <a
              href="https://github.com/C-0711/0711-gitchain"
              target="_blank"
              rel="noopener"
              className="px-8 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-semibold transition"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
