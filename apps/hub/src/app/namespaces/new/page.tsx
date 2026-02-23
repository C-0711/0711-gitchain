'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewNamespacePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidName = /^[a-z0-9-]+$/.test(name) && name.length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidName) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/namespaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, displayName, description, visibility }),
      });

      if (res.ok) {
        router.push(`/namespaces/${name}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create namespace');
      }
    } catch (e) {
      setError('Failed to create namespace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create a new namespace</h1>
          <p className="text-[#8b949e]">
            A namespace is where your containers live. It can represent an organization, a project, or yourself.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Namespace name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-namespace"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white placeholder-[#484f58] focus:border-emerald-500 focus:outline-none"
            />
            <p className="mt-2 text-sm text-[#8b949e]">
              gitchain.0711.io/<span className="text-white">{name || 'namespace'}</span>
            </p>
            {name && !isValidName && (
              <p className="mt-1 text-sm text-red-400">
                Use lowercase letters, numbers, and hyphens only. Minimum 2 characters.
              </p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My Namespace"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white placeholder-[#484f58] focus:border-emerald-500 focus:outline-none"
            />
            <p className="mt-2 text-sm text-[#8b949e]">
              A friendly name shown in the UI. Defaults to the namespace name.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this namespace about?"
              rows={3}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white placeholder-[#484f58] focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Visibility
            </label>
            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                visibility === 'public' 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : 'border-[#30363d] hover:border-[#484f58]'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">Public</span>
                    <span className="text-lg">🌐</span>
                  </div>
                  <p className="text-sm text-[#8b949e] mt-1">
                    Anyone can see containers in this namespace. Containers can still be individually private.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                visibility === 'private' 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : 'border-[#30363d] hover:border-[#484f58]'
              }`}>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">Private</span>
                    <span className="text-lg">🔒</span>
                  </div>
                  <p className="text-sm text-[#8b949e] mt-1">
                    Only members can access containers in this namespace.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/namespaces"
              className="px-4 py-2 text-[#8b949e] hover:text-white transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!isValidName || loading}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-lg font-medium transition"
            >
              {loading ? 'Creating...' : 'Create namespace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
