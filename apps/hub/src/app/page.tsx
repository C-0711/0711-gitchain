export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-emerald-400">GitChain</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Blockchain-verified context injection for AI agents
        </p>
        <p className="text-gray-500 max-w-2xl mx-auto">
          No hallucination. Full audit. Verified context.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="text-3xl mb-4">📦</div>
          <h3 className="text-lg font-semibold mb-2">Containers</h3>
          <p className="text-gray-400 text-sm">
            Git-versioned, blockchain-anchored knowledge units for products, campaigns, projects, and more.
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="text-3xl mb-4">💉</div>
          <h3 className="text-lg font-semibold mb-2">Inject</h3>
          <p className="text-gray-400 text-sm">
            Inject verified context into any AI agent. Every fact is traceable and auditable.
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="text-3xl mb-4">✅</div>
          <h3 className="text-lg font-semibold mb-2">Verify</h3>
          <p className="text-gray-400 text-sm">
            Blockchain proofs ensure data integrity. Merkle trees enable efficient verification.
          </p>
        </div>
      </div>

      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8">
        <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto text-sm">
          <code className="text-emerald-400">{`import { inject } from "@0711/inject";

const context = await inject({
  containers: ["0711:product:bosch:7736606982:v3"],
  verify: true,
  format: "markdown"
});

// Use verified context in your AI agent
console.log(context.formatted);`}</code>
        </pre>
      </div>
    </div>
  );
}
