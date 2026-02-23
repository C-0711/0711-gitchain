'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Namespace {
  name: string;
  displayName: string;
  description: string;
  visibility: string;
  containerCount: number;
  memberCount: number;
  lastActivity: string;
  createdAt: string;
}

export default function NamespacesPage() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchNamespaces();
  }, []);

  const fetchNamespaces = async () => {
    try {
      const res = await fetch('/api/namespaces');
      if (res.ok) {
        const data = await res.json();
        setNamespaces(data.namespaces || []);
      }
    } catch (e) {
      console.error('Failed to fetch namespaces:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = namespaces.filter(ns =>
    ns.name.toLowerCase().includes(filter.toLowerCase()) ||
    ns.displayName?.toLowerCase().includes(filter.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Namespaces</h1>
            <p className="text-[#8b949e]">Organizations and users in the GitChain network</p>
          </div>
          <Link
            href="/namespaces/new"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition"
          >
            New Namespace
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Find a namespace..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-[#484f58] focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse border border-[#30363d] rounded-lg p-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#21262d] rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-[#21262d] rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-[#21262d] rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-[#30363d] rounded-lg p-12 text-center">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-[#8b949e] mb-4">
              {filter ? 'No namespaces match your search' : 'No namespaces yet'}
            </p>
            {!filter && (
              <Link href="/namespaces/new" className="text-emerald-400 hover:underline">
                Create the first namespace
              </Link>
            )}
          </div>
        ) : (
          <div className="border border-[#30363d] rounded-lg divide-y divide-[#21262d]">
            {filtered.map((ns) => (
              <Link
                key={ns.name}
                href={`/namespaces/${ns.name}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-[#161b22] transition"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {ns.displayName?.charAt(0).toUpperCase() || ns.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{ns.displayName || ns.name}</span>
                    <span className="text-[#484f58]">@{ns.name}</span>
                    {ns.visibility === 'private' && (
                      <span className="px-1.5 py-0.5 text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded">
                        Private
                      </span>
                    )}
                  </div>
                  {ns.description && (
                    <p className="text-sm text-[#8b949e] mt-1 truncate">{ns.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e]">
                    <span>📦 {ns.containerCount} containers</span>
                    {ns.memberCount > 0 && <span>👥 {ns.memberCount} members</span>}
                    <span>Updated {formatTime(ns.lastActivity)}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-[#484f58] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
