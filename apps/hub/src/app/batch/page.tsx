"use client";

import { useState } from "react";
import Link from "next/link";

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  containers: Array<{
    id: string;
    status: "success" | "error";
    error?: string;
  }>;
}

export default function BatchPage() {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [jsonInput, setJsonInput] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const handleParse = () => {
    try {
      const data = JSON.parse(jsonInput);
      const containers = Array.isArray(data) ? data : [data];
      setPreview(containers);
      setStep("preview");
      setError("");
    } catch (err) {
      setError("Invalid JSON format");
    }
  };

  const handleImport = async () => {
    setStep("importing");
    
    // Simulate import
    await new Promise(r => setTimeout(r, 2000));
    
    setResult({
      total: preview.length,
      success: preview.length,
      failed: 0,
      containers: preview.map((c, i) => ({
        id: `0711:${c.type || "product"}:${c.namespace || "demo"}:${c.identifier || `item-${i}`}:v1`,
        status: "success",
      })),
    });
    setStep("done");
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Batch Import</h1>
        <p className="text-gray-400">
          Import multiple containers at once from JSON
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-4 mb-8">
        {["upload", "preview", "importing", "done"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? "bg-emerald-500 text-white" :
              ["preview", "importing", "done"].indexOf(step) > i ? "bg-emerald-500/20 text-emerald-400" :
              "bg-gray-800 text-gray-500"
            }`}>
              {["preview", "importing", "done"].indexOf(step) > i ? "✓" : i + 1}
            </div>
            {i < 3 && <div className={`w-16 h-0.5 mx-2 ${
              ["preview", "importing", "done"].indexOf(step) > i ? "bg-emerald-500" : "bg-gray-700"
            }`} />}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="font-semibold mb-4">Paste JSON data</h2>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[
  {
    "type": "product",
    "namespace": "acme",
    "identifier": "widget-001",
    "name": "Smart Widget",
    "data": { ... }
  }
]`}
              rows={12}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 font-mono text-sm focus:border-emerald-500 focus:outline-none"
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="font-semibold mb-4">Or upload a file</h2>
            <label className="block border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setJsonInput(ev.target?.result as string);
                    reader.readAsText(file);
                  }
                }}
              />
              <div className="text-4xl mb-2">📄</div>
              <div className="text-gray-400">Drop a JSON file here or click to browse</div>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleParse}
              disabled={!jsonInput.trim()}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-semibold transition"
            >
              Parse & Preview
            </button>
            <Link
              href="/containers"
              className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg transition text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
              <span className="font-medium">{preview.length} containers to import</span>
              <button onClick={() => setStep("upload")} className="text-sm text-gray-400 hover:text-white">
                Edit
              </button>
            </div>
            <div className="max-h-96 overflow-auto">
              {preview.map((item, i) => (
                <div key={i} className="px-4 py-3 border-b border-gray-700 last:border-0 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.name || item.identifier || `Item ${i + 1}`}</div>
                    <code className="text-xs text-gray-400">
                      0711:{item.type || "product"}:{item.namespace || "demo"}:{item.identifier || `item-${i}`}:v1
                    </code>
                  </div>
                  <span className="px-2 py-1 text-xs bg-gray-700 rounded">{item.type || "product"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleImport}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition"
            >
              Import {preview.length} Containers
            </button>
            <button
              onClick={() => setStep("upload")}
              className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg transition"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold mb-2">Importing containers...</h2>
          <p className="text-gray-400">This may take a few moments</p>
        </div>
      )}

      {step === "done" && result && (
        <div className="space-y-6">
          <div className={`rounded-lg p-6 ${
            result.failed === 0 
              ? "bg-emerald-900/20 border border-emerald-700" 
              : "bg-yellow-900/20 border border-yellow-700"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{result.failed === 0 ? "✅" : "⚠️"}</span>
              <div>
                <h2 className="text-xl font-bold">Import Complete</h2>
                <p className="text-gray-400">
                  {result.success} of {result.total} containers imported successfully
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 font-medium">
              Results
            </div>
            <div className="max-h-64 overflow-auto">
              {result.containers.map((c, i) => (
                <div key={i} className="px-4 py-3 border-b border-gray-700 last:border-0 flex justify-between items-center">
                  <code className="text-sm">{c.id}</code>
                  <span className={`px-2 py-1 text-xs rounded ${
                    c.status === "success" ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/containers"
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition text-center"
            >
              View Containers
            </Link>
            <button
              onClick={() => {
                setStep("upload");
                setJsonInput("");
                setPreview([]);
                setResult(null);
              }}
              className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg transition"
            >
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
