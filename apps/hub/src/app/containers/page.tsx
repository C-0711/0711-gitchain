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
    // TODO: Fetch from API
    // Mock data for now
    setContainers([
      {
        id: "0711:product:bosch:7736606982:v3",
        type: "product",
        namespace: "bosch",
        identifier: "7736606982",
        version: 3,
        meta: { name: "CS7001iAW 17 O TH", updatedAt: "2026-02-22" },
      },
      {
        id: "0711:product:bosch:7738601997:v2",
        type: "product",
        namespace: "bosch",
        identifier: "7738601997",
        version: 2,
        meta: { name: "CS7001i AW 13 OR-T", updatedAt: "2026-02-21" },
      },
    ]);
    setLoading(false);
  };

  const types = ["product", "campaign", "project", "memory", "knowledge"];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Containers</h1>
        <div className="flex gap-4">
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
      ) : (
        <div className="grid gap-4">
          {containers.map((container) => (
            <Link
              key={container.id}
              href={\`/containers/\${encodeURIComponent(container.id)}\`}
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
                  <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-xs rounded">
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
