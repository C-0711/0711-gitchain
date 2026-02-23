"use client";

import { useState, useEffect } from "react";

const t = {
  fg: "#1f2328",
  fgMuted: "#656d76",
  border: "#d1d9e0",
  green: "#1a7f37",
  greenBg: "#dafbe1",
};

interface User {
  name: string;
  username: string;
  bio: string;
  company: string;
  location: string;
  website: string;
  avatar_url: string;
}

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(setUser)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    const token = localStorage.getItem("token");
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(user),
    });

    if (res.ok) {
      setMessage("Profile updated successfully!");
    } else {
      setMessage("Failed to update profile");
    }
    setSaving(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view settings</div>;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Public profile</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            Name
          </label>
          <input
            type="text"
            value={user.name || ""}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "8px 12px",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            Username
          </label>
          <input
            type="text"
            value={user.username || ""}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "8px 12px",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              fontSize: 14,
            }}
          />
          <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>
            Your username will appear in your container URLs
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            Bio
          </label>
          <textarea
            value={user.bio || ""}
            onChange={(e) => setUser({ ...user, bio: e.target.value })}
            rows={3}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "8px 12px",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              fontSize: 14,
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            Company
          </label>
          <input
            type="text"
            value={user.company || ""}
            onChange={(e) => setUser({ ...user, company: e.target.value })}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "8px 12px",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            Location
          </label>
          <input
            type="text"
            value={user.location || ""}
            onChange={(e) => setUser({ ...user, location: e.target.value })}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "8px 12px",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            Website
          </label>
          <input
            type="url"
            value={user.website || ""}
            onChange={(e) => setUser({ ...user, website: e.target.value })}
            placeholder="https://example.com"
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "8px 12px",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </div>

        {message && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: message.includes("success") ? t.greenBg : "#ffebe9",
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 14,
          }}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 20px",
            backgroundColor: t.green,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Update profile"}
        </button>
      </form>
    </div>
  );
}
