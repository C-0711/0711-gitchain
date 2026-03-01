"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ContainerType = "product" | "campaign" | "project" | "memory" | "knowledge";
type Visibility = "public" | "private" | "internal";

const containerTypes: { value: ContainerType; label: string; icon: string; description: string }[] =
  [
    {
      value: "product",
      label: "Product",
      icon: "📦",
      description: "Product data, specs, and documentation",
    },
    {
      value: "knowledge",
      label: "Knowledge",
      icon: "📚",
      description: "Documentation, guides, and references",
    },
    {
      value: "project",
      label: "Project",
      icon: "🎯",
      description: "Project context and briefings",
    },
    {
      value: "campaign",
      label: "Campaign",
      icon: "📢",
      description: "Marketing campaigns and assets",
    },
    {
      value: "memory",
      label: "Memory",
      icon: "🧠",
      description: "AI agent memory and preferences",
    },
  ];

const visibilityOptions: { value: Visibility; label: string; icon: string; description: string }[] =
  [
    {
      value: "public",
      label: "Public",
      icon: "🌐",
      description: "Anyone can see and inject this container",
    },
    {
      value: "private",
      label: "Private",
      icon: "🔒",
      description: "Only you and collaborators can access",
    },
    {
      value: "internal",
      label: "Internal",
      icon: "🏢",
      description: "Only organization members can access",
    },
  ];

export default function NewContainerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    namespace: "",
    type: "knowledge" as ContainerType,
    visibility: "private" as Visibility,
    description: "",
  });

  // Generate identifier from name
  const identifier = formData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login?redirect=/containers/new");
        return;
      }

      const response = await fetch("/api/containers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: formData.type,
          namespace: formData.namespace || "personal",
          identifier,
          description: formData.description,
          visibility: formData.visibility,
          data: {
            name: formData.name,
            description: formData.description,
            created: new Date().toISOString(),
          },
          meta: {
            readme: `# ${formData.name}\n\n${formData.description || "No description provided."}\n`,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create container");
      }

      // Redirect to the new container
      router.push(`/containers/${result.container.container_id}`);
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
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-white">Create a new container</h1>
          <p className="text-[#8b949e] mt-1">
            A container holds your knowledge, data, and context for AI agents.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-md text-red-400">
              {error}
            </div>
          )}

          {/* Name & Namespace */}
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Owner <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.namespace}
                  onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                  placeholder="your-namespace"
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-[#484f58] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none"
                />
              </div>
              <span className="text-[#8b949e] pb-2 text-xl">/</span>
              <div className="flex-[2]">
                <label className="block text-sm font-medium text-white mb-2">
                  Container name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="my-container"
                  required
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-[#484f58] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none"
                />
              </div>
            </div>
            {identifier && (
              <p className="text-sm text-[#8b949e]">
                Container ID:{" "}
                <code className="text-[#58a6ff]">
                  0711:{formData.type}:{formData.namespace || "personal"}:{identifier}:v1
                </code>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description <span className="text-[#8b949e]">(optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A short description of what this container holds..."
              rows={3}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-[#484f58] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none resize-none"
            />
          </div>

          {/* Divider */}
          <hr className="border-[#30363d]" />

          {/* Container Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-4">Container type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {containerTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.type === type.value
                      ? "border-[#238636] bg-[#238636]/10"
                      : "border-[#30363d] bg-[#161b22] hover:border-[#484f58]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{type.icon}</span>
                    <span className="font-medium text-white">{type.label}</span>
                  </div>
                  <p className="text-xs text-[#8b949e]">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-[#30363d]" />

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-white mb-4">Visibility</label>
            <div className="space-y-3">
              {visibilityOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.visibility === option.value
                      ? "border-[#238636] bg-[#238636]/10"
                      : "border-[#30363d] bg-[#161b22] hover:border-[#484f58]"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={formData.visibility === option.value}
                    onChange={() => setFormData({ ...formData, visibility: option.value })}
                    className="mt-1 accent-[#238636]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium text-white">{option.label}</span>
                    </div>
                    <p className="text-sm text-[#8b949e] mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div className="text-sm text-[#8b949e]">
                <p className="mb-2">
                  <strong className="text-white">Private containers</strong> are only visible to you
                  and people you explicitly invite.
                </p>
                <p>
                  You can change visibility and add collaborators anytime in container settings.
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-[#30363d]" />

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link href="/containers" className="text-[#8b949e] hover:text-white transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!formData.name || isSubmitting}
              className="px-6 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#238636]/50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create container"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
