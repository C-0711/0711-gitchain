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
    // TODO: Fetch from API
    setStats({
      containers: 23141,
      namespaces: 5,
      batches: 42,
      verified: 23141,
    });
    setActivity([
      {
        id: "1",
        action: "created",
        containerId: "0711:product:bosch:7736606982:v3",
        containerName: "CS7001iAW 17 O TH",
        timestamp: "2 min ago",
      },
      {
        id: "2",
        action: "updated",
        containerId: "0711:product:bosch:7738601997:v2",
        containerName: "CS7001i AW 13 OR-T",
        timestamp: "15 min ago",
      },
      {
        id: "3",
        action: "verified",
        containerId: "0711:product:bosch:7735500395:v1",
        containerName: "Compress 7000i AW",
        timestamp: "1 hour ago",
      },
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <StatCard
          title="Containers"
          value={stats.containers.toLocaleString()}
          icon="📦"
          trend="+124 today"
        />
        <StatCard
          title="Namespaces"
          value={stats.namespaces.toString()}
          icon="📁"
        />
        <StatCard
          title="Batches"
          value={stats.batches.toString()}
          icon="⛓️"
          trend="+2 today"
        />
        <StatCard
          title="Verified"
          value={`${((stats.verified / stats.containers) * 100).toFixed(1)}%`}
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
          href="/batch"
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 hover:border-blue-500 transition"
        >
          <h3 className="font-semibold mb-2">Batch Upload</h3>
          <p className="text-gray-400 text-sm">Register multiple containers at once</p>
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
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: string;
  trend?: string;
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-gray-400">{title}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {trend && <div className="text-sm text-emerald-400 mt-1">{trend}</div>}
    </div>
  );
}
