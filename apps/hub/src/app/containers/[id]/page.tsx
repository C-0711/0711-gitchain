'use client';

import { useState } from 'react';
import Link from 'next/link';

// Types
interface ContainerFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastCommit?: {
    message: string;
    author: string;
    date: string;
    hash: string;
  };
}

interface ContainerData {
  id: string;
  name: string;
  description: string;
  version: number;
  visibility: 'public' | 'private';
  defaultBranch: string;
  lastCommit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  stats: {
    commits: number;
    contributors: number;
    files: number;
    size: string;
  };
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  files: ContainerFile[];
  readme?: string;
}

// Mock data for CS7001iAW
const EXAMPLE_CONTAINER: ContainerData = {
  id: '0711:product:bosch:7736606982',
  name: 'CS7001iAW 17 OR-T',
  description: 'Compress 7001i AW - Luft/Wasser-Wärmepumpe Außeneinheit',
  version: 7,
  visibility: 'public',
  defaultBranch: 'main',
  lastCommit: {
    hash: 'eacb2b2',
    message: 'AI enrichment: Added 207 citations from datasheets',
    author: 'bombas@0711.io',
    date: '2026-02-23T10:30:00Z',
  },
  stats: {
    commits: 23,
    contributors: 3,
    files: 18,
    size: '2.4 MB',
  },
  owner: {
    id: 'bosch',
    name: 'Robert Bosch GmbH',
  },
  files: [
    { name: 'README.md', path: 'README.md', type: 'file', size: 2048, lastCommit: { message: 'Initial product description', author: 'bosch', date: '2026-01-15', hash: 'abc123' } },
    { name: 'manifest.json', path: 'manifest.json', type: 'file', size: 1024, lastCommit: { message: 'Updated version to 7', author: 'system', date: '2026-02-23', hash: 'eacb2b2' } },
    { name: 'core', path: 'core', type: 'directory' },
    { name: 'etim', path: 'etim', type: 'directory' },
    { name: 'specs', path: 'specs', type: 'directory' },
    { name: 'media', path: 'media', type: 'directory' },
    { name: 'citations', path: 'citations', type: 'directory' },
    { name: '.gitchain', path: '.gitchain', type: 'directory' },
  ],
  readme: `# CS7001iAW 17 OR-T

**Compress 7001i AW** - Luft/Wasser-Wärmepumpe Außeneinheit

## Übersicht

| Eigenschaft | Wert |
|-------------|------|
| SNR | 7736606982 |
| ETIM | EC012034 - Luft/Wasser-Wärmepumpe |
| Heizleistung | 17,1 kW (A7/W35) |
| COP | 4,82 (A7/W35) |

## Datenquellen

- **Bosch Original**: Stammdaten, Beschreibungen
- **ETIM International**: Klassifikation, 88 Features
- **AI Enrichment**: 207 Zitate aus Datenblättern

## Zuletzt aktualisiert

Version 7 • 23. Feb 2026 • 3 Contributors
`,
};

