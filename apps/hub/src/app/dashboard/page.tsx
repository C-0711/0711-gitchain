"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  containers: number;
  namespaces: number;
  batches: number;
  verified: number;
}

interface RecentActivity {
  id: string;
  action: string;
  containerId: string;
  containerName: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    containers: 0,
    namespaces: 0,
    batches: 0,
    verified: 0,
  });
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Try API first
      const res = await fetch("/api/stats").catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setStats(data.stats || { containers: 0, namespaces: 0, batches: 0, verified: 0 });
        setActivity(data.activity || []);
      } else {
        // Demo data
        setStats({
          containers: 3,
          namespaces: 2,
          batches: 1,
          verified: 3,
        });
        setActivity([
          {
            id: "1",
            action: "created",
            containerId: "0711:product:acme:widget-001:v2",
            containerName: "Smart Widget Pro",
            timestamp: "2 min ago",
          },
          {
            id: "2",
            action: "verified",
            containerId: "0711:campaign:demo:launch-2026:v1",
            containerName: "Product Launch Q1",
            timestamp: "15 min ago",
          },
          {
            id: "3",
            action: "updated",
            containerId: "0711:knowledge:demo:user-guide:v3",
            containerName: "Platform User Guide",
            timestamp: "1 hour ago",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <StatCard
          title="Containers"
          value={stats.containers.toLocaleString()}
          icon="📦"
        />
        <StatCard
          title="Namespaces"
          value={stats.namespaces.toString()}
          icon="📁"
        />
        <StatCard
          title="Chain Batches"
          value={stats.batches.toString()}
          icon="⛓️"
        />
        <StatCard
          title="Verified"
          value={stats.containers > 0 ? `${((stats.verified / stats.containers) * 100).toFixed(0)}%` : "0%"}
          icon="✅"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Link
          href="/containers/new"
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 hover:border-emerald-500 transition"
        >
          <h3 className="font-semibold mb-2">Create Container</h3>
          <p className="text-gray-400 text-sm">Add a new container to GitChain</p>
        </Link>
        <Link
          href="/inject"
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 hover:border-blue-500 transition"
        >
          <h3 className="font-semibold mb-2">Inject Context</h3>
          <p className="text-gray-400 text-sm">Test the inject API playground</p>
        </Link>
        <Link
          href="/verify"
          className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 hover:border-purple-500 transition"
        >
          <h3 className="font-semibold mb-2">Verify</h3>
          <p className="text-gray-400 text-sm">Check blockchain proofs</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-gray-400">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {item.action === "created" && "📦"}
                    {item.action === "updated" && "✏️"}
                    {item.action === "verified" && "✅"}
                  </span>
                  <div>
                    <Link
                      href={`/containers/${encodeURIComponent(item.containerId)}`}
                      className="font-medium hover:text-emerald-400"
                    >
                      {item.containerName}
                    </Link>
                    <p className="text-sm text-gray-400">{item.action}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{item.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-gray-400">{title}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
