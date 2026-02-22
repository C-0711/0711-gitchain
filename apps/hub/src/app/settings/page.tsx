"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "api" | "notifications" | "appearance">("profile");
  const [apiKey] = useState("gc_live_xxxxxxxxxxxxxxxxxxxxxxxx");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "api", label: "API Keys", icon: "🔑" },
    { key: "notifications", label: "Notifications", icon: "🔔" },
    { key: "appearance", label: "Appearance", icon: "🎨" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition ${
                  activeTab === tab.key
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <Link
              href="/docs"
              className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition"
            >
              <span>📖</span>
              <span>Documentation</span>
            </Link>
            <a
              href="https://github.com/C-0711/0711-gitchain"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition"
            >
              <span>💻</span>
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                    <input
                      type="text"
                      defaultValue="Demo User"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="demo@example.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition">
                  Save Changes
                </button>
              </div>

              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Delete your account and all associated data.
                </p>
                <button className="px-4 py-2 border border-red-700 text-red-400 hover:bg-red-900/30 rounded-lg transition">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">API Keys</h2>
                <p className="text-sm text-gray-400 mb-6">
                  Use API keys to authenticate requests to the GitChain API.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Live API Key</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showKey ? "text" : "password"}
                          value={apiKey}
                          readOnly
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 font-mono text-sm"
                        />
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showKey ? "🙈" : "👁️"}
                        </button>
                      </div>
                      <button
                        onClick={copyApiKey}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                      >
                        {copied ? "✓" : "📋"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h3 className="font-medium">Keep your API key secure</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Never share your API key in public repositories or client-side code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
                  <input type="checkbox" defaultChecked className="mt-1" />
                  <div>
                    <div className="font-medium">Container updates</div>
                    <div className="text-sm text-gray-400">Get notified when containers you watch are updated</div>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
                  <input type="checkbox" defaultChecked className="mt-1" />
                  <div>
                    <div className="font-medium">Verification alerts</div>
                    <div className="text-sm text-gray-400">Receive alerts when verification fails</div>
                  </div>
                </label>
              </div>
              <button className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition">
                Save Preferences
              </button>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="flex flex-col items-center gap-2 p-4 border border-emerald-500 bg-emerald-500/10 rounded-lg cursor-pointer">
                      <span className="text-2xl">🌙</span>
                      <span>Dark</span>
                    </label>
                    <label className="flex flex-col items-center gap-2 p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
                      <span className="text-2xl">☀️</span>
                      <span>Light</span>
                    </label>
                    <label className="flex flex-col items-center gap-2 p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
                      <span className="text-2xl">💻</span>
                      <span>System</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
