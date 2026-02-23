'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
  unchanged: number;
  total: number;
}

interface DiffItem {
  field: string;
  name: string | null;
  value?: any;
  unit?: string | null;
  trust?: string;
  from?: { value: any; unit: string | null; trust: string };
  to?: { value: any; unit: string | null; trust: string };
}

interface DiffData {
  from: string;
  to: string;
  stats: DiffStats;
  diff: {
    additions: DiffItem[];
    deletions: DiffItem[];
    modifications: DiffItem[];
  };
}

interface Layer {
  id: string;
  name: string;
  type: string;
  contributor: string;
  atomCount: number;
  createdAt: string;
}

export default function ComparePage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [diffLoading, setDiffLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [fromLayer, setFromLayer] = useState(searchParams.get('from') || '');
  const [toLayer, setToLayer] = useState(searchParams.get('to') || '');

  const containerId = decodeURIComponent(params.id);

  useEffect(() => {
    fetchLayers();
  }, [containerId]);

  useEffect(() => {
    if (fromLayer && toLayer && fromLayer !== toLayer) {
      fetchDiff();
    }
  }, [fromLayer, toLayer]);

  const fetchLayers = async () => {
    try {
      const res = await fetch(`/api/containers/${encodeURIComponent(containerId)}/versions`);
      if (!res.ok) throw new Error('Failed to fetch versions');
      const data = await res.json();
      setLayers(data.layers || []);
      
      // Auto-select first two layers if available
      if (data.layers?.length >= 2 && !fromLayer && !toLayer) {
        setFromLayer(data.layers[1]?.id || '');
        setToLayer(data.layers[0]?.id || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiff = async () => {
    setDiffLoading(true);
    try {
      const res = await fetch(
        `/api/containers/${encodeURIComponent(containerId)}/diff?from=${encodeURIComponent(fromLayer)}&to=${encodeURIComponent(toLayer)}`
      );
      if (!res.ok) throw new Error('Failed to calculate diff');
      const data = await res.json();
      setDiffData(data);
    } catch (err) {
      console.error('Diff error:', err);
    } finally {
      setDiffLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href={`/containers/${encodeURIComponent(containerId)}`} className="text-emerald-400 hover:underline">
            Back to container
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <div className="border-b border-[#21262d]">
        <div className="max-w-[1280px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-[#8b949e] mb-4">
            <Link href={`/containers/${encodeURIComponent(containerId)}`} className="hover:text-white">
              {containerId}
            </Link>
            <span>/</span>
            <span className="text-white">Compare</span>
          </div>

          <h1 className="text-xl font-semibold mb-4">Compare Layers</h1>

          {/* Layer selectors */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8b949e]">Base:</span>
              <select
                value={fromLayer}
                onChange={(e) => setFromLayer(e.target.value)}
                className="bg-[#21262d] border border-[#30363d] rounded-md px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select layer...</option>
                {layers.map(layer => (
                  <option key={layer.id} value={layer.id}>
                    {layer.id}: {layer.name} ({layer.atomCount} atoms)
                  </option>
                ))}
              </select>
            </div>

            <span className="text-2xl text-[#484f58]">→</span>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8b949e]">Compare:</span>
              <select
                value={toLayer}
                onChange={(e) => setToLayer(e.target.value)}
                className="bg-[#21262d] border border-[#30363d] rounded-md px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select layer...</option>
                {layers.map(layer => (
                  <option key={layer.id} value={layer.id} disabled={layer.id === fromLayer}>
                    {layer.id}: {layer.name} ({layer.atomCount} atoms)
                  </option>
                ))}
              </select>
            </div>

            {fromLayer && toLayer && fromLayer !== toLayer && (
              <button
                onClick={() => { const tmp = fromLayer; setFromLayer(toLayer); setToLayer(tmp); }}
                className="p-2 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-md transition"
                title="Swap"
              >
                ⇄
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Diff content */}
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        {diffLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-400">Calculating diff...</div>
          </div>
        ) : !diffData ? (
          <div className="text-center py-12 border border-[#30363d] rounded-lg">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-[#8b949e]">Select two layers to compare</p>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="flex items-center gap-6 mb-6 p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-green-400 font-medium">+{diffData.stats.additions}</span>
                <span className="text-[#8b949e] text-sm">additions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-red-400 font-medium">-{diffData.stats.deletions}</span>
                <span className="text-[#8b949e] text-sm">deletions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-yellow-400 font-medium">~{diffData.stats.modifications}</span>
                <span className="text-[#8b949e] text-sm">modifications</span>
              </div>
              <div className="ml-auto text-sm text-[#484f58]">
                {diffData.stats.unchanged} unchanged
              </div>
            </div>

            {/* Additions */}
            {diffData.diff.additions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                  <span>+</span> Additions ({diffData.diff.additions.length})
                </h3>
                <div className="border border-green-900/50 rounded-lg overflow-hidden">
                  {diffData.diff.additions.map((item, i) => (
                    <div key={i} className="px-4 py-2 border-b border-green-900/30 last:border-0 bg-green-900/10">
                      <div className="flex items-center gap-3">
                        <code className="text-green-400 text-sm">+ {item.name || item.field}</code>
                        <span className="text-[#484f58]">=</span>
                        <code className="text-white text-sm">{JSON.stringify(item.value)}</code>
                        {item.unit && <span className="text-[#8b949e] text-xs">{item.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deletions */}
            {diffData.diff.deletions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                  <span>-</span> Deletions ({diffData.diff.deletions.length})
                </h3>
                <div className="border border-red-900/50 rounded-lg overflow-hidden">
                  {diffData.diff.deletions.map((item, i) => (
                    <div key={i} className="px-4 py-2 border-b border-red-900/30 last:border-0 bg-red-900/10">
                      <div className="flex items-center gap-3">
                        <code className="text-red-400 text-sm">- {item.name || item.field}</code>
                        <span className="text-[#484f58]">=</span>
                        <code className="text-[#8b949e] text-sm line-through">{JSON.stringify(item.value)}</code>
                        {item.unit && <span className="text-[#8b949e] text-xs">{item.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modifications */}
            {diffData.diff.modifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                  <span>~</span> Modifications ({diffData.diff.modifications.length})
                </h3>
                <div className="border border-yellow-900/50 rounded-lg overflow-hidden">
                  {diffData.diff.modifications.map((item, i) => (
                    <div key={i} className="px-4 py-3 border-b border-yellow-900/30 last:border-0 bg-yellow-900/10">
                      <div className="font-medium text-sm mb-2">{item.name || item.field}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-900/20 rounded px-3 py-2">
                          <div className="text-xs text-red-400 mb-1">Before</div>
                          <code className="text-sm text-red-300">{JSON.stringify(item.from?.value)}</code>
                          {item.from?.unit && <span className="text-xs text-[#8b949e] ml-1">{item.from.unit}</span>}
                        </div>
                        <div className="bg-green-900/20 rounded px-3 py-2">
                          <div className="text-xs text-green-400 mb-1">After</div>
                          <code className="text-sm text-green-300">{JSON.stringify(item.to?.value)}</code>
                          {item.to?.unit && <span className="text-xs text-[#8b949e] ml-1">{item.to.unit}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No changes */}
            {diffData.stats.additions === 0 && diffData.stats.deletions === 0 && diffData.stats.modifications === 0 && (
              <div className="text-center py-12 border border-[#30363d] rounded-lg">
                <div className="text-4xl mb-3">✓</div>
                <p className="text-[#8b949e]">No differences between these layers</p>
              </div>
            )}
          </>
        )}

        {/* Back link */}
        <div className="mt-6">
          <Link
            href={`/containers/${encodeURIComponent(containerId)}`}
            className="text-sm text-[#8b949e] hover:text-white transition flex items-center gap-1"
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
