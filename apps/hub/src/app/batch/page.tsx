"use client";

import { useState } from "react";

interface BatchContainer {
  type: string;
  namespace: string;
  identifier: string;
  name: string;
  data: string;
}

interface BatchResult {
  id: string;
  version: number;
  status: "success" | "error";
  error?: string;
}

export default function BatchPage() {
  const [containers, setContainers] = useState<BatchContainer[]>([
    { type: "product", namespace: "", identifier: "", name: "", data: "{}" },
  ]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addContainer = () => {
    setContainers([
      ...containers,
      { type: "product", namespace: "", identifier: "", name: "", data: "{}" },
    ]);
  };

  const removeContainer = (index: number) => {
    setContainers(containers.filter((_, i) => i !== index));
  };

  const updateContainer = (index: number, field: keyof BatchContainer, value: string) => {
    const updated = [...containers];
    updated[index] = { ...updated[index], [field]: value };
    setContainers(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResults([]);

    try {
      const payload = containers.map((c) => ({
        type: c.type,
        namespace: c.namespace,
        identifier: c.identifier,
        data: JSON.parse(c.data),
        meta: { name: c.name },
      }));

      const response = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ containers: payload }),
      });

      const result = await response.json();

      if (result.success) {
        setResults(
          result.containers.map((c: any) => ({
            id: c.id,
            version: c.version,
            status: "success",
          }))
        );
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setResults([{ id: "", version: 0, status: "error", error: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Batch Upload</h1>

      <div className="space-y-6">
        {containers.map((container, index) => (
          <div
            key={index}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Container {index + 1}</h3>
              {containers.length > 1 && (
                <button
                  onClick={() => removeContainer(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <select
                value={container.type}
                onChange={(e) => updateContainer(index, "type", e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
              >
                <option value="product">Product</option>
                <option value="campaign">Campaign</option>
                <option value="project">Project</option>
                <option value="knowledge">Knowledge</option>
              </select>
              <input
                type="text"
                value={container.namespace}
                onChange={(e) => updateContainer(index, "namespace", e.target.value)}
                placeholder="Namespace"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
              <input
                type="text"
                value={container.identifier}
                onChange={(e) => updateContainer(index, "identifier", e.target.value)}
                placeholder="Identifier"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
              <input
                type="text"
                value={container.name}
                onChange={(e) => updateContainer(index, "name", e.target.value)}
                placeholder="Name"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
            </div>

            <textarea
              value={container.data}
              onChange={(e) => updateContainer(index, "data", e.target.value)}
              placeholder="JSON data"
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 font-mono text-sm"
            />
          </div>
        ))}

        <button
          onClick={addContainer}
          className="w-full py-3 border border-dashed border-gray-600 hover:border-gray-400 rounded-lg text-gray-400"
        >
          + Add Container
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-semibold text-lg"
        >
          {loading ? "Uploading..." : `Upload ${containers.length} Container(s)`}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  result.status === "success"
                    ? "bg-emerald-900/30 border border-emerald-700"
                    : "bg-red-900/30 border border-red-700"
                }`}
              >
                {result.status === "success" ? (
                  <code className="text-emerald-400">{result.id}</code>
                ) : (
                  <span className="text-red-400">{result.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
