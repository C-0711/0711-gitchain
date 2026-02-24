"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    website: "",
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("gitchain_token");
      if (!token) {
        router.push("/auth/login?redirect=/orgs/new");
        return;
      }

      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create organization");
      }

      router.push(`/orgs/${result.organization.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <div className="border-b border-[#30363d] bg-[#161b22]">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-white">Create a new organization</h1>
          <p className="text-[#8b949e] mt-1">
            Organizations let you collaborate with your team on containers.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-md text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Organization name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Organization"
              required
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-[#484f58] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              URL slug <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center">
              <span className="text-[#8b949e] mr-2">gitchain.0711.io/orgs/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="my-org"
                required
                pattern="^[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
                className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-[#484f58] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none"
              />
            </div>
            <p className="text-xs text-[#8b949e] mt-1">
              Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description <span className="text-[#8b949e]">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does your organization do?"
              rows={3}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-[#484f58] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none resize-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Website <span className="text-[#8b949e]">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-[#484f58] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none"
            />
          </div>

          <hr className="border-[#30363d]" />

          {/* Info */}
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
            <div className="flex gap-3">
              <span className="text-xl">🏢</span>
              <div className="text-sm text-[#8b949e]">
                <p className="mb-2">
                  <strong className="text-white">You&apos;ll be the owner</strong> of this organization with full admin access.
                </p>
                <p>
                  You can invite team members and manage permissions after creation.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-[#30363d]" />

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link href="/orgs" className="text-[#8b949e] hover:text-white transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!formData.name || !formData.slug || isSubmitting}
              className="px-6 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#238636]/50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
