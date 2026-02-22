"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewNamespacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "product",
    description: "",
    visibility: "public",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/namespaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to create namespace");
      router.push(`/containers?namespace=${form.name}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: "product", label: "Product", icon: "📦", desc: "Physical or digital products" },
    { value: "campaign", label: "Campaign", icon: "📢", desc: "Marketing campaigns and initiatives" },
    { value: "project", label: "Project", icon: "📋", desc: "Projects and documentation" },
    { value: "memory", label: "Memory", icon: "🧠", desc: "AI agent memories and context" },
    { value: "knowledge", label: "Knowledge", icon: "📚", desc: "Knowledge bases and guides" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create a new namespace</h1>
        <p className="text-gray-400">
          A namespace is like a GitHub organization — it groups related containers together.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Namespace name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            placeholder="my-namespace"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-emerald-500 focus:outline-none"
            required
            pattern="[a-z0-9-]+"
          />
          <p className="text-xs text-gray-500 mt-1">
            Lowercase letters, numbers, and hyphens only
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this namespace for?"
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Container type</label>
          <div className="grid gap-3">
            {typeOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition ${
                  form.type === opt.value
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={form.type === opt.value}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="sr-only"
                />
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-sm text-gray-400">{opt.desc}</div>
                </div>
                {form.type === opt.value && (
                  <span className="ml-auto text-emerald-400">✓</span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
          <label className="block text-sm font-medium mb-3">Visibility</label>
          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${
              form.visibility === "public" ? "border-emerald-500 bg-emerald-500/10" : "border-gray-700"
            }`}>
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={form.visibility === "public"}
                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                className="mt-1"
              />
              <div>
                <div className="font-medium">🌍 Public</div>
                <div className="text-sm text-gray-400">
                  Anyone can view and inject from containers in this namespace
                </div>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${
              form.visibility === "private" ? "border-emerald-500 bg-emerald-500/10" : "border-gray-700"
            }`}>
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={form.visibility === "private"}
                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                className="mt-1"
              />
              <div>
                <div className="font-medium">🔒 Private</div>
                <div className="text-sm text-gray-400">
                  Only you and collaborators can access containers
                </div>
              </div>
            </label>
          </div>
        </div>

        {form.name && (
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <p className="text-sm text-gray-400">
              Your containers will have IDs like:
            </p>
            <code className="text-emerald-400 text-sm">
              0711:{form.type}:{form.name}:your-identifier:v1
            </code>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || !form.name}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition"
          >
            {loading ? "Creating..." : "Create namespace"}
          </button>
          <Link
            href="/namespaces"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
