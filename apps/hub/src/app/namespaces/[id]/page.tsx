"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function NamespaceDetailPage() {
  const params = useParams();
  const namespaceId = params.id as string;
  const [activeTab, setActiveTab] = useState<"containers" | "members" | "settings">("containers");

  // Demo data
  const namespace = {
    name: namespaceId || "demo-namespace",
    description: "Demo namespace for GitChain containers",
    owner: "Demo User",
    visibility: "public",
    containerCount: 12,
    memberCount: 3,
    createdAt: "Feb 15, 2026",
  };

  const containers = [
    { id: "widget-001", type: "product", version: "v2", updated: "2 hours ago" },
    { id: "campaign-q1", type: "campaign", version: "v1", updated: "1 day ago" },
    { id: "docs-main", type: "knowledge", version: "v3", updated: "3 days ago" },
    { id: "agent-memory", type: "memory", version: "v1", updated: "1 week ago" },
    { id: "project-alpha", type: "project", version: "v1", updated: "2 weeks ago" },
  ];

  const members = [
    { name: "Demo User", role: "Owner", avatar: "D" },
    { name: "Alice Smith", role: "Admin", avatar: "A" },
    { name: "Bob Jones", role: "Member", avatar: "B" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📁</span>
            <h1 className="text-2xl font-bold">{namespace.name}</h1>
            <span className="px-2 py-1 text-xs bg-gray-700 rounded capitalize">{namespace.visibility}</span>
          </div>
          <p className="text-gray-400">{namespace.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
            <span>👤 {namespace.owner}</span>
            <span>📦 {namespace.containerCount} containers</span>
            <span>👥 {namespace.memberCount} members</span>
            <span>📅 Created {namespace.createdAt}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition">
            ⚙️ Settings
          </button>
          <Link
            href={`/containers/new?namespace=${namespace.name}`}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition"
          >
            + New Container
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex gap-6">
          {[
            { key: "containers", label: "Containers", count: namespace.containerCount },
            { key: "members", label: "Members", count: namespace.memberCount },
            { key: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 px-1 text-sm border-b-2 transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 text-xs bg-gray-700 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Containers Tab */}
      {activeTab === "containers" && (
        <div className="space-y-4">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Filter containers..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
            />
            <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
              <option>All types</option>
              <option>Product</option>
              <option>Campaign</option>
              <option>Project</option>
              <option>Memory</option>
              <option>Knowledge</option>
            </select>
          </div>

          {containers.map((container) => (
            <Link
              key={container.id}
              href={`/containers/0711:${container.type}:${namespace.name}:${container.id}:${container.version}`}
              className="block bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-emerald-500 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{container.id}</span>
                    <span className="text-xs text-gray-400">{container.version}</span>
                  </div>
                  <code className="text-xs text-gray-400">
                    0711:{container.type}:{namespace.name}:{container.id}:{container.version}
                  </code>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    container.type === "product" ? "bg-emerald-900/30 text-emerald-400" :
                    container.type === "campaign" ? "bg-blue-900/30 text-blue-400" :
                    container.type === "project" ? "bg-purple-900/30 text-purple-400" :
                    container.type === "memory" ? "bg-orange-900/30 text-orange-400" :
                    "bg-yellow-900/30 text-yellow-400"
                  }`}>
                    {container.type}
                  </span>
                  <span className="text-sm text-gray-500">{container.updated}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Team Members</h2>
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition">
              + Invite Member
            </button>
          </div>

          {members.map((member) => (
            <div key={member.name} className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-lg font-bold">
                  {member.avatar}
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-400">{member.role}</p>
                </div>
              </div>
              {member.role !== "Owner" && (
                <button className="text-sm text-red-400 hover:text-red-300">Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Namespace Settings</h2>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={namespace.name}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  rows={3}
                  defaultValue={namespace.description}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Visibility</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <button className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition">
              Save Changes
            </button>
          </div>

          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h2>
            <p className="text-sm text-gray-400 mb-4">
              Deleting this namespace will also delete all containers within it. This cannot be undone.
            </p>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition">
              Delete Namespace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
