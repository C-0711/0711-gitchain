"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Container {
  id: string;
  type: string;
  namespace: string;
  identifier: string;
  version: number;
  meta: {
    name: string;
    description?: string;
    updatedAt: string;
  };
  stats?: {
    injects: number;
    verifications: number;
  };
}

export default function ExplorePage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: "", sort: "recent" });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchContainers();
  }, [filter]);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/containers?sort=${filter.sort}&type=${filter.type}`).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setContainers(data.containers || []);
      } else {
        // Demo data
        setContainers([
          {
            id: "0711:product:acme:widget-001:v2",
            type: "product",
            namespace: "acme",
            identifier: "widget-001",
            version: 2,
            meta: { name: "Smart Widget Pro", description: "Advanced IoT widget with AI capabilities", updatedAt: "2026-02-22" },
            stats: { injects: 1234, verifications: 567 },
          },
          {
            id: "0711:knowledge:demo:ai-handbook:v3",
            type: "knowledge",
            namespace: "demo",
            identifier: "ai-handbook",
            version: 3,
            meta: { name: "AI Agent Handbook", description: "Complete guide for AI agent development", updatedAt: "2026-02-21" },
            stats: { injects: 890, verifications: 234 },
          },
          {
            id: "0711:campaign:demo:launch-2026:v1",
            type: "campaign",
            namespace: "demo",
            identifier: "launch-2026",
            version: 1,
            meta: { name: "Product Launch Q1", description: "Marketing campaign for Q1 2026", updatedAt: "2026-02-20" },
            stats: { injects: 456, verifications: 123 },
          },
          {
            id: "0711:project:demo:gitchain-docs:v5",
            type: "project",
            namespace: "demo",
            identifier: "gitchain-docs",
            version: 5,
            meta: { name: "GitChain Documentation", description: "Official documentation project", updatedAt: "2026-02-19" },
            stats: { injects: 2345, verifications: 890 },
          },
          {
            id: "0711:memory:demo:agent-context:v1",
            type: "memory",
            namespace: "demo",
            identifier: "agent-context",
            version: 1,
            meta: { name: "Agent Memory Store", description: "Persistent memory for AI agents", updatedAt: "2026-02-18" },
            stats: { injects: 678, verifications: 345 },
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { value: "", label: "All types", icon: "📦" },
    { value: "product", label: "Products", icon: "🏭" },
    { value: "campaign", label: "Campaigns", icon: "📢" },
    { value: "project", label: "Projects", icon: "📋" },
    { value: "memory", label: "Memory", icon: "🧠" },
    { value: "knowledge", label: "Knowledge", icon: "📚" },
  ];

  const typeColors: Record<string, string> = {
    product: "bg-emerald-900/30 text-emerald-400 border-emerald-700",
    campaign: "bg-blue-900/30 text-blue-400 border-blue-700",
    project: "bg-purple-900/30 text-purple-400 border-purple-700",
    memory: "bg-orange-900/30 text-orange-400 border-orange-700",
    knowledge: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
  };

  const filteredContainers = containers.filter(c => 
    !searchQuery || 
    c.meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore</h1>
        <p className="text-gray-400">
          Discover verified containers across the GitChain network
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search containers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {types.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilter({ ...filter, type: type.value })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                filter.type === type.value
                  ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400"
                  : "bg-gray-800 border border-gray-700 hover:border-gray-600"
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sort options */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-400 text-sm">
          {filteredContainers.length} containers
        </p>
        <select
          value={filter.sort}
          onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="recent">Recently updated</option>
          <option value="popular">Most injected</option>
          <option value="verified">Most verified</option>
          <option value="name">Alphabetical</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredContainers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">No containers found</h2>
          <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredContainers.map((container) => (
            <Link
              key={container.id}
              href={`/containers/${encodeURIComponent(container.id)}`}
              className="block bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-emerald-500/50 hover:bg-gray-800/70 transition group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded border ${typeColors[container.type] || "bg-gray-700"}`}>
                    {container.type}
                  </span>
                  <h2 className="text-lg font-semibold group-hover:text-emerald-400 transition">
                    {container.meta.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>v{container.version}</span>
                  <span>•</span>
                  <span>✅ Verified</span>
                </div>
              </div>
              
              {container.meta.description && (
                <p className="text-gray-400 text-sm mb-3">{container.meta.description}</p>
              )}
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <code className="text-xs bg-gray-900 px-2 py-1 rounded">{container.id}</code>
                {container.stats && (
                  <>
                    <span className="flex items-center gap-1">
                      <span>💉</span> {container.stats.injects.toLocaleString()} injects
                    </span>
                    <span className="flex items-center gap-1">
                      <span>✓</span> {container.stats.verifications.toLocaleString()} verifications
                    </span>
                  </>
                )}
                <span>Updated {new Date(container.meta.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load more */}
      {filteredContainers.length >= 5 && (
        <div className="text-center mt-8">
          <button className="px-6 py-2 border border-gray-700 hover:border-gray-500 rounded-lg transition">
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
