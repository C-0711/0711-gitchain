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
  etim: { classCode: string; className: string } | null;
  stats: { atoms: number; categories: number };
  updatedAt: string;
}

const typeConfig: Record<string, { icon: string; bg: string; text: string; border: string; label: string }> = {
  product:   { icon: '📦', bg: 'bg-emerald-900/30', text: 'text-emerald-400', border: 'border-emerald-800', label: 'Products' },
  campaign:  { icon: '📢', bg: 'bg-blue-900/30',    text: 'text-blue-400',    border: 'border-blue-800',    label: 'Campaigns' },
  project:   { icon: '📋', bg: 'bg-purple-900/30',  text: 'text-purple-400',  border: 'border-purple-800',  label: 'Projects' },
  memory:    { icon: '🧠', bg: 'bg-orange-900/30',  text: 'text-orange-400',  border: 'border-orange-800',  label: 'Memory' },
  knowledge: { icon: '📚', bg: 'bg-yellow-900/30',  text: 'text-yellow-400',  border: 'border-yellow-800',  label: 'Knowledge' },
};

export default function ExplorePage() {
  const [containers, setContainers] = useState<Container[]>([]);
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
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/containers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContainers(data.containers || []);
      }
    } catch (e) {
      console.error('Failed to fetch:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = containers.filter(c =>
    !searchQuery ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-[1280px] mx-auto px-6 py-8">

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Explore</h1>
          <p className="text-[#8b949e] text-lg">
            Discover verified containers across the GitChain network
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search all containers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchContainers()}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-12 pr-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterType('')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition border ${
              !filterType
                ? 'bg-[#21262d] border-[#484f58] text-white'
                : 'border-[#30363d] text-[#8b949e] hover:border-[#484f58]'
            }`}
          >
            All
          </button>
          {Object.entries(typeConfig).map(([key, tc]) => (
            <button
              key={key}
              onClick={() => setFilterType(filterType === key ? '' : key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition border ${
                filterType === key
                  ? `${tc.bg} ${tc.border} ${tc.text}`
                  : 'border-[#30363d] text-[#8b949e] hover:border-[#484f58]'
              }`}
            >
              <span>{tc.icon}</span>
              {tc.label}
            </button>
          ))}
        </div>

        {/* Sort + count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#8b949e]">{filtered.length} container{filtered.length !== 1 ? 's' : ''}</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#21262d] border border-[#363b42] rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="recent">Recently updated</option>
            <option value="name">Alphabetical</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border border-[#30363d] rounded-lg p-6 animate-pulse">
                <div className="h-5 bg-[#21262d] rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-[#21262d] rounded w-2/3 mb-3"></div>
                <div className="h-3 bg-[#21262d] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-[#30363d] rounded-xl">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2 text-white">No containers found</h2>
            <p className="text-[#8b949e] mb-6">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const tc = typeConfig[c.type] || typeConfig.product;
              return (
                <Link
                  key={c.id}
                  href={`/containers/${encodeURIComponent(c.id)}`}
                  className="block border border-[#30363d] rounded-lg p-5 hover:border-[#484f58] hover:bg-[#161b22]/50 transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${tc.bg} flex-shrink-0`}>
                      {tc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-blue-400">{c.namespace}</span>
                        <span className="text-[#30363d]">/</span>
                        <span className="font-semibold text-white group-hover:text-blue-400 transition text-lg">{c.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${tc.bg} ${tc.text} ${tc.border}`}>
                          {c.type}
                        </span>
                        {c.isVerified && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-sm text-[#8b949e] mb-2">{c.description}</p>
                      )}
                      <div className="flex items-center gap-5 text-xs text-[#484f58]">
                        <code className="bg-[#161b22] px-2 py-0.5 rounded font-mono">{c.id}</code>
                        <span>{c.stats.atoms.toLocaleString()} atoms</span>
                        <span>{c.stats.categories} categories</span>
                        <span>v{c.version}</span>
                        {c.etim && (
                          <span className="text-blue-400/60">ETIM {c.etim.classCode}</span>
                        )}
                        <span className="ml-auto">Updated {new Date(c.updatedAt).toLocaleDateString('de-DE')}</span>
                      </div>
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
