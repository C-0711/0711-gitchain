import Link from "next/link";

export default function TypeScriptSDKPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/docs" className="text-emerald-600 hover:underline text-sm">
          ← Back to Docs
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-4">TypeScript SDK</h1>
        <p className="text-gray-600">
          Official TypeScript/JavaScript SDK for GitChain.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Installation</h2>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-600">{`npm install @0711/sdk
# or
yarn add @0711/sdk
# or
pnpm add @0711/sdk`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-600">{`import { GitChain } from "@0711/sdk";

// Initialize client
const client = new GitChain("gc_live_your_api_key");

// Inject verified context
const context = await client.inject({
  containers: ["0711:product:acme:widget-001:v1"],
  verify: true,
  format: "markdown"
});

console.log(context.formatted);`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">API Reference</h2>
          
          <h3 className="font-semibold mt-6 mb-2">client.inject(options)</h3>
          <p className="text-gray-600 mb-4">Inject verified context from containers.</p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`const context = await client.inject({
  containers: string[],    // Container IDs
  verify?: boolean,        // Verify on blockchain (default: true)
  format?: "markdown" | "json" | "yaml",
  includeCitations?: boolean,
  maxTokens?: number
});

// Returns
{
  containers: Container[],
  formatted: string,
  tokenCount: number,
  verified: boolean,
  citations: Citation[]
}`}</code></pre>
          </div>

          <h3 className="font-semibold mt-6 mb-2">client.containers.list(options?)</h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`const { containers, total } = await client.containers.list({
  type?: string,
  namespace?: string,
  limit?: number,
  offset?: number
});`}</code></pre>
          </div>

          <h3 className="font-semibold mt-6 mb-2">client.containers.get(id)</h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`const container = await client.containers.get(
  "0711:product:acme:widget-001:v1"
);`}</code></pre>
          </div>

          <h3 className="font-semibold mt-6 mb-2">client.containers.create(data)</h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`const container = await client.containers.create({
  type: "product",
  namespace: "acme",
  identifier: "widget-002",
  data: { name: "Widget 2", specs: {...} },
  meta: { description: "..." }
});`}</code></pre>
          </div>

          <h3 className="font-semibold mt-6 mb-2">client.verify(id)</h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`const verification = await client.verify(
  "0711:product:acme:widget-001:v1"
);

// Returns
{
  verified: boolean,
  chain: { network, txHash, blockNumber },
  merkle: { root, proof }
}`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Usage with LLMs</h2>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-600">{`import { GitChain } from "@0711/sdk";
import OpenAI from "openai";

const gitchain = new GitChain("gc_live_...");
const openai = new OpenAI();

// Get verified context
const context = await gitchain.inject({
  containers: ["0711:product:acme:widget-001:v1"],
  format: "markdown"
});

// Use in ChatGPT
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { 
      role: "system", 
      content: \`You have access to verified product data:\\n\\n\${context.formatted}\`
    },
    { role: "user", content: "What are the product specifications?" }
  ]
});`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Error Handling</h2>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-600">{`import { GitChain, GitChainError } from "@0711/sdk";

try {
  const context = await client.inject({...});
} catch (error) {
  if (error instanceof GitChainError) {
    console.error(error.code);    // "CONTAINER_NOT_FOUND"
    console.error(error.message); // "Container does not exist"
  }
}`}</code></pre>
          </div>
        </section>

        <div className="mt-8 p-4 bg-blue-100/20 border border-blue-700 rounded-lg">
          <h3 className="font-semibold mb-2">📦 Package Info</h3>
          <p className="text-sm text-gray-600">
            <strong>npm:</strong> <code className="text-emerald-600">@0711/sdk</code><br/>
            <strong>GitHub:</strong> <a href="https://github.com/C-0711/0711-gitchain" className="text-emerald-600 hover:underline">C-0711/0711-gitchain</a>
          </p>
        </div>
      </div>
    </div>
  );
}
