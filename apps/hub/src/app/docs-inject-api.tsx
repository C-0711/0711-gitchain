import Link from "next/link";

export default function InjectAPIPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/docs" className="text-emerald-400 hover:underline text-sm">
          ← Back to Docs
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-4">Inject API</h1>
        <p className="text-gray-400">
          The core API for retrieving verified context from GitChain containers.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">POST /api/inject</h2>
          <p className="text-gray-400 mb-4">
            Retrieve and format verified context from one or more containers.
          </p>
          
          <h3 className="font-semibold mt-6 mb-2">Request Body</h3>
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-400">{`{
  "containers": ["0711:product:acme:widget-001:v1"],
  "verify": true,
  "format": "markdown",
  "includeCitations": true,
  "maxTokens": 4000
}`}</code></pre>
          </div>

          <h3 className="font-semibold mt-6 mb-2">Parameters</h3>
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-2">Parameter</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Required</th>
                  <th className="text-left px-4 py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-4 py-2 font-mono text-emerald-400">containers</td>
                  <td className="px-4 py-2">string[]</td>
                  <td className="px-4 py-2">Yes</td>
                  <td className="px-4 py-2 text-gray-400">Array of container IDs</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-emerald-400">verify</td>
                  <td className="px-4 py-2">boolean</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 text-gray-400">Verify blockchain proofs (default: true)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-emerald-400">format</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 text-gray-400">markdown | json | yaml (default: markdown)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-emerald-400">includeCitations</td>
                  <td className="px-4 py-2">boolean</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 text-gray-400">Include source citations (default: true)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-emerald-400">maxTokens</td>
                  <td className="px-4 py-2">number</td>
                  <td className="px-4 py-2">No</td>
                  <td className="px-4 py-2 text-gray-400">Limit output tokens</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold mt-6 mb-2">Response</h3>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-400">{`{
  "success": true,
  "containers": [...],
  "formatted": "# Product: Smart Widget Pro\\n\\n...",
  "tokenCount": 1250,
  "verified": true,
  "verifiedAt": "2026-02-22T23:00:00Z",
  "citations": [
    { "id": "cit-001", "source": "datasheet.pdf", "page": 3 }
  ],
  "proofs": [
    { "containerId": "...", "merkleRoot": "0x...", "txHash": "0x..." }
  ]
}`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">SDK Usage</h2>
          
          <h3 className="font-semibold mt-4 mb-2">TypeScript</h3>
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-400">{`import { inject } from "@0711/inject";

const context = await inject({
  containers: ["0711:product:acme:widget-001:v1"],
  verify: true,
  format: "markdown"
});

// Use in your LLM
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: context.formatted },
    { role: "user", content: "Tell me about this product" }
  ]
});`}</code></pre>
          </div>

          <h3 className="font-semibold mt-4 mb-2">Python</h3>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-400">{`from gitchain import inject

context = inject(
    containers=["0711:product:acme:widget-001:v1"],
    verify=True,
    format="markdown"
)

# Use in your LLM
response = openai.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": context.formatted},
        {"role": "user", "content": "Tell me about this product"}
    ]
)`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Output Formats</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Markdown</h3>
              <p className="text-sm text-gray-400">Best for LLM prompts. Structured, readable, includes citations.</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">JSON</h3>
              <p className="text-sm text-gray-400">Structured data. Best for programmatic access and processing.</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">YAML</h3>
              <p className="text-sm text-gray-400">Human-readable structured format. Good for config-style data.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
