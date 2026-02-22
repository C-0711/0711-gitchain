"use client";

import { useState } from "react";

export default function VerifyPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!input.trim()) return;
    setLoading(true);

    // TODO: Call actual verification API
    await new Promise((r) => setTimeout(r, 1000));

    setResult({
      verified: true,
      container: {
        id: input,
        meta: { name: "CS7001iAW 17 O TH" },
        version: 3,
      },
      chain: {
        network: "base-mainnet",
        batchId: 42,
        txHash: "0x7f3a5b2c1d4e6f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
        blockNumber: 18234567,
        timestamp: new Date().toISOString(),
      },
      merkle: {
        root: "0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b",
        proof: ["0x...", "0x..."],
      },
    });

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Verify Container</h1>
        <p className="text-gray-400">
          Enter a container ID or content hash to verify its blockchain proof
        </p>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-8">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          placeholder="0711:product:bosch:7736606982:v3 or hash"
          className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 mb-4"
        />
        <button
          onClick={handleVerify}
          disabled={loading || !input.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 font-semibold py-3 rounded"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>

      {result && (
        <div
          className={\`rounded-lg p-6 \${
            result.verified
              ? "bg-emerald-900/20 border border-emerald-700"
              : "bg-red-900/20 border border-red-700"
          }\`}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">{result.verified ? "✅" : "❌"}</span>
            <div>
              <h2 className="text-xl font-bold">
                {result.verified ? "Verified" : "Not Verified"}
              </h2>
              <p className="text-gray-400">{result.container?.meta?.name}</p>
            </div>
          </div>

          {result.chain && (
            <div className="space-y-4 text-sm">
              <div className="bg-gray-800/50 rounded p-4">
                <h3 className="font-semibold mb-2">Blockchain Proof</h3>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network</span>
                    <span>{result.chain.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Block</span>
                    <span>{result.chain.blockNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Batch ID</span>
                    <span>{result.chain.batchId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Transaction</span>
                    <code className="block text-emerald-400 text-xs mt-1 break-all">
                      {result.chain.txHash}
                    </code>
                  </div>
                </div>
              </div>

              {result.merkle && (
                <div className="bg-gray-800/50 rounded p-4">
                  <h3 className="font-semibold mb-2">Merkle Proof</h3>
                  <div>
                    <span className="text-gray-400">Root</span>
                    <code className="block text-xs mt-1 break-all">
                      {result.merkle.root}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
