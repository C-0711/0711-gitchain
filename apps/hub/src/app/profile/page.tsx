"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [user] = useState({
    name: "Demo User",
    email: "demo@example.com",
    username: "demo-user",
    avatar: null,
    bio: "Building with GitChain",
    company: "Acme Corp",
    location: "Stuttgart, Germany",
    website: "https://example.com",
    joinedAt: "February 2026",
    stats: {
      containers: 12,
      namespaces: 3,
      contributions: 47,
    },
  });

  const [activeTab, setActiveTab] = useState<"overview" | "containers" | "activity">("overview");

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="shrink-0">
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-5xl font-bold">
            {user.name.charAt(0)}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <span className="text-gray-400">@{user.username}</span>
          </div>
          {user.bio && <p className="text-gray-400 mb-4">{user.bio}</p>}
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            {user.company && (
              <span className="flex items-center gap-1">
                <span>🏢</span> {user.company}
              </span>
            )}
            {user.location && (
              <span className="flex items-center gap-1">
                <span>📍</span> {user.location}
              </span>
            )}
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-emerald-400 hover:underline">
                <span>🔗</span> {user.website.replace("https://", "")}
              </a>
            )}
            <span className="flex items-center gap-1">
              <span>📅</span> Joined {user.joinedAt}
            </span>
          </div>

          <div className="flex gap-6 mt-4">
            <Link href="/settings" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-500 text-sm">
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{user.stats.containers}</div>
          <div className="text-sm text-gray-400">Containers</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{user.stats.namespaces}</div>
          <div className="text-sm text-gray-400">Namespaces</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{user.stats.contributions}</div>
          <div className="text-sm text-gray-400">Contributions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex gap-6">
          {[
            { key: "overview", label: "Overview" },
            { key: "containers", label: "Containers" },
            { key: "activity", label: "Activity" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 px-1 text-sm border-b-2 transition ${
                activeTab === tab.key
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-semibold mb-4">Pinned Containers</h2>
            <div className="space-y-3">
              {["widget-001", "campaign-q1", "docs-v2"].map((id) => (
                <Link
                  key={id}
                  href={`/containers/0711:product:demo:${id}:v1`}
                  className="block bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-emerald-500 transition"
                >
                  <div className="font-medium">{id}</div>
                  <code className="text-xs text-gray-400">0711:product:demo:{id}:v1</code>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-4">Contribution Activity</h2>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${
                      Math.random() > 0.6 ? "bg-emerald-500" : Math.random() > 0.3 ? "bg-emerald-900" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">47 contributions in the last month</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "containers" && (
        <div className="space-y-4">
          {["widget-001", "campaign-q1", "docs-v2", "knowledge-base", "agent-memory"].map((id, i) => (
            <Link
              key={id}
              href={`/containers/0711:product:demo:${id}:v1`}
              className="block bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-emerald-500 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{id}</div>
                  <code className="text-xs text-gray-400">0711:product:demo:{id}:v1</code>
                </div>
                <span className="px-2 py-1 text-xs bg-emerald-900/30 text-emerald-400 rounded">
                  {["product", "campaign", "knowledge", "memory", "project"][i % 5]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-4">
          {[
            { action: "created", target: "widget-001", time: "2 hours ago" },
            { action: "updated", target: "campaign-q1", time: "5 hours ago" },
            { action: "verified", target: "docs-v2", time: "1 day ago" },
            { action: "created", target: "knowledge-base", time: "2 days ago" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-800">
              <span className="text-xl">
                {activity.action === "created" && "📦"}
                {activity.action === "updated" && "✏️"}
                {activity.action === "verified" && "✅"}
              </span>
              <div className="flex-1">
                <span className="capitalize">{activity.action}</span>
                <Link href="#" className="text-emerald-400 hover:underline ml-2">
                  {activity.target}
                </Link>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
