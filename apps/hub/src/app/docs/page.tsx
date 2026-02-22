import Link from "next/link";

const docs = [
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    description: "Quick start guide for integrating GitChain",
  },
  {
    title: "Container Types",
    href: "/docs/container-types",
    description: "Product, campaign, project, memory, knowledge",
  },
  {
    title: "Inject API",
    href: "/docs/inject-api",
    description: "Core API for context injection",
  },
  {
    title: "Verification",
    href: "/docs/verification",
    description: "How blockchain verification works",
  },
  {
    title: "TypeScript SDK",
    href: "/docs/typescript-sdk",
    description: "npm install @0711/sdk",
  },
  {
    title: "Python SDK",
    href: "/docs/python-sdk",
    description: "pip install gitchain",
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Documentation</h1>

      <div className="grid gap-4">
        {docs.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="block bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-emerald-500 transition"
          >
            <h2 className="text-lg font-semibold mb-1">{doc.title}</h2>
            <p className="text-gray-400 text-sm">{doc.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gray-800/30 border border-gray-700 rounded-lg">
        <h2 className="font-semibold mb-4">Quick Reference</h2>
        <pre className="text-sm bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-emerald-400">{`# TypeScript
import { inject } from "@0711/inject";

const context = await inject({
  containers: ["0711:product:acme:widget-001:v1"],
});

# Python
from gitchain import inject

context = inject(
    containers=["0711:product:acme:widget-001:v1"]
)`}</code>
        </pre>
      </div>

      <div className="mt-8 p-6 bg-blue-900/20 border border-blue-700 rounded-lg">
        <h2 className="font-semibold mb-2">📘 Container ID Format</h2>
        <code className="text-blue-400">0711:{"{type}"}:{"{namespace}"}:{"{identifier}"}:{"{version}"}</code>
        <div className="mt-4 text-sm text-gray-400">
          <p><strong>Types:</strong> product, campaign, project, memory, knowledge</p>
          <p><strong>Example:</strong> <code className="text-emerald-400">0711:product:acme:widget-001:v2</code></p>
        </div>
      </div>
    </div>
  );
}
