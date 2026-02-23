"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "api" | "security" | "notifications" | "appearance" | "billing">("profile");
  const [apiKeys] = useState([
    { id: 1, name: "Production", key: "gc_live_xxxxxxxxxxxxxxxxxxxxxxxx", created: "Feb 15, 2026", lastUsed: "2 hours ago" },
    { id: 2, name: "Development", key: "gc_test_yyyyyyyyyyyyyyyyyyyyyyyy", created: "Feb 20, 2026", lastUsed: "1 day ago" },
  ]);
  const [showKey, setShowKey] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "account", label: "Account", icon: "🔐" },
    { key: "api", label: "API Keys", icon: "🔑" },
    { key: "security", label: "Security", icon: "🛡️" },
    { key: "notifications", label: "Notifications", icon: "🔔" },
    { key: "appearance", label: "Appearance", icon: "🎨" },
    { key: "billing", label: "Billing", icon: "💳" },
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
            <Link
              href="/api-reference"
              className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition"
            >
              <span>📡</span>
              <span>API Reference</span>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
                
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-4xl font-bold">
                    D
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm mb-2 transition">
                      Change Avatar
                    </button>
                    <p className="text-sm text-gray-400">JPG, PNG, or GIF. Max 2MB.</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                    <input
                      type="text"
                      defaultValue="Demo User"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Username</label>
                    <input
                      type="text"
                      defaultValue="demo-user"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">Bio</label>
                    <textarea
                      rows={3}
                      defaultValue="Building with GitChain"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Company</label>
                    <input
                      type="text"
                      defaultValue="Acme Corp"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Location</label>
                    <input
                      type="text"
                      defaultValue="Stuttgart, Germany"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">Website</label>
                    <input
                      type="url"
                      defaultValue="https://example.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <button className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition">
                  Save Profile
                </button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Email Address</h2>
                <div className="flex gap-4">
                  <input
                    type="email"
                    defaultValue="demo@example.com"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                    Update Email
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-2">A verification email will be sent to your new address.</p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition">
                  Update Password
                </button>
              </div>

              <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-2 text-red-400">Delete Account</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === "api" && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">API Keys</h2>
                  <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition">
                    + New Key
                  </button>
                </div>
                
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">{apiKey.name}</h3>
                          <p className="text-sm text-gray-400">Created {apiKey.created} · Last used {apiKey.lastUsed}</p>
                        </div>
                        <button className="text-red-400 hover:text-red-300 text-sm">Revoke</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm font-mono">
                          {showKey === apiKey.id ? apiKey.key : "••••••••••••••••••••••••••••••"}
                        </code>
                        <button
                          onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                        >
                          {showKey === apiKey.id ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => copyApiKey(apiKey.key)}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Webhooks</h2>
                <p className="text-gray-400 mb-4">Receive HTTP notifications when containers are created, updated, or verified.</p>
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
                  + Add Webhook
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Two-Factor Authentication</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400">Add an extra layer of security to your account.</p>
                    <p className="text-sm text-yellow-500 mt-1">⚠️ 2FA is not enabled</p>
                  </div>
                  <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition">
                    Enable 2FA
                  </button>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
                <div className="space-y-4">
                  {[
                    { device: "Chrome on macOS", location: "Stuttgart, Germany", current: true },
                    { device: "Safari on iPhone", location: "Munich, Germany", current: false },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                      <div>
                        <p className="font-medium">{session.device}</p>
                        <p className="text-sm text-gray-400">{session.location}</p>
                      </div>
                      {session.current ? (
                        <span className="px-2 py-1 text-xs bg-emerald-900/30 text-emerald-400 rounded">Current</span>
                      ) : (
                        <button className="text-sm text-red-400 hover:text-red-300">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Login History</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">IP Address</th>
                      <th className="text-left py-2">Device</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { date: "Feb 22, 2026 11:30 PM", ip: "192.168.1.1", device: "Chrome/macOS", status: "Success" },
                      { date: "Feb 22, 2026 09:15 AM", ip: "192.168.1.1", device: "Safari/iOS", status: "Success" },
                      { date: "Feb 21, 2026 03:45 PM", ip: "10.0.0.1", device: "Unknown", status: "Failed" },
                    ].map((log, i) => (
                      <tr key={i} className="border-b border-gray-800">
                        <td className="py-3">{log.date}</td>
                        <td className="py-3 font-mono text-gray-400">{log.ip}</td>
                        <td className="py-3">{log.device}</td>
                        <td className="py-3">
                          <span className={log.status === "Success" ? "text-emerald-400" : "text-red-400"}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Email Notifications</h2>
                <div className="space-y-4">
                  {[
                    { label: "Container verified on blockchain", desc: "When your containers are anchored", enabled: true },
                    { label: "New API key usage", desc: "When an API key is used for the first time", enabled: true },
                    { label: "Weekly summary", desc: "Weekly digest of your container activity", enabled: false },
                    { label: "Marketing updates", desc: "Product news and feature announcements", enabled: false },
                  ].map((notif, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{notif.label}</p>
                        <p className="text-sm text-gray-400">{notif.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={notif.enabled} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Theme</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: "Dark", selected: true },
                    { name: "Light", selected: false },
                    { name: "System", selected: false },
                  ].map((theme) => (
                    <button
                      key={theme.name}
                      className={`p-4 rounded-lg border-2 transition ${
                        theme.selected
                          ? "border-emerald-500 bg-gray-800"
                          : "border-gray-700 hover:border-gray-500"
                      }`}
                    >
                      <div className={`w-full h-16 rounded mb-2 ${
                        theme.name === "Dark" ? "bg-gray-900" :
                        theme.name === "Light" ? "bg-white" :
                        "bg-gradient-to-r from-gray-900 to-white"
                      }`} />
                      <span className="text-sm">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Accent Color</h2>
                <div className="flex gap-3">
                  {["emerald", "blue", "purple", "orange", "pink"].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full transition ${
                        color === "emerald" ? "bg-emerald-500 ring-2 ring-white ring-offset-2 ring-offset-gray-900" :
                        color === "blue" ? "bg-blue-500" :
                        color === "purple" ? "bg-purple-500" :
                        color === "orange" ? "bg-orange-500" :
                        "bg-pink-500"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-lg font-semibold">Current Plan</h2>
                    <p className="text-gray-400">You are on the <span className="text-emerald-400 font-medium">Free</span> plan</p>
                  </div>
                  <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition">
                    Upgrade
                  </button>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-sm text-gray-400">Containers used</div>
                    <div className="text-xs text-gray-500 mt-1">of 25 included</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-2xl font-bold">847</div>
                    <div className="text-sm text-gray-400">API calls this month</div>
                    <div className="text-xs text-gray-500 mt-1">of 1,000 included</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-sm text-gray-400">Blockchain anchors</div>
                    <div className="text-xs text-gray-500 mt-1">of 10 included</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: "Free", price: "$0", features: ["25 containers", "1k API calls", "10 anchors/mo"] },
                    { name: "Pro", price: "$29", features: ["Unlimited containers", "50k API calls", "100 anchors/mo", "Priority support"] },
                    { name: "Enterprise", price: "Custom", features: ["Everything in Pro", "Unlimited anchors", "SLA", "Dedicated support"] },
                  ].map((plan) => (
                    <div key={plan.name} className={`border rounded-lg p-4 ${plan.name === "Pro" ? "border-emerald-500" : "border-gray-700"}`}>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <div className="text-2xl font-bold my-2">{plan.price}<span className="text-sm text-gray-400 font-normal">/mo</span></div>
                      <ul className="text-sm text-gray-400 space-y-1">
                        {plan.features.map((f) => (
                          <li key={f}>✓ {f}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Billing History</h2>
                <p className="text-gray-400">No invoices yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
