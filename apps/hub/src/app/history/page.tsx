"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HistoryEntry {
  version: number;
  hash: string;
  message: string;
  author: string;
  timestamp: string;
}

export default function HistoryPage() {
  const [containerId, setContainerId] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!containerId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/containers/${encodeURIComponent(containerId)}/history`
      );
      const data = await response.json();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Version History</h1>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={containerId}
          onChange={(e) => setContainerId(e.target.value)}
          placeholder="0711:product:bosch:7736606982:v3"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-3"
        />
        <button
          onClick={fetchHistory}
          disabled={loading || !containerId}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-semibold"
        >
          {loading ? "Loading..." : "Get History"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={entry.hash}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-sm rounded">
                    v{entry.version}
                  </span>
                  <code className="text-gray-400 text-sm">{entry.hash.slice(0, 8)}</code>
                </div>
                <span className="text-gray-500 text-sm">{entry.timestamp}</span>
              </div>
              <p className="mb-2">{entry.message}</p>
              <p className="text-sm text-gray-500">by {entry.author}</p>
              {index < history.length - 1 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <Link
                    href={`/diff?from=v${entry.version}&to=v${history[index + 1]?.version}`}
                    className="text-sm text-emerald-400 hover:underline"
                  >
                    View diff with v{history[index + 1]?.version}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {history.length === 0 && containerId && !loading && (
        <div className="text-center text-gray-400 py-12">
          No history found for this container
        </div>
      )}
    </div>
  );
}
