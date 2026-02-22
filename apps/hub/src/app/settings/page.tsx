"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("gc_live_xxxx...xxxx");
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      {/* API Keys Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">API Keys</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Production API Key
            </label>
            <div className="flex gap-4">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                readOnly
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 font-mono text-sm"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-4 py-2 border border-gray-700 rounded hover:border-gray-500"
              >
                {showKey ? "Hide" : "Show"}
              </button>
              <button className="px-4 py-2 border border-gray-700 rounded hover:border-gray-500">
                Copy
              </button>
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
            Generate New Key
          </button>
        </div>
      </div>

      {/* Webhook Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Webhooks</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://your-server.com/webhook"
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Events</label>
            <div className="space-y-2">
              {["container.created", "container.updated", "batch.registered"].map(
                (event) => (
                  <label key={event} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="font-mono text-sm">{event}</span>
                  </label>
                )
              )}
            </div>
          </div>
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded">
            Save Webhook
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name</label>
              <input
                type="text"
                defaultValue="0711 Intelligence"
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                defaultValue="dev@0711.io"
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2"
              />
            </div>
          </div>
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded">
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
