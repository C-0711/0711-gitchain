'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Container {
  id: string;
  type: string;
  identifier: string;
  version: number;
  name: string;
  description: string;
  isVerified: boolean;
  stats: { atoms: number };
  updatedAt: string;
}

interface Member {
  user_id: string;
  role: string;
  user_name?: string;
  email?: string;
}

interface NamespaceData {
  name: string;
  displayName: string;
  description: string;
  visibility: string;
  containers: Container[];
  members: Member[];
  stats: {
    containerCount: number;
    memberCount: number;
    totalAtoms: number;
    verifiedCount: number;
  };
  createdAt: string;
}

const typeConfig: Record<string, { icon: string; bg: string; text: string }> = {
  product:   { icon: '📦', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  campaign:  { icon: '📢', bg: 'bg-blue-100',    text: 'text-blue-400' },
  project:   { icon: '📋', bg: 'bg-purple-900/30',  text: 'text-purple-400' },
  memory:    { icon: '🧠', bg: 'bg-orange-900/30',  text: 'text-orange-400' },
  knowledge: { icon: '📚', bg: 'bg-yellow-900/30',  text: 'text-yellow-400' },
};

export default function NamespacePage({ params }: { params: { name: string } }) {
  const [namespace, setNamespace] = useState<NamespaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchNamespace();
  }, [params.name]);

  const fetchNamespace = async () => {
    try {
      const res = await fetch(`/api/namespaces/${encodeURIComponent(params.name)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Namespace not found');
        } else {
          setError('Failed to load namespace');
        }
        return;
      }
      const data = await res.json();
      setNamespace(data);
    } catch (err) {
      setError('Failed to load namespace');
    } finally {
      setLoading(false);
    }
  };

  const sortedContainers = namespace?.containers.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'atoms') return (b.stats?.atoms || 0) - (a.stats?.atoms || 0);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-50 rounded w-1/4"></div>
            <div className="h-4 bg-gray-50 rounded w-1/2"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-50 rounded"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !namespace) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📁</div>
          <h2 className="text-2xl font-bold mb-2">Namespace not found</h2>
          <p className="text-gray-600 mb-6">{error || 'The namespace you requested could not be found.'}</p>
          <Link href="/namespaces" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition">
            Browse Namespaces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-[#c9d1d9]">
      {/* Header */}
      <div className="border-b border-[#21262d]">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold">
                  {namespace.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{namespace.displayName}</h1>
                  <p className="text-[#8b949e]">@{namespace.name}</p>
                </div>
              </div>
              {namespace.description && (
                <p className="text-[#8b949e] mt-3 max-w-2xl">{namespace.description}</p>
              )}
              <div className="flex items-center gap-6 mt-4 text-sm text-[#8b949e]">
                <span className="flex items-center gap-1">
                  <span>📦</span>
                  <strong className="text-gray-900">{namespace.stats.containerCount}</strong> containers
                </span>
                <span className="flex items-center gap-1">
                  <span>⚛️</span>
                  <strong className="text-gray-900">{namespace.stats.totalAtoms.toLocaleString()}</strong> atoms
                </span>
                <span className="flex items-center gap-1">
                  <span>⛓️</span>
                  <strong className="text-gray-900">{namespace.stats.verifiedCount}</strong> verified
                </span>
                {namespace.stats.memberCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span>👥</span>
                    <strong className="text-gray-900">{namespace.stats.memberCount}</strong> members
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/containers/new?namespace=${namespace.name}`}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition"
              >
                New Container
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1">
            {/* Containers header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Containers
                <span className="ml-2 text-sm font-normal text-[#8b949e]">{sortedContainers.length}</span>
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#21262d] border border-[#30363d] rounded-md px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="recent">Recently updated</option>
                  <option value="name">Name</option>
                  <option value="atoms">Most atoms</option>
                </select>
              </div>
            </div>

            {/* Containers list */}
            {sortedContainers.length === 0 ? (
              <div className="border border-[#30363d] rounded-lg p-12 text-center">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-[#8b949e] mb-4">No containers yet</p>
                <Link
                  href={`/containers/new?namespace=${namespace.name}`}
                  className="text-emerald-600 hover:underline"
                >
                  Create the first container
                </Link>
              </div>
            ) : (
              <div className="border border-[#30363d] rounded-lg divide-y divide-[#21262d]">
                {sortedContainers.map((container) => {
                  const tc = typeConfig[container.type] || typeConfig.product;
                  return (
                    <Link
                      key={container.id}
                      href={`/containers/${encodeURIComponent(container.id)}`}
                      className="block px-4 py-4 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-xl mt-0.5">{tc.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-400 hover:underline">
                                {container.name}
                              </span>
                              {container.isVerified && (
                                <span className="px-1.5 py-0.5 text-xs rounded bg-emerald-100 text-emerald-600 border border-emerald-300">
                                  ✓ Verified
                                </span>
                              )}
                              <span className="text-xs text-[#484f58]">v{container.version}</span>
                            </div>
                            {container.description && (
                              <p className="text-sm text-[#8b949e] mt-1 line-clamp-1">{container.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e]">
                              <span className={`px-2 py-0.5 rounded ${tc.bg} ${tc.text}`}>{container.type}</span>
                              <span>{container.stats?.atoms || 0} atoms</span>
                              <span>Updated {new Date(container.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="space-y-6">
              {/* About */}
              <div className="border border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold mb-3">About</h3>
                <p className="text-sm text-[#8b949e]">
                  {namespace.description || 'No description provided.'}
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#8b949e]">
                    <span>🔓</span>
                    <span className="capitalize">{namespace.visibility}</span>
                  </div>
                  {namespace.createdAt && (
                    <div className="flex items-center gap-2 text-[#8b949e]">
                      <span>📅</span>
                      <span>Created {new Date(namespace.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Members */}
              {namespace.members.length > 0 && (
                <div className="border border-[#30363d] rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Members</h3>
                  <div className="space-y-2">
                    {namespace.members.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                          {(member.user_name || member.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm">{member.user_name || member.email || member.user_id}</span>
                        <span className="text-xs text-[#484f58] capitalize">{member.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="border border-[#30363d] rounded-lg p-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href={`/containers/new?namespace=${namespace.name}`}
                    className="flex items-center gap-2 text-sm text-[#8b949e] hover:text-gray-900 transition"
                  >
                    <span>➕</span> New Container
                  </Link>
                  <Link
                    href={`/inject?namespace=${namespace.name}`}
                    className="flex items-center gap-2 text-sm text-[#8b949e] hover:text-gray-900 transition"
                  >
                    <span>💉</span> Inject All
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
