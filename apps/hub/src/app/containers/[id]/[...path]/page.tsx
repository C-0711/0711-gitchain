'use client';

import { useState } from 'react';
import Link from 'next/link';

// Example file content for specs/performance.json
const EXAMPLE_FILE = {
  path: 'specs/performance.json',
  name: 'performance.json',
  size: 2048,
  lines: 45,
  lastCommit: {
    hash: 'eacb2b2',
    message: 'AI enrichment: COP values extracted from datasheet',
    author: 'bombas@0711.io',
    date: '2026-02-23T10:30:00Z',
  },
  content: `{
  "$schema": "https://gitchain.0711.io/schemas/specs/performance.json",
  "container": "0711:product:bosch:7736606982",
  "version": 7,
  
  "heating": {
    "cop_a7w35": {
      "value": 4.82,
      "unit": "W/W",
      "source": {
        "type": "ai_generated",
        "contributor": "bombas@0711.io",
        "layer": "002-ai-enrichment"
      },
      "citation": {
        "document": "0711:document:bosch:bodbsp_7736606982:v1",
        "page": 3,
        "excerpt": "COP (A7/W35): 4,82",
        "confidence": 0.98
      }
    },
    "cop_a2w35": {
      "value": 3.51,
      "unit": "W/W",
      "source": {
        "type": "ai_generated",
        "contributor": "bombas@0711.io",
        "layer": "002-ai-enrichment"
      },
      "citation": {
        "document": "0711:document:bosch:bodbsp_7736606982:v1",
        "page": 3,
        "excerpt": "COP (A2/W35): 3,51",
        "confidence": 0.97
      }
    },
    "capacity_a7w35": {
      "value": 17.1,
      "unit": "kW",
      "source": {
        "type": "ai_generated",
        "contributor": "bombas@0711.io",
        "layer": "002-ai-enrichment"
      },
      "citation": {
        "document": "0711:document:bosch:bodbsp_7736606982:v1",
        "page": 2,
        "excerpt": "Nenn-Wärmeleistung: 17,1 kW",
        "confidence": 0.99
      }
    }
  },
  
  "cooling": {
    "eer_a35w18": {
      "value": 4.12,
      "unit": "W/W",
      "source": {
        "type": "ai_generated",
        "contributor": "bombas@0711.io",
        "layer": "002-ai-enrichment"
      },
      "citation": {
        "document": "0711:document:bosch:bodbsp_7736606982:v1",
        "page": 4,
        "excerpt": "EER (A35/W18): 4,12",
        "confidence": 0.96
      }
    }
  }
}`,
};

// Syntax highlighting for JSON
function highlightJSON(code: string): string {
  return code
    .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="text-blue-400">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="text-orange-400">$1</span>');
}

export default function FileViewPage({ 
  params 
}: { 
  params: { id: string; path: string[] } 
}) {
  const [showRaw, setShowRaw] = useState(false);
  const file = EXAMPLE_FILE;
  const containerId = '0711:product:bosch:7736606982';
  
  const lines = file.content.split('\n');

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/containers" className="text-blue-400 hover:underline">
              containers
            </Link>
            <span className="text-gray-500">/</span>
            <Link href={`/containers/${containerId}`} className="text-blue-400 hover:underline">
              bosch
            </Link>
            <span className="text-gray-500">/</span>
            <Link href={`/containers/${containerId}`} className="text-blue-400 hover:underline">
              7736606982
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-blue-400">specs</span>
            <span className="text-gray-500">/</span>
            <span className="font-semibold">{file.name}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* File header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{file.lines} lines</span>
              <span>•</span>
              <span>{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowRaw(!showRaw)}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                showRaw 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'border-gray-600 hover:bg-gray-800'
              }`}
            >
              Raw
            </button>
            <button className="px-3 py-1.5 text-sm rounded-md border border-gray-600 hover:bg-gray-800">
              Blame
            </button>
            <button className="px-3 py-1.5 text-sm rounded-md border border-gray-600 hover:bg-gray-800">
              History
            </button>
            <button className="p-2 rounded-md border border-gray-600 hover:bg-gray-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="px-3 py-1.5 text-sm rounded-md bg-gray-800 border border-gray-600 hover:bg-gray-700">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button className="px-3 py-1.5 text-sm rounded-md bg-gray-800 border border-gray-600 hover:bg-gray-700">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        {/* Last commit info */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-t-lg border border-gray-700">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xs font-bold">
            B
          </div>
          <span className="font-medium text-sm">{file.lastCommit.author}</span>
          <span className="text-gray-400 text-sm flex-1">{file.lastCommit.message}</span>
          <Link href={`/commits/${file.lastCommit.hash}`} className="text-blue-400 text-sm hover:underline">
            {file.lastCommit.hash}
          </Link>
          <span className="text-gray-500 text-sm">
            {new Date(file.lastCommit.date).toLocaleDateString('de-DE')}
          </span>
        </div>

        {/* File content */}
        <div className="border border-t-0 border-gray-700 rounded-b-lg overflow-hidden">
          {/* Source info banner for AI-generated files */}
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-900/20 border-b border-gray-700">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-300">
              AI-generated content from <strong>bombas@0711.io</strong> • Layer: 002-ai-enrichment • Trust: medium
            </span>
            <Link href="#" className="text-sm text-blue-400 hover:underline ml-auto">
              View citations →
            </Link>
          </div>

          {/* Code view */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="hover:bg-gray-800/30">
                    <td className="px-4 py-0.5 text-right text-gray-500 select-none border-r border-gray-800 w-12">
                      {index + 1}
                    </td>
                    <td className="px-4 py-0.5 whitespace-pre">
                      {showRaw ? (
                        line
                      ) : (
                        <span dangerouslySetInnerHTML={{ __html: highlightJSON(line) }} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Citation details panel */}
        <div className="mt-6 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-sm">Citations in this file</span>
            <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-full">4 citations</span>
          </div>
          
          <div className="divide-y divide-gray-800">
            {[
              { field: 'cop_a7w35', value: '4.82 W/W', doc: 'bodbsp_7736606982.pdf', page: 3, excerpt: 'COP (A7/W35): 4,82', confidence: 0.98 },
              { field: 'cop_a2w35', value: '3.51 W/W', doc: 'bodbsp_7736606982.pdf', page: 3, excerpt: 'COP (A2/W35): 3,51', confidence: 0.97 },
              { field: 'capacity_a7w35', value: '17.1 kW', doc: 'bodbsp_7736606982.pdf', page: 2, excerpt: 'Nenn-Wärmeleistung: 17,1 kW', confidence: 0.99 },
              { field: 'eer_a35w18', value: '4.12 W/W', doc: 'bodbsp_7736606982.pdf', page: 4, excerpt: 'EER (A35/W18): 4,12', confidence: 0.96 },
            ].map((citation, i) => (
              <div key={i} className="flex items-start gap-4 px-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-purple-400 text-sm">{citation.field}</code>
                    <span className="text-gray-500">=</span>
                    <code className="text-blue-400 text-sm">{citation.value}</code>
                  </div>
                  <div className="text-sm text-gray-400">
                    <span className="text-gray-500">Source:</span> {citation.doc} (page {citation.page})
                  </div>
                  <div className="text-sm text-gray-500 italic mt-1">
                    "{citation.excerpt}"
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    citation.confidence >= 0.98 ? 'bg-green-900/50 text-green-400' :
                    citation.confidence >= 0.95 ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-orange-900/50 text-orange-400'
                  }`}>
                    {(citation.confidence * 100).toFixed(0)}%
                  </div>
                  <button className="p-1 text-gray-500 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
