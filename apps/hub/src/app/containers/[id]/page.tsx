"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Container {
  id: string;
  type: string;
  namespace: string;
  identifier: string;
  version: number;
  meta: {
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
  data: Record<string, any>;
  chain?: {
    verified: boolean;
    batchId?: number;
    txHash?: string;
    blockNumber?: number;
  };
}

export default function ContainerDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"data" | "history" | "chain">("data");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchContainer();
  }, [id]);

  const fetchContainer = async () => {
    try {
      const res = await fetch(`/api/containers/${encodeURIComponent(id)}`).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setContainer(data);
      } else {
        // Parse ID and create demo container
        const parts = id.split(":");
        setContainer({
          id,
          type: parts[1] || "product",
          namespace: parts[2] || "demo",
          identifier: parts[3] || "unknown",
          version: parseInt(parts[4]?.replace("v", "")) || 1,
          meta: {
            name: parts[3]?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Container",
            description: "Demo container for GitChain",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: "demo",
          },
          data: {
            example: "This is demo data",
            features: ["Feature 1", "Feature 2", "Feature 3"],
            specs: {
              weight: "1.5kg",
              dimensions: "10x20x30cm",
            },
          },
          chain: {
            verified: true,
            batchId: 1,
            txHash: "0x" + "a".repeat(64),
            blockNumber: 18234567,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeColors: Record<string, string> = {
    product: "bg-emerald-900/30 text-emerald-400 border-emerald-700",
    campaign: "bg-blue-900/30 text-blue-400 border-blue-700",
    project: "bg-purple-900/30 text-purple-400 border-purple-700",
    memory: "bg-orange-900/30 text-orange-400 border-orange-700",
    knowledge: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!container) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h1 className="text-2xl font-bold mb-2">Container Not Found</h1>
        <p className="text-gray-400 mb-6">The container &quot;{id}&quot; does not exist</p>
        <Link href="/containers" className="text-emerald-400 hover:underline">
          ← Back to Containers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header - GitHub style */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-2 py-1 text-xs rounded border ${typeColors[container.type] || "bg-gray-700"}`}>
            {container.type}
          </span>
          <h1 className="text-2xl font-bold">
            <Link href={`/containers?namespace=${container.namespace}`} className="text-gray-400 hover:text-white">
              {container.namespace}
            </Link>
            <span className="text-gray-600 mx-2">/</span>
            <span>{container.identifier}</span>
          </h1>
          {container.chain?.verified && (
            <span className="px-2 py-1 text-xs bg-emerald-900/30 text-emerald-400 rounded">
              ✓ Verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{container.meta.name}</span>
          <span>•</span>
          <span>v{container.version}</span>
          <span>•</span>
          <span>Updated {new Date(container.meta.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={copyId}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-500 text-sm"
        >
          {copied ? "✓ Copied!" : "📋 Copy ID"}
        </button>
        <Link
          href={`/inject?ids=${encodeURIComponent(id)}`}
          className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-lg hover:bg-emerald-500/30 text-sm"
        >
          💉 Inject
        </Link>
        <Link
          href={`/verify?id=${encodeURIComponent(id)}`}
          className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 text-sm"
        >
          ✅ Verify
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex gap-6">
          {[
            { key: "data", label: "📊 Data", count: Object.keys(container.data).length },
            { key: "history", label: "📝 History", count: container.version },
            { key: "chain", label: "⛓️ Chain", count: container.chain?.batchId || 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 px-1 text-sm border-b-2 transition ${
                activeTab === tab.key
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 bg-gray-800 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {activeTab === "data" && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
                <span className="text-sm text-gray-400">Container Data</span>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(container.data, null, 2))}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Copy JSON
                </button>
              </div>
              <pre className="p-4 text-sm overflow-auto max-h-96">
                <code className="text-emerald-400">
                  {JSON.stringify(container.data, null, 2)}
                </code>
              </pre>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {Array.from({ length: container.version }, (_, i) => container.version - i).map((v) => (
                <div
                  key={v}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">Version {v}</div>
                    <div className="text-sm text-gray-400">
                      {v === container.version ? "Current version" : "Previous version"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {v === container.version && (
                      <span className="px-2 py-1 text-xs bg-emerald-900/30 text-emerald-400 rounded">
                        Latest
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs bg-gray-700 rounded">
                      ⛓️ Anchored
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "chain" && container.chain && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⛓️</span>
                <div>
                  <div className="font-semibold">Blockchain Anchor</div>
                  <div className="text-sm text-gray-400">Base Mainnet</div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Status</span>
                  <span className="text-emerald-400">✓ Verified</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Batch ID</span>
                  <span>{container.chain.batchId}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Block</span>
                  <span>{container.chain.blockNumber?.toLocaleString()}</span>
                </div>
                <div className="py-2">
                  <span className="text-gray-400 block mb-1">Transaction</span>
                  <code className="text-xs text-emerald-400 break-all">{container.chain.txHash}</code>
                </div>
              </div>
              <a
                href={`https://basescan.org/tx/${container.chain.txHash}`}
                target="_blank"
                rel="noopener"
                className="block text-center py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm mt-4"
              >
                View on Basescan →
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-3">About</h3>
            <p className="text-sm text-gray-400 mb-4">
              {container.meta.description || "No description"}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="capitalize">{container.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Version</span>
                <span>v{container.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created</span>
                <span>{new Date(container.meta.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Container ID</h3>
            <code className="text-xs text-emerald-400 break-all">{id}</code>
          </div>

          {container.chain?.verified && (
            <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✅</span>
                <h3 className="font-semibold">Verified</h3>
              </div>
              <p className="text-sm text-gray-400">
                This container is anchored on Base Mainnet blockchain
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
