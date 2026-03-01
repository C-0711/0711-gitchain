"use client";

import { useState, useEffect } from "react";

import AppShell, { PageHeader, Card, SectionTitle, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  company?: string;
  location?: string;
  website?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", company: "", location: "", website: "" });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setForm({
        name: u.name || "",
        bio: u.bio || "",
        company: u.company || "",
        location: u.location || "",
        website: u.website || "",
      });
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.user || { ...user, ...form };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save profile");
      }
    } catch {
      // Fallback to localStorage if API unavailable
      if (user) {
        const updated = { ...user, ...form };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <AppShell>
        <div style={{ padding: 60, textAlign: "center", color: t.fgMuted }}>Loading...</div>
      </AppShell>
    );

  return (
    <AppShell>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="Profile" description="Manage your public profile information" />

        <div style={{ display: "flex", gap: 32 }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                backgroundColor: "#238636",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 600,
                color: "#fff",
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <button
              style={{
                marginTop: 12,
                padding: "6px 12px",
                fontSize: 13,
                backgroundColor: "#fff",
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Change avatar
            </button>
          </div>

          {/* Form */}
          <Card>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: t.fg,
                    marginBottom: 6,
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 14,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    backgroundColor: "#f6f8fa",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: t.fg,
                    marginBottom: 6,
                  }}
                >
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 14,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    backgroundColor: "#f6f8fa",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 500,
                      color: t.fg,
                      marginBottom: 6,
                    }}
                  >
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: 14,
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      backgroundColor: "#f6f8fa",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 500,
                      color: t.fg,
                      marginBottom: 6,
                    }}
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: 14,
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      backgroundColor: "#f6f8fa",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: t.fg,
                    marginBottom: 6,
                  }}
                >
                  Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 14,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    backgroundColor: "#f6f8fa",
                  }}
                />
              </div>

              <div style={{ paddingTop: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    backgroundColor: "#238636",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Update profile"}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Account info */}
        <div style={{ marginTop: 32 }}>
          <Card>
            <SectionTitle>Account</SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "150px 1fr",
                gap: "12px 24px",
                fontSize: 14,
              }}
            >
              <span style={{ color: t.fgMuted }}>Email</span>
              <span style={{ color: t.fg }}>{user?.email}</span>
              <span style={{ color: t.fgMuted }}>Username</span>
              <span style={{ fontFamily: mono, color: t.fg }}>@{user?.username}</span>
              <span style={{ color: t.fgMuted }}>User ID</span>
              <span style={{ fontFamily: mono, color: t.fgMuted, fontSize: 12 }}>{user?.id}</span>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
