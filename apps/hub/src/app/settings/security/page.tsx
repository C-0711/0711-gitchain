"use client";

import { useState, useEffect } from "react";

const t = {
  fg: "#1f2328",
  fgMuted: "#656d76",
  border: "#d1d9e0",
  green: "#1a7f37",
  greenBg: "#dafbe1",
};

export default function SecuritySettingsPage() {
  const [user, setUser] = useState<{ email: string; created_at: string; last_login_at: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Security settings</h2>

      {/* Two-Factor Authentication */}
      <div style={{
        padding: 20,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Two-factor authentication
            </h3>
            <p style={{ fontSize: 14, color: t.fgMuted, margin: 0 }}>
              Add an extra layer of security to your account
            </p>
          </div>
          <span style={{
            padding: "4px 8px",
            backgroundColor: "#f6f8fa",
            border: `1px solid ${t.border}`,
            borderRadius: 12,
            fontSize: 12,
            color: t.fgMuted,
          }}>
            Coming soon
          </span>
        </div>
      </div>

      {/* Active Sessions */}
      <div style={{
        padding: 20,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Active sessions</h3>
        
        <div style={{
          padding: 16,
          backgroundColor: t.greenBg,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>💻</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>Current session</div>
            <div style={{ fontSize: 13, color: t.fgMuted }}>
              {user?.last_login_at ? `Last activity: ${new Date(user.last_login_at).toLocaleString()}` : "Active now"}
            </div>
          </div>
          <span style={{
            padding: "4px 8px",
            backgroundColor: t.green,
            color: "#fff",
            borderRadius: 12,
            fontSize: 12,
          }}>
            This device
          </span>
        </div>
      </div>

      {/* Account Activity */}
      <div style={{
        padding: 20,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Account activity</h3>
        
        <div style={{ fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
            <span style={{ color: t.fgMuted }}>Account created</span>
            <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ color: t.fgMuted }}>Last login</span>
            <span>{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
