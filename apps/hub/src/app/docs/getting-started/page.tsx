import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/docs" className="text-emerald-400 hover:underline text-sm">
          ← Back to Docs
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-4">Getting Started</h1>
        <p className="text-gray-400">
          Learn how to integrate GitChain into your AI applications in minutes.
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Install the SDK</h2>
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <pre className="text-sm"><code className="text-emerald-400">{`# TypeScript/JavaScript
npm install @0711/sdk

# Python
pip install gitchain`}</code></pre>
        </div>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Get your API Key</h2>
        <p className="text-gray-400 mb-4">
          Navigate to <Link href="/settings" className="text-emerald-400 hover:underline">Settings → API Keys</Link> to 
          generate your API key. Keep it secure and never commit it to public repositories.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. Inject your first container</h2>
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <pre className="text-sm"><code className="text-emerald-400">{`import { GitChain } from "@0711/sdk";

const client = new GitChain("gc_live_your_api_key");

// Inject verified context into your AI agent
const context = await client.inject({
  containers: ["0711:product:acme:widget-001:v1"],
  verify: true,
  format: "markdown"
});

// Use in your LLM prompt
console.log(context.formatted);
// Output: Verified product data with citations`}</code></pre>
        </div>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Create your first container</h2>
        <p className="text-gray-400 mb-4">
          Containers are the core unit of GitChain. They hold verified knowledge that AI agents can trust.
        </p>
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <pre className="text-sm"><code className="text-emerald-400">{`// Create a container
const container = await client.containers.create({
  type: "product",
  namespace: "my-company",
  identifier: "product-001",
  data: {
    name: "My Product",
    description: "Product description",
    specs: { weight: "1.5kg", dimensions: "10x20x30cm" }
  }
});

console.log(container.id);
// Output: 0711:product:my-company:product-001:v1`}</code></pre>
        </div>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Verify on blockchain</h2>
        <p className="text-gray-400 mb-4">
          Every container is automatically anchored to Base Mainnet. You can verify any container:
        </p>
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <pre className="text-sm"><code className="text-emerald-400">{`const verification = await client.verify("0711:product:my-company:product-001:v1");

console.log(verification);
// {
//   verified: true,
//   chain: { network: "base-mainnet", txHash: "0x...", block: 18234567 },
//   merkle: { root: "0x...", proof: [...] }
// }`}</code></pre>
        </div>

        <div className="mt-12 p-6 bg-emerald-900/20 border border-emerald-700 rounded-lg">
          <h3 className="font-semibold mb-2">Next Steps</h3>
          <ul className="space-y-2 text-gray-400">
            <li>→ <Link href="/docs/container-types" className="text-emerald-400 hover:underline">Learn about Container Types</Link></li>
            <li>→ <Link href="/docs/inject-api" className="text-emerald-400 hover:underline">Explore the Inject API</Link></li>
            <li>→ <Link href="/docs/verification" className="text-emerald-400 hover:underline">Understand Verification</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
