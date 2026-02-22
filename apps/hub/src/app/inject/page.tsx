"use client";

import { useState } from "react";

export default function InjectPage() {
  const [ids, setIds] = useState("0711:product:bosch:7736606982:v3");
  const [format, setFormat] = useState<"markdown" | "json" | "yaml">("markdown");
  const [verify, setVerify] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleInject = async () => {
    setLoading(true);
    try {
      const containerIds = ids.split("\n").map(s => s.trim()).filter(Boolean);
      const response = await fetch("/api/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ containers: containerIds, verify, format }),
      });
      setResult(await response.json());
    } catch (err: any) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Inject Context</h1>
      <p className="text-gray-400 mb-8">
        Test the inject() API — get verified context for AI agents
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Container IDs (one per line)
            </label>
            <textarea
              value={ids}
              onChange={(e) => setIds(e.target.value)}
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 font-mono text-sm"
              placeholder="0711:product:bosch:7736606982:v3"
            />
          </div>

          <div className="flex gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="bg-gray-800 border border-gray-700 rounded px-4 py-2"
              >
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Verify</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={verify}
                  onChange={(e) => setVerify(e.target.checked)}
                  className="rounded"
                />
                <span>Blockchain verification</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleInject}
            disabled={loading || !ids.trim()}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-semibold"
          >
            {loading ? "Injecting..." : "Inject Context"}
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400">Result</label>
            {result && (
              <div className="flex gap-4 text-sm">
                <span className={result.verified ? "text-emerald-400" : "text-yellow-400"}>
                  {result.verified ? "✓ Verified" : "⚠ Unverified"}
                </span>
                <span className="text-gray-500">
                  ~{result.tokenCount || 0} tokens
                </span>
              </div>
            )}
          </div>
          <pre className="bg-gray-900 border border-gray-700 rounded p-4 h-96 overflow-auto text-sm">
            {result ? (
              result.error ? (
                <span className="text-red-400">{result.error}</span>
              ) : (
                result.formatted || JSON.stringify(result, null, 2)
              )
            ) : (
              <span className="text-gray-500">Click Inject to see results...</span>
            )}
          </pre>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
        <h3 className="font-semibold mb-2">Code Example</h3>
        <pre className="text-sm text-gray-400">
{`import { inject } from "@0711/inject";

const context = await inject({
  containers: ${JSON.stringify(ids.split("\n").filter(Boolean), null, 2)},
  verify: ${verify},
  format: "${format}",
});

console.log(context.formatted);`}
        </pre>
      </div>
    </div>
  );
}
