"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewContainerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "product",
    namespace: "",
    identifier: "",
    name: "",
    description: "",
    data: "{\n  \n}",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          namespace: form.namespace,
          identifier: form.identifier,
          data: JSON.parse(form.data),
          meta: {
            name: form.name,
            description: form.description,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create container");
      const result = await response.json();
      router.push("/containers/" + encodeURIComponent(result.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Create Container</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3"
            >
              <option value="product">Product</option>
              <option value="campaign">Campaign</option>
              <option value="project">Project</option>
              <option value="memory">Memory</option>
              <option value="knowledge">Knowledge</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Namespace</label>
            <input
              type="text"
              value={form.namespace}
              onChange={(e) => setForm({ ...form, namespace: e.target.value })}
              placeholder="e.g., acme"
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Identifier</label>
            <input
              type="text"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              placeholder="e.g., widget-001"
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Display name for this container"
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Description (optional)</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description"
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Data (JSON)</label>
          <textarea
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            rows={12}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 font-mono text-sm"
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-semibold"
          >
            {loading ? "Creating..." : "Create Container"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-sm text-gray-400">
          <strong>Preview ID:</strong>{" "}
          <code className="text-emerald-400">
            0711:{form.type}:{form.namespace || "namespace"}:{form.identifier || "id"}:v1
          </code>
        </p>
      </div>
    </div>
  );
}
