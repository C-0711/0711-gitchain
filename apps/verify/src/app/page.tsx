"use client";

import { useState } from "react";

export default function VerifyPage() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!hash) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(hash)}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Verification failed" });
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Verify Container</h1>

      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <label className="block text-sm text-gray-400 mb-2">Container ID or Content Hash</label>
        <input
          type="text"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="0711:product:bosch:7736606982:v3"
          className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 mb-4 text-white"
        />
        <button
          onClick={handleVerify}
          disabled={loading || !hash}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>

      {result && (
        <div
          className={`p-6 rounded-lg ${result.verified ? "bg-emerald-900/30 border border-emerald-700" : "bg-red-900/30 border border-red-700"}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{result.verified ? "✅" : "❌"}</span>
            <span className="font-semibold">{result.verified ? "Verified" : "Not Verified"}</span>
          </div>

          {result.container && (
            <div className="text-sm text-gray-400">
              <p>
                <strong>Name:</strong> {result.container.meta?.name}
              </p>
              <p>
                <strong>Version:</strong> v{result.container.version}
              </p>
              <p>
                <strong>Updated:</strong> {result.container.meta?.updatedAt}
              </p>
            </div>
          )}

          {result.chain && (
            <div className="mt-4 text-sm">
              <p className="text-gray-400">
                <strong>Blockchain:</strong> {result.chain.network}
              </p>
              <p className="text-gray-400">
                <strong>Batch:</strong> {result.chain.batchId}
              </p>
              <p className="text-emerald-400 truncate">
                <strong>TX:</strong> {result.chain.txHash}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
