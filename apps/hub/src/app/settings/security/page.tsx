"use client";

import { useState, useEffect } from "react";

import { theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface Session {
  id: string;
  browser: string;
  ip: string;
  last_active: string;
  is_current: boolean;
}

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsError, setSessionsError] = useState("");

  // Password form
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Revoke all
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else {
        // If the sessions endpoint doesn't exist, show a fallback
        setSessions([]);
        setSessionsError("Unable to load sessions");
      }
    } catch {
      setSessions([]);
      setSessionsError("Unable to load sessions");
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwords.new.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update password" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
    setSaving(false);
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to revoke all sessions? You will be logged out.")) return;

    setRevoking(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/user/sessions", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      } else {
        setRevoking(false);
      }
    } catch {
      setRevoking(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/user/sessions?id=${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch {
      // ignore
    }
  };

  function timeAgo(date: string) {
    const ms = Date.now() - new Date(date).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>Loading...</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: t.fg }}>Security</h2>

      {/* Change Password */}
      <div
        style={{
          padding: 20,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          marginBottom: 24,
          backgroundColor: "#fff",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: t.fg }}>
          Change password
        </h3>
        <p style={{ fontSize: 13, color: t.fgMuted, marginBottom: 16 }}>
          Ensure your account is using a long, random password to stay secure.
        </p>

        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 6,
                color: t.fg,
              }}
            >
              Current password
            </label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              autoComplete="current-password"
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "8px 12px",
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                fontSize: 14,
                color: t.fg,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 6,
                color: t.fg,
              }}
            >
              New password
            </label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              autoComplete="new-password"
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "8px 12px",
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                fontSize: 14,
                color: t.fg,
              }}
            />
            <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 4, marginBottom: 0 }}>
              Must be at least 8 characters
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 6,
                color: t.fg,
              }}
            >
              Confirm new password
            </label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              autoComplete="new-password"
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "8px 12px",
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                fontSize: 14,
                color: t.fg,
              }}
            />
          </div>

          {message.text && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: message.type === "success" ? "#dafbe1" : "#ffebe9",
                color: message.type === "success" ? "#1a7f37" : "#cf222e",
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
            style={{
              padding: "10px 20px",
              backgroundColor: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: saving || !passwords.current || !passwords.new ? "not-allowed" : "pointer",
              opacity: saving || !passwords.current || !passwords.new ? 0.7 : 1,
            }}
          >
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div
        style={{
          padding: 20,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: t.fg }}>
              Active sessions
            </h3>
            <p style={{ fontSize: 13, color: t.fgMuted, margin: 0 }}>
              These are the devices currently logged into your account.
            </p>
          </div>
          <button
            onClick={handleRevokeAll}
            disabled={revoking}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ffebe9",
              color: "#cf222e",
              border: "1px solid #cf222e",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: revoking ? "not-allowed" : "pointer",
              opacity: revoking ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {revoking ? "Revoking..." : "Revoke all sessions"}
          </button>
        </div>

        {sessionsError && sessions.length === 0 ? (
          /* Fallback when sessions API is unavailable */
          <div
            style={{
              padding: 16,
              backgroundColor: "#dafbe1",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="#1a7f37">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: t.fg }}>Current session</div>
              <div style={{ fontSize: 13, color: t.fgMuted }}>
                You are currently logged in on this device.
              </div>
            </div>
            <span
              style={{
                padding: "4px 8px",
                backgroundColor: "#1a7f37",
                color: "#fff",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              This device
            </span>
          </div>
        ) : sessions.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: t.fgMuted,
              fontSize: 14,
            }}
          >
            No active sessions found.
          </div>
        ) : (
          <div>
            {sessions.map((session, i) => (
              <div
                key={session.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  backgroundColor: session.is_current ? "#dafbe1" : "transparent",
                  borderRadius: 6,
                  borderBottom: i < sessions.length - 1 ? `1px solid ${t.border}` : "none",
                }}
              >
                {/* Device icon */}
                <svg width="20" height="20" viewBox="0 0 16 16" fill={t.fgMuted}>
                  <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v6.5A1.75 1.75 0 0 1 14.25 12H1.75A1.75 1.75 0 0 1 0 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-6.5a.25.25 0 0 0-.25-.25ZM3.5 14a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3.5 14Z" />
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: t.fg }}>
                    {session.browser || "Unknown browser"}
                    {session.is_current && (
                      <span
                        style={{
                          marginLeft: 8,
                          padding: "2px 6px",
                          backgroundColor: "#1a7f37",
                          color: "#fff",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        This device
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: t.fgMuted, marginTop: 2, fontFamily: mono }}>
                    {session.ip || "Unknown IP"} -- Last active: {timeAgo(session.last_active)}
                  </div>
                </div>
                {!session.is_current && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "transparent",
                      color: "#cf222e",
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
