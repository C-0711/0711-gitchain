'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Container {
  id: string;
  type: string;
  namespace: string;
  identifier: string;
  version: number;
  name: string;
  description: string;
  isVerified: boolean;
  snr: string | null;
  manufacturer: string | null;
  etim: { classCode: string; className: string } | null;
  stats: { atoms: number; categories: number };
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalContainers: number;
  totalNamespaces: number;
  verifiedCount: number;
  totalAtoms: number;
}

const typeConfig: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  product:   { icon: '📦', bg: 'bg-emerald-900/30', text: 'text-emerald-400', border: 'border-emerald-800' },
  campaign:  { icon: '📢', bg: 'bg-blue-900/30',    text: 'text-blue-400',    border: 'border-blue-800' },
  project:   { icon: '📋', bg: 'bg-purple-900/30',  text: 'text-purple-400',  border: 'border-purple-800' },
  memory:    { icon: '🧠', bg: 'bg-orange-900/30',  text: 'text-orange-400',  border: 'border-orange-800' },
  knowledge: { icon: '📚', bg: 'bg-yellow-900/30',  text: 'text-yellow-400',  border: 'border-yellow-800' },
};

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchContainers();
  }, [filterType, sortBy]);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (sortBy) params.set('sort', sortBy);

      const res = await fetch(`/api/containers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContainers(data.containers || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error('Failed to fetch containers:', e);
    } finally {
      setLoading(false);
    }
  };

  const types = ['product', 'campaign', 'project', 'memory', 'knowledge'];

  const filtered = containers.filter(c =>
    !searchQuery ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.identifier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-[1280px] mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Containers</h1>
            {stats && (
              <p className="text-sm text-[#8b949e]">
                {stats.totalContainers} containers &middot; {stats.totalAtoms.toLocaleString()} atoms &middot; {stats.totalNamespaces} namespaces
              </p>
            )}
          </div>
          <Link
            href="/containers/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Container
          </Link>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Find a container..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#21262d] border border-[#363b42] rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Type: All</option>
              {types.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#21262d] border border-[#363b42] rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="recent">Sort: Recent</option>
              <option value="name">Sort: Name</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>
        </div>

        {/* Container List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-[#30363d] rounded-lg p-5 animate-pulse">
                <div className="h-5 bg-[#21262d] rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-[#21262d] rounded w-2/3 mb-3"></div>
                <div className="h-3 bg-[#21262d] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-[#30363d] rounded-lg">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">No containers found</h2>
            <p className="text-[#8b949e] mb-6">
              {searchQuery ? 'Try a different search term' : 'Create your first container to get started'}
            </p>
            <Link
              href="/containers/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition"
            >
              Create Container
            </Link>
          </div>
        ) : (
          <div className="border border-[#30363d] rounded-lg overflow-hidden divide-y divide-[#21262d]">
            {filtered.map((c) => {
              const tc = typeConfig[c.type] || { icon: '📦', bg: 'bg-gray-800', text: 'text-gray-400', border: 'border-gray-700' };
              return (
                <Link
                  key={c.id}
                  href={`/containers/${encodeURIComponent(c.id)}`}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-[#161b22] transition group"
                >
                  <div className="text-2xl mt-0.5">{tc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-400 hover:underline text-sm">{c.namespace}</span>
                      <span className="text-[#484f58]">/</span>
                      <span className="font-semibold text-white group-hover:text-blue-400 transition">{c.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${tc.bg} ${tc.text} ${tc.border}`}>
                        {c.type}
                      </span>
                      {c.isVerified && (
                        <span className="text-xs text-emerald-400">✓ verified</span>
                      )}
                    </div>
                    {c.description && (
                      <p className="text-sm text-[#8b949e] mb-2 truncate">{c.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[#484f58]">
                      {c.etim && (
                        <span className="text-blue-400/60">ETIM {c.etim.classCode}</span>
                      )}
                      <span>{c.stats.atoms.toLocaleString()} atoms</span>
                      <span>{c.stats.categories} categories</span>
                      <span>v{c.version}</span>
                      <span>Updated {new Date(c.updatedAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