// File icon component
function FileIcon({ type, name }: { type: 'file' | 'directory'; name: string }) {
  if (type === 'directory') {
    return (
      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }
  
  // File icons based on extension
  const ext = name.split('.').pop()?.toLowerCase();
  
  if (ext === 'json') {
    return (
      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  
  if (ext === 'md') {
    return (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

// Tab component
function Tab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-orange-500 text-white'
          : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

export default function ContainerFilesPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'files' | 'commits' | 'contributors' | 'settings'>('files');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const container = EXAMPLE_CONTAINER;

  // Get files for current path
  const getCurrentFiles = (): ContainerFile[] => {
    if (currentPath.length === 0) {
      return container.files;
    }
    
    // Mock subdirectory contents
    const subdir = currentPath[currentPath.length - 1];
    
    const subdirs: Record<string, ContainerFile[]> = {
      'core': [
        { name: 'identity.json', path: 'core/identity.json', type: 'file', size: 512, lastCommit: { message: 'Initial identity', author: 'bosch', date: '2026-01-15', hash: 'abc123' } },
        { name: 'description.json', path: 'core/description.json', type: 'file', size: 1024, lastCommit: { message: 'Added EN description', author: 'bosch', date: '2026-01-20', hash: 'def456' } },
      ],
      'etim': [
        { name: 'classification.json', path: 'etim/classification.json', type: 'file', size: 256, lastCommit: { message: 'ETIM 9.0 classification', author: 'etim-international', date: '2026-01-18', hash: 'ghi789' } },
        { name: 'features', path: 'etim/features', type: 'directory' },
      ],
      'specs': [
        { name: 'performance.json', path: 'specs/performance.json', type: 'file', size: 2048, lastCommit: { message: 'AI enrichment: COP values', author: 'bombas@0711.io', date: '2026-02-23', hash: 'eacb2b2' } },
        { name: 'dimensions.json', path: 'specs/dimensions.json', type: 'file', size: 512, lastCommit: { message: 'AI enrichment: Dimensions', author: 'bombas@0711.io', date: '2026-02-23', hash: 'eacb2b2' } },
        { name: 'electrical.json', path: 'specs/electrical.json', type: 'file', size: 384, lastCommit: { message: 'AI enrichment: Electrical specs', author: 'bombas@0711.io', date: '2026-02-23', hash: 'eacb2b2' } },
      ],
      'media': [
        { name: 'product-main.jpg', path: 'media/product-main.jpg', type: 'file', size: 245000, lastCommit: { message: 'Product images', author: 'bosch', date: '2026-01-15', hash: 'abc123' } },
        { name: 'datasheet-de.pdf', path: 'media/datasheet-de.pdf', type: 'file', size: 1200000, lastCommit: { message: 'Added datasheet', author: 'bosch', date: '2026-01-15', hash: 'abc123' } },
      ],
      'citations': [
        { name: 'citations.jsonl', path: 'citations/citations.jsonl', type: 'file', size: 45000, lastCommit: { message: 'AI enrichment: 207 citations', author: 'bombas@0711.io', date: '2026-02-23', hash: 'eacb2b2' } },
      ],
      '.gitchain': [
        { name: 'config.yaml', path: '.gitchain/config.yaml', type: 'file', size: 256, lastCommit: { message: 'Container config', author: 'system', date: '2026-01-15', hash: 'abc123' } },
        { name: 'contributors.json', path: '.gitchain/contributors.json', type: 'file', size: 512, lastCommit: { message: 'Added bombas as contributor', author: 'bosch', date: '2026-02-10', hash: 'xyz789' } },
        { name: 'anchors.json', path: '.gitchain/anchors.json', type: 'file', size: 1024, lastCommit: { message: 'Blockchain anchor v7', author: 'system', date: '2026-02-23', hash: 'eacb2b2' } },
      ],
    };
    
    return subdirs[subdir] || [];
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return d.toLocaleDateString('de-DE');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/containers" className="text-blue-400 hover:underline">containers</Link>
            <span className="text-gray-500">/</span>
            <span className="text-blue-400 hover:underline cursor-pointer">{container.owner.name.toLowerCase().replace(/\s+/g, '-')}</span>
            <span className="text-gray-500">/</span>
            <span className="font-semibold">{container.id.split(':').pop()}</span>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full border border-gray-600 text-gray-400">
              {container.visibility}
            </span>
          </div>

          {/* Title and description */}
          <h1 className="text-xl font-semibold mb-1">{container.name}</h1>
          <p className="text-gray-400 text-sm">{container.description}</p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm border border-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Star
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm border border-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Fork
            </button>
            <div className="flex-1" />
            <button className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 rounded-md text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Clone
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <Tab active={activeTab === 'files'} onClick={() => setActiveTab('files')}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Files
              </span>
            </Tab>
            <Tab active={activeTab === 'commits'} onClick={() => setActiveTab('commits')}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {container.stats.commits} Commits
              </span>
            </Tab>
            <Tab active={activeTab === 'contributors'} onClick={() => setActiveTab('contributors')}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {container.stats.contributors} Contributors
              </span>
            </Tab>
            <Tab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </span>
            </Tab>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File browser */}
          <div className="lg:col-span-3">
            {/* Branch selector and last commit */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-md text-sm border border-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {container.defaultBranch}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {currentPath.length > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <button 
                      onClick={() => setCurrentPath([])}
                      className="text-blue-400 hover:underline"
                    >
                      {container.id.split(':').pop()}
                    </button>
                    {currentPath.map((segment, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="text-gray-500">/</span>
                        <button
                          onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}
                          className={i === currentPath.length - 1 ? 'font-semibold' : 'text-blue-400 hover:underline'}
                        >
                          {segment}
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm text-gray-400 hover:text-white">
                  Go to file
                </button>
                <button className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-md text-sm font-medium">
                  Add file
                </button>
              </div>
            </div>

            {/* Last commit info */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 rounded-t-lg border border-gray-700">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xs font-bold">
                {container.lastCommit.author.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-sm">{container.lastCommit.author}</span>
              <span className="text-gray-400 text-sm flex-1 truncate">{container.lastCommit.message}</span>
              <span className="text-gray-500 text-sm">{container.lastCommit.hash}</span>
              <span className="text-gray-500 text-sm">{formatDate(container.lastCommit.date)}</span>
            </div>

            {/* File list */}
            <div className="border border-t-0 border-gray-700 rounded-b-lg overflow-hidden">
              {getCurrentFiles().map((file, index) => (
                <div
                  key={file.path}
                  className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-800/50 cursor-pointer ${
                    index !== getCurrentFiles().length - 1 ? 'border-b border-gray-800' : ''
                  }`}
                  onClick={() => {
                    if (file.type === 'directory') {
                      setCurrentPath([...currentPath, file.name]);
                    }
                  }}
                >
                  <FileIcon type={file.type} name={file.name} />
                  <span className={`flex-1 text-sm ${file.type === 'directory' ? 'text-blue-400' : 'text-gray-200'}`}>
                    {file.name}
                  </span>
                  <span className="text-gray-500 text-sm truncate max-w-[200px]">
                    {file.lastCommit?.message}
                  </span>
                  <span className="text-gray-500 text-sm w-24 text-right">
                    {formatDate(file.lastCommit?.date || '')}
                  </span>
                </div>
              ))}
            </div>

            {/* README */}
            {currentPath.length === 0 && container.readme && (
              <div className="mt-6 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-sm">README.md</span>
                </div>
                <div className="p-6 prose prose-invert prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: container.readme.replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* About */}
            <div>
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-sm text-gray-400 mb-4">{container.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <code className="text-blue-400">{container.id}</code>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Version {container.version}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-green-400">Blockchain verified</span>
                </div>
              </div>
            </div>

            {/* Contributors */}
            <div>
              <h3 className="font-semibold mb-3">Contributors</h3>
              <div className="space-y-2">
                {['bosch', 'etim-international', 'bombas@0711.io'].map((contributor) => (
                  <div key={contributor} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold">
                      {contributor.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-300">{contributor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages/Types */}
            <div>
              <h3 className="font-semibold mb-3">Content Types</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="text-sm text-gray-300">JSON</span>
                  <span className="text-sm text-gray-500">68%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-sm text-gray-300">PDF</span>
                  <span className="text-sm text-gray-500">24%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm text-gray-300">Markdown</span>
                  <span className="text-sm text-gray-500">8%</span>
                </div>
              </div>
            </div>

            {/* Clone box */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="font-medium text-sm mb-2">Clone this container</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`gitchain clone ${container.id}`}
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm font-mono text-gray-300"
                />
                <button className="p-2 hover:bg-gray-700 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
