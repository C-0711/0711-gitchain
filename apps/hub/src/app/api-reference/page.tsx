"use client";

import { useState } from "react";
import Link from "next/link";

export default function APIPage() {
  const [activeEndpoint, setActiveEndpoint] = useState("inject");

  const endpoints = [
    {
      id: "inject",
      method: "POST",
      path: "/api/inject",
      description: "Inject verified context from containers",
      request: `{
  "containers": ["0711:product:acme:widget-001:v1"],
  "verify": true,
  "format": "markdown"
}`,
      response: `{
  "success": true,
  "formatted": "# Product: Widget\\n...",
  "tokenCount": 1250,
  "verified": true
}`,
    },
    {
      id: "containers-list",
      method: "GET",
      path: "/api/containers",
      description: "List all containers",
      request: `// Query parameters
?type=product
&namespace=acme
&limit=20
&offset=0`,
      response: `{
  "containers": [...],
  "total": 100,
  "limit": 20,
  "offset": 0
}`,
    },
    {
      id: "containers-get",
      method: "GET",
      path: "/api/containers/:id",
      description: "Get a specific container",
      request: `// URL parameter
:id = 0711:product:acme:widget-001:v1`,
      response: `{
  "id": "0711:product:acme:widget-001:v1",
  "type": "product",
  "namespace": "acme",
  "data": {...},
  "meta": {...}
}`,
    },
    {
      id: "containers-create",
      method: "POST",
      path: "/api/containers",
      description: "Create a new container",
      request: `{
  "type": "product",
  "namespace": "acme",
  "identifier": "widget-002",
  "data": { "name": "Widget 2" },
  "meta": { "description": "..." }
}`,
      response: `{
  "id": "0711:product:acme:widget-002:v1",
  "created": true
}`,
    },
    {
      id: "verify",
      method: "GET",
      path: "/api/verify/:id",
      description: "Verify container on blockchain",
      request: `// URL parameter
:id = 0711:product:acme:widget-001:v1`,
      response: `{
  "verified": true,
  "chain": {
    "network": "base-mainnet",
    "txHash": "0x...",
    "blockNumber": 18234567
  },
  "merkle": {
    "root": "0x...",
    "proof": [...]
  }
}`,
    },
    {
      id: "namespaces",
      method: "GET",
      path: "/api/namespaces",
      description: "List all namespaces",
      request: `// No parameters required`,
      response: `{
  "namespaces": [
    { "name": "acme", "type": "product", "containerCount": 50 }
  ]
}`,
    },
    {
      id: "search",
      method: "GET",
      path: "/api/search",
      description: "Search containers",
      request: `// Query parameters
?q=widget
&type=product
&limit=10`,
      response: `{
  "results": [...],
  "total": 25,
  "query": "widget"
}`,
    },
  ];

  const active = endpoints.find((e) => e.id === activeEndpoint);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">API Reference</h1>
        <p className="text-gray-600">
          Complete reference for the GitChain REST API. Base URL: <code className="text-emerald-600">https://api-gitchain.0711.io</code>
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Endpoints</h2>
          <nav className="space-y-1">
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setActiveEndpoint(ep.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition ${
                  activeEndpoint === ep.id
                    ? "bg-gray-50 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                }`}
              >
                <span className={`px-1.5 py-0.5 text-xs rounded font-mono ${
                  ep.method === "GET" ? "bg-blue-100 text-blue-400" : "bg-emerald-100 text-emerald-600"
                }`}>
                  {ep.method}
                </span>
                <span className="truncate">{ep.path}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-300">
            <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">SDKs</h2>
            <div className="space-y-2">
              <Link href="/docs/typescript-sdk" className="block text-sm text-gray-600 hover:text-gray-900">
                TypeScript SDK
              </Link>
              <Link href="/docs/python-sdk" className="block text-sm text-gray-600 hover:text-gray-900">
                Python SDK
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {active && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-2 py-1 text-sm rounded font-mono ${
                  active.method === "GET" ? "bg-blue-100 text-blue-400" : "bg-emerald-100 text-emerald-600"
                }`}>
                  {active.method}
                </span>
                <code className="text-lg">{active.path}</code>
              </div>
              <p className="text-gray-600 mb-6">{active.description}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Request</h3>
                  <div className="bg-white rounded-lg p-4">
                    <pre className="text-sm"><code className="text-emerald-600">{active.request}</code></pre>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Response</h3>
                  <div className="bg-white rounded-lg p-4">
                    <pre className="text-sm"><code className="text-emerald-600">{active.response}</code></pre>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold mb-2">Try it</h3>
                <div className="bg-white rounded-lg p-4">
                  <pre className="text-sm"><code className="text-gray-600">{`curl -X ${active.method} \\
  https://api-gitchain.0711.io${active.path.replace(":id", "0711:product:acme:widget-001:v1")} \\
  -H "Authorization: Bearer gc_live_your_api_key" \\
  -H "Content-Type: application/json"${active.method === "POST" ? ` \\
  -d '${active.request.replace(/\n/g, "").replace(/\s+/g, " ")}'` : ""}`}</code></pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Section */}
      <div className="mt-12 p-6 bg-gray-50/50 border border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        <p className="text-gray-600 mb-4">
          All API requests require authentication via API key. Include your key in the Authorization header:
        </p>
        <div className="bg-white rounded-lg p-4">
          <code className="text-emerald-600">Authorization: Bearer gc_live_your_api_key</code>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Get your API key from <Link href="/settings" className="text-emerald-600 hover:underline">Settings → API Keys</Link>
        </p>
      </div>

      {/* Rate Limits */}
      <div className="mt-8 p-6 bg-gray-50/50 border border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Rate Limits</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-emerald-600">1000</div>
            <div className="text-sm text-gray-600">requests/hour (free)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">10,000</div>
            <div className="text-sm text-gray-600">requests/hour (pro)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">Unlimited</div>
            <div className="text-sm text-gray-600">enterprise</div>
          </div>
        </div>
      </div>
    </div>
  );
}
