"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Namespace {
  type: string;
  name: string;
  containerCount: number;
  lastActivity: string;
}

export default function NamespacesPage() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    // TODO: Fetch from API
    setNamespaces([
      {
        type: "product",
        name: "bosch",
        containerCount: 23141,
        lastActivity: "2 min ago",
      },
      {
        type: "campaign",
        name: "0711",
        containerCount: 12,
        lastActivity: "1 hour ago",
      },
      {
        type: "knowledge",
        name: "etim",
        containerCount: 156,
        lastActivity: "3 hours ago",
      },
    ]);
    setLoading(false);
  }, []);

  const typeColors: Record<string, string> = {
    product: "bg-emerald-900/30 text-emerald-400",
    campaign: "bg-blue-900/30 text-blue-400",
    project: "bg-purple-900/30 text-purple-400",
    memory: "bg-orange-900/30 text-orange-400",
    knowledge: "bg-yellow-900/30 text-yellow-400",
  };

  const filtered = namespaces.filter(
    (ns) =>
      ns.name.toLowerCase().includes(filter.toLowerCase()) ||
      ns.type.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Namespaces</h1>
        <Link
          href="/namespaces/new"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium"
        >
          Create Namespace
        </Link>
      </div>

      <input
        type="text"
        placeholder="Filter namespaces..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 mb-6"
      />

      <div className="grid gap-4">
        {filtered.map((ns) => (
          <Link
            key={`${ns.type}/${ns.name}`}
            href={`/containers?type=${ns.type}&namespace=${ns.name}`}
            className="block bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-emerald-500 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-xs rounded ${typeColors[ns.type] || "bg-gray-700"}`}>
                    {ns.type}
                  </span>
                  <h2 className="text-lg font-semibold">{ns.name}</h2>
                </div>
                <p className="text-gray-400 text-sm">
                  {ns.containerCount.toLocaleString()} containers
                </p>
              </div>
              <span className="text-sm text-gray-500">{ns.lastActivity}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
