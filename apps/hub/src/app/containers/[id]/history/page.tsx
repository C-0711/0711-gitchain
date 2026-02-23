'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Commit {
  id: string;
  version: number;
  message: string;
  hash: string;
  parentHash: string | null;
  author: string;
  authorName: string;
  createdAt: string;
  isAnchored: boolean;
  txHash: string | null;
  blockNumber: number | null;
  network: string | null;
  layerInfo?: {
    type: string;
    trustLevel: string;
    atomCount: number;
  };
}

const trustColors: Record<string, string> = {
  highest: 'bg-green-400',
  high: 'bg-blue-400',
  certified: 'bg-indigo-400',
  verified: 'bg-cyan-400',
  medium: 'bg-yellow-400',
  customer: 'bg-purple-400',
  generated: 'bg-orange-400',
  community: 'bg-gray-400',
};

export default function HistoryPage({ params }: { params: { id: string } }) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  const containerId = decodeURIComponent(params.id);

  useEffect(() => {
    fetchCommits();
  }, [containerId]);

  const fetchCommits = async () => {
    try {
      const res = await fetch(`/api/containers/${encodeURIComponent(containerId)}/commits`);
      if (!res.ok) throw new Error('Failed to fetch commits');
      const data = await res.json();
      setCommits(data.commits || []);
      setSource(data.source || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shortHash = (hash: string) => hash?.substring(0, 7) || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href={`/containers/${encodeURIComponent(containerId)}`} className="text-emerald-600 hover:underline">
            Back to container
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-[#c9d1d9]">
      {/* Header */}
      <div className="border-b border-[#21262d]">
        <div className="max-w-[1280px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-[#8b949e]">
            <Link href={`/containers/${encodeURIComponent(containerId)}`} className="hover:text-gray-900">
              {containerId}
            </Link>
            <span>/</span>
            <span className="text-gray-900">History</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Commit History
            <span className="text-sm font-normal text-[#8b949e] ml-2">
              {commits.length} commits
            </span>
          </h1>
          {source === 'layers' && (
            <span className="text-xs text-[#8b949e] bg-[#21262d] px-2 py-1 rounded">
              Generated from layers
            </span>
          )}
        </div>

        {commits.length === 0 ? (
          <div className="border border-[#30363d] rounded-lg p-12 text-center">
            <div className="text-4xl mb-3">📜</div>
            <p className="text-[#8b949e]">No commits yet</p>
          </div>
        ) : (
          <div className="border border-[#30363d] rounded-lg divide-y divide-[#21262d]">
            {commits.map((commit, idx) => (
              <div key={commit.id} className="px-4 py-4 hover:bg-gray-100 transition">
                <div className="flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      commit.isAnchored ? 'bg-emerald-400' : 
                      commit.layerInfo ? trustColors[commit.layerInfo.trustLevel] || 'bg-gray-400' :
                      'bg-blue-400'
                    }`}></div>
                    {idx < commits.length - 1 && (
                      <div className="w-0.5 h-full bg-[#30363d] mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{commit.message}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-[#8b949e]">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-[8px] font-bold">
                              {commit.authorName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span>{commit.authorName || commit.author}</span>
                          </div>
                          <span>·</span>
                          <span>{formatDate(commit.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Anchored badge */}
                        {commit.isAnchored ? (
                          <a
                            href={`https://basescan.org/tx/${commit.txHash}`}
                            target="_blank"
                            rel="noopener"
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-600 border border-emerald-300 rounded text-xs hover:bg-emerald-200 transition"
                          >
                            <span>⛓️</span>
                            <span>Block #{commit.blockNumber}</span>
                          </a>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-[#21262d] text-[#8b949e] rounded text-xs">
                            <span>⏳</span>
                            <span>Pending</span>
                          </span>
                        )}

                        {/* Hash */}
                        <code className="px-2 py-1 bg-[#21262d] text-[#8b949e] rounded text-xs font-mono">
                          {shortHash(commit.hash)}
                        </code>
                      </div>
                    </div>

                    {/* Layer info */}
                    {commit.layerInfo && (
                      <div className="flex items-center gap-3 mt-3 text-xs">
                        <span className="px-2 py-0.5 bg-[#21262d] rounded text-[#8b949e]">
                          {commit.layerInfo.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${trustColors[commit.layerInfo.trustLevel] || 'bg-gray-400'}`}></div>
                          <span className="text-[#8b949e]">{commit.layerInfo.trustLevel}</span>
                        </span>
                        <span className="text-[#8b949e]">{commit.layerInfo.atomCount} atoms</span>
                      </div>
                    )}

                    {/* Parent link */}
                    {commit.parentHash && (
                      <div className="mt-2 text-xs text-[#484f58]">
                        Parent: <code className="font-mono">{shortHash(commit.parentHash)}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-6">
          <Link
            href={`/containers/${encodeURIComponent(containerId)}`}
            className="text-sm text-[#8b949e] hover:text-gray-900 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to container
          </Link>
        </div>
      </div>
    </div>
  );
}
