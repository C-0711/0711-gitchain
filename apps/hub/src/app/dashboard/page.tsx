'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalContainers: number;
  totalNamespaces: number;
  verifiedCount: number;
  totalAtoms: number;
}

interface Container {
  id: string;
  type: string;
  namespace: string;
  name: string;
  stats: { atoms: number; categories: number };
  updatedAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/containers');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setContainers(data.containers || []);
      }
    } catch (e) {
      console.error('Failed to fetch:', e);
    } finally {
      setLoading(false);
    }
  };

  const typeIcons: Record<string, string> = {
    product: '📦', campaign: '📢', project: '📋', memory: '🧠', knowledge: '📚',
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-[1280px] mx-auto px-6 py-8">

        <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Containers"
            value={stats?.totalContainers ?? 0}
            icon="📦"
            color="emerald"
            href="/containers"
          />
          <StatCard
            label="Namespaces"
            value={stats?.totalNamespaces ?? 0}
            icon="📁"
            color="blue"
            href="/namespaces"
          />
          <StatCard
            label="Total Atoms"
            value={stats?.totalAtoms ?? 0}
            icon="⚛️"
            color="purple"
          />
          <StatCard
            label="On-Chain"
            value={stats?.verifiedCount ?? 0}
            icon="⛓️"
            color="orange"
            href="/verify"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Link
            href="/containers/new"
            className="group border border-[#30363d] rounded-lg p-5 hover:border-emerald-600 transition bg-[#0d1117]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-900/30 rounded-lg flex items-center justify-center text-xl group-hover:bg-emerald-900/50 transition">
                📦
              </div>
              <h3 className="font-semibold text-white">Create Container</h3>
            </div>
            <p className="text-sm text-[#8b949e]">Start a new knowledge container with versioning and blockchain proofs</p>
          </Link>
          <Link
            href="/inject"
            className="group border border-[#30363d] rounded-lg p-5 hover:border-blue-600 transition bg-[#0d1117]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center text-xl group-hover:bg-blue-900/50 transition">
                💉
              </div>
              <h3 className="font-semibold text-white">Inject Context</h3>
            </div>
            <p className="text-sm text-[#8b949e]">Test the inject API and generate verified context for AI agents</p>
          </Link>
          <Link
            href="/verify"
            className="group border border-[#30363d] rounded-lg p-5 hover:border-purple-600 transition bg-[#0d1117]"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center text-xl group-hover:bg-purple-900/50 transition">
                ⛓️
              </div>
              <h3 className="font-semibold text-white">Verify Proof</h3>
            </div>
            <p className="text-sm text-[#8b949e]">Check blockchain proofs and verify container integrity</p>
          </Link>
        </div>

        {/* Recent Containers */}
        <div className="border border-[#30363d] rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-[#161b22] border-b border-[#21262d] flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Containers</h2>
            <Link href="/containers" className="text-sm text-blue-400 hover:underline">View all</Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="w-10 h-10 bg-[#21262d] rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-[#21262d] rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-[#21262d] rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : containers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-[#8b949e] mb-4">No containers yet</p>
              <Link href="/containers/new" className="text-sm text-emerald-400 hover:underline">
                Create your first container
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#21262d]">
              {containers.slice(0, 10).map((c) => (
                <Link
                  key={c.id}
                  href={`/containers/${encodeURIComponent(c.id)}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-[#161b22] transition group"
                >
                  <span className="text-2xl">{typeIcons[c.type] || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-400">{c.namespace}</span>
                      <span className="text-[#484f58]">/</span>
                      <span className="font-medium text-white group-hover:text-blue-400 transition">{c.name}</span>
                    </div>
                    <div className="text-xs text-[#484f58]">
                      {c.stats.atoms.toLocaleString()} atoms &middot; {c.stats.categories} categories
                    </div>
                  </div>
                  <span className="text-xs text-[#484f58]">
                    {new Date(c.updatedAt).toLocaleDateString('de-DE')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, href }: {
  label: string;
  value: number;
  icon: string;
  color: string;
  href?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'border-emerald-800 bg-emerald-900/10',
    blue: 'border-blue-800 bg-blue-900/10',
    purple: 'border-purple-800 bg-purple-900/10',
    orange: 'border-orange-800 bg-orange-900/10',
  };

  const inner = (
    <div className={`border rounded-lg p-5 transition ${colorMap[color] || 'border-[#30363d]'} ${href ? 'hover:border-opacity-100 cursor-pointer' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-[#8b949e]">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value.toLocaleString()}</div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
