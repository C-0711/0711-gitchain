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
    updatedAt: string;
  };
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: "", namespace: "" });

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      // Try to fetch from API, fall back to demo data
      const res = await fetch("/api/containers").catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setContainers(data.containers || []);
      } else {
        // Demo data - no real containers yet
        setContainers([
          {
            id: "0711:product:acme:widget-001:v2",
            type: "product",
            namespace: "acme",
            identifier: "widget-001",
            version: 2,
            meta: { name: "Smart Widget Pro", updatedAt: "2026-02-22" },
          },
          {
            id: "0711:campaign:demo:launch-2026:v1",
            type: "campaign",
            namespace: "demo",
            identifier: "launch-2026",
            version: 1,
            meta: { name: "Product Launch Q1", updatedAt: "2026-02-21" },
          },
          {
            id: "0711:knowledge:demo:user-guide:v3",
            type: "knowledge",
            namespace: "demo",
            identifier: "user-guide",
            version: 3,
            meta: { name: "Platform User Guide", updatedAt: "2026-02-20" },
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const types = ["product", "campaign", "project", "memory", "knowledge"];

  const typeColors: Record<string, string> = {
    product: "bg-emerald-900/30 text-emerald-400",
    campaign: "bg-blue-900/30 text-blue-400",
    project: "bg-purple-900/30 text-purple-400",
    memory: "bg-orange-900/30 text-orange-400",
    knowledge: "bg-yellow-900/30 text-yellow-400",
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Containers</h1>
        <div className="flex gap-4">
          <Link
            href="/containers/new"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium"
          >
            New Container
          </Link>
          <select
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : containers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold mb-2">No containers yet</h2>
          <p className="text-gray-400 mb-6">Create your first container to get started</p>
          <Link
            href="/containers/new"
            className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold"
          >
            Create Container
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {containers.map((container) => (
            <Link
              key={container.id}
              href={`/containers/${encodeURIComponent(container.id)}`}
              className="block bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-emerald-500 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    {container.meta.name}
                  </h2>
                  <code className="text-sm text-gray-400">{container.id}</code>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded ${typeColors[container.type] || "bg-gray-700"}`}>
                    {container.type}
                  </span>
                  <span className="text-gray-500 text-sm">
                    v{container.version}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
