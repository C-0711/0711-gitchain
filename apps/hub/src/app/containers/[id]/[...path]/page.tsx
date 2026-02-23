'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FileData {
  path: string;
  name: string;
  type: string;
  atoms: {
    field: string;
    name: string;
    value: any;
    unit: string | null;
    source: string;
    trust: string;
    citation: {
      document: string;
      page?: number;
      excerpt?: string;
      confidence: number;
    } | null;
  }[];
}

interface ContainerData {
  id: string;
  namespace: string;
  identifier: string;
  version: number;
  files: FileData[];
}

const trustColors: Record<string, { bg: string; text: string }> = {
  highest: { bg: 'bg-green-900/30', text: 'text-green-400' },
  high: { bg: 'bg-blue-100', text: 'text-blue-400' },
  certified: { bg: 'bg-indigo-900/30', text: 'text-indigo-400' },
  verified: { bg: 'bg-cyan-900/30', text: 'text-cyan-400' },
  medium: { bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  customer: { bg: 'bg-purple-900/30', text: 'text-purple-400' },
  generated: { bg: 'bg-orange-900/30', text: 'text-orange-400' },
  community: { bg: 'bg-gray-50', text: 'text-gray-600' },
};

export default function FileViewPage({ 
  params 
}: { 
  params: { id: string; path: string[] } 
}) {
  const [container, setContainer] = useState<ContainerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const containerId = decodeURIComponent(params.id);
  const filePath = params.path?.join('/') || '';

  useEffect(() => {
    fetchContainer();
  }, [containerId]);

  const fetchContainer = async () => {
    try {
      const res = await fetch(`/api/containers/${encodeURIComponent(containerId)}`);
      if (!res.ok) throw new Error('Container not found');
      const data = await res.json();
      setContainer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !container) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Container not found'}</p>
          <Link href="/containers" className="text-emerald-600 hover:underline">
            Back to containers
          </Link>
        </div>
      </div>
    );
  }

  // Find the file by path
  const file = container.files?.find(f => f.path === filePath || f.name === filePath);
  
  if (!file) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-600 mb-4">File not found: {filePath}</p>
          <Link href={`/containers/${encodeURIComponent(containerId)}`} className="text-emerald-600 hover:underline">
            Back to container
          </Link>
        </div>
      </div>
    );
  }

  // Generate JSON content from atoms
  const fileContent = JSON.stringify(
    file.atoms.reduce((acc, atom) => {
      acc[atom.field] = {
        value: atom.value,
        unit: atom.unit,
        source: atom.source,
        trust: atom.trust,
        ...(atom.citation ? { citation: atom.citation } : {})
      };
      return acc;
    }, {} as Record<string, any>),
    null,
    2
  );

  const lines = fileContent.split('\n');
  const citedAtoms = file.atoms.filter(a => a.citation);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/containers" className="text-blue-400 hover:underline">
              containers
            </Link>
            <span className="text-gray-600">/</span>
            <Link href={`/namespaces/${container.namespace}`} className="text-blue-400 hover:underline">
              {container.namespace}
            </Link>
            <span className="text-gray-600">/</span>
            <Link href={`/containers/${encodeURIComponent(containerId)}`} className="text-blue-400 hover:underline">
              {container.identifier}
            </Link>
            <span className="text-gray-600">/</span>
            <span className="font-semibold">{file.name}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* File header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-xl">📄</span>
            <span className="font-medium">{file.name}</span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{file.atoms.length} fields</span>
              <span>•</span>
              <span>{lines.length} lines</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowRaw(!showRaw)}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                showRaw 
                  ? 'bg-gray-200 border-gray-300' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showRaw ? 'Formatted' : 'Raw'}
            </button>
            <Link
              href={`/containers/${encodeURIComponent(containerId)}/history`}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
            >
              History
            </Link>
            <button 
              onClick={() => navigator.clipboard.writeText(fileContent)}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
              title="Copy"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Version info */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/50 rounded-t-lg border border-gray-300">
          <span className="text-sm text-gray-600">Version</span>
          <span className="font-mono text-sm">v{container.version}</span>
          <span className="text-gray-600">•</span>
          <span className="text-sm text-gray-600">Container ID:</span>
          <code className="text-xs text-gray-600">{containerId}</code>
        </div>

        {/* File content */}
        <div className="border border-t-0 border-gray-300 rounded-b-lg overflow-hidden">
          {/* Code view */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="hover:bg-gray-50/30">
                    <td className="px-4 py-0.5 text-right text-gray-600 select-none border-r border-gray-200 w-12">
                      {index + 1}
                    </td>
                    <td className="px-4 py-0.5 whitespace-pre">
                      {showRaw ? line : (
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: line
                              .replace(/"([^"]+)":/g, '<span class="text-purple-400">""</span>:')
                              .replace(/: "([^"]+)"/g, ': <span class="text-green-400">""</span>')
                              .replace(/: (\d+\.?\d*)/g, ': <span class="text-blue-400"></span>')
                              .replace(/: (true|false|null)/g, ': <span class="text-orange-400"></span>')
                          }} 
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Citations panel */}
        {citedAtoms.length > 0 && (
          <div className="mt-6 border border-gray-300 rounded-lg">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-300 bg-gray-50/50">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-sm">Citations in this file</span>
              <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-full">
                {citedAtoms.length} citations
              </span>
            </div>
            
            <div className="divide-y divide-gray-200">
              {citedAtoms.slice(0, 10).map((atom, i) => {
                const trust = trustColors[atom.trust] || trustColors.community;
                return (
                  <div key={i} className="flex items-start gap-4 px-4 py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-purple-400 text-sm">{atom.name || atom.field}</code>
                        <span className="text-gray-600">=</span>
                        <code className="text-blue-400 text-sm">{String(atom.value)}{atom.unit ? ` ${atom.unit}` : ''}</code>
                      </div>
                      {atom.citation && (
                        <>
                          <div className="text-sm text-gray-600">
                            <span className="text-gray-600">Source:</span> {atom.citation.document}
                            {atom.citation.page && ` (page ${atom.citation.page})`}
                          </div>
                          {atom.citation.excerpt && (
                            <div className="text-sm text-gray-600 italic mt-1">
                              "{atom.citation.excerpt}"
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${trust.bg} ${trust.text}`}>
                        {atom.trust}
                      </span>
                      {atom.citation && (
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          atom.citation.confidence >= 0.95 ? 'bg-green-900/50 text-green-400' :
                          atom.citation.confidence >= 0.80 ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-orange-900/50 text-orange-400'
                        }`}>
                          {(atom.citation.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {citedAtoms.length > 10 && (
                <div className="px-4 py-3 text-sm text-gray-600">
                  + {citedAtoms.length - 10} more citations
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-6">
          <Link
            href={`/containers/${encodeURIComponent(containerId)}`}
            className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center gap-1"
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
