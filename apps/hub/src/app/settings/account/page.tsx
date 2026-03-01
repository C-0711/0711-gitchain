"use client";

import { useState, useEffect } from "react";

import { theme as t } from "@/components/AppShell";

interface User {
  email: string;
  username: string;
  name: string;
}

export default function AccountSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setUser(data);
          setUsername(data.username || "");
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage({ type: "error", text: "Username cannot be empty" });
      return;
    }
    if (username === user?.username) {
      setMessage({ type: "error", text: "Username is unchanged" });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, username } : prev));
        setMessage({ type: "success", text: "Username updated successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update username" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== user?.username) return;

    setDeleting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to delete account" });
        setDeleting(false);
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
      setDeleting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 40,
          color: t.fgMuted,
          backgroundColor: "#fff",
          border: `1px solid ${t.border}`,
          borderRadius: 8,
        }}
      >
        Please log in to view account settings.{" "}
        <a href="/auth/login" style={{ color: t.link }}>
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: t.fg }}>
        Account settings
      </h2>

      {/* Email (read-only) */}
      <div
        style={{
          padding: 20,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          marginBottom: 24,
          backgroundColor: "#fff",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: t.fg }}>
          Email address
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}>
            <path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 3.75v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Zm.72-.97 5.656 4.129a.25.25 0 0 0 .248 0L13.78 2.78l-.86-.86L8 5.648 3.14 1.92Z" />
          </svg>
          <span
            style={{
              fontSize: 14,
              color: t.fg,
              padding: "8px 12px",
              backgroundColor: "#f6f8fa",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              flex: 1,
              maxWidth: 400,
            }}
          >
            {user.email || "No email set"}
          </span>
          <span
            style={{
              fontSize: 12,
              color: t.fgMuted,
              padding: "4px 8px",
              backgroundColor: "#f6f8fa",
              border: `1px solid ${t.border}`,
              borderRadius: 12,
            }}
          >
            Read-only
          </span>
        </div>
        <p style={{ fontSize: 12, color: t.fgMuted, marginTop: 8, marginBottom: 0 }}>
          Your email is used for notifications and account recovery. Contact an administrator to
          change it.
        </p>
      </div>

      {/* Username change */}
      <div
        style={{
          padding: 20,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          marginBottom: 24,
          backgroundColor: "#fff",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: t.fg }}>
          Change username
        </h3>
        <form onSubmit={handleUsernameChange}>
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
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              Your username appears in your container URLs (e.g., /{username}/container-name)
            </p>
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
            disabled={saving || !username.trim() || username === user.username}
            style={{
              padding: "10px 20px",
              backgroundColor: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor:
                saving || !username.trim() || username === user.username
                  ? "not-allowed"
                  : "pointer",
              opacity: saving || !username.trim() || username === user.username ? 0.7 : 1,
            }}
          >
            {saving ? "Updating..." : "Update username"}
          </button>
        </form>
      </div>

      {/* Danger Zone - Delete Account */}
      <div
        style={{
          padding: 20,
          border: "1px solid #cf222e",
          borderRadius: 8,
          backgroundColor: "#fff",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#cf222e", marginBottom: 8 }}>
          Danger zone
        </h3>
        <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 16 }}>
          Deleting your account is permanent. All your containers, tokens, and data will be removed
          and cannot be recovered.
        </p>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "transparent",
              color: "#cf222e",
              border: "1px solid #cf222e",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Delete your account
          </button>
        ) : (
          <div
            style={{
              padding: 16,
              backgroundColor: "#ffebe9",
              borderRadius: 6,
              border: "1px solid #cf222e",
            }}
          >
            <p style={{ fontSize: 14, color: "#cf222e", fontWeight: 500, marginBottom: 12 }}>
              Are you absolutely sure?
            </p>
            <p style={{ fontSize: 13, color: t.fgMuted, marginBottom: 12 }}>
              Please type <strong style={{ color: t.fg }}>{user.username}</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "8px 12px",
                border: "1px solid #cf222e",
                borderRadius: 6,
                fontSize: 14,
                marginBottom: 12,
                color: t.fg,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteText !== user.username || deleting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: deleteText === user.username ? "#cf222e" : t.border,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: deleteText === user.username && !deleting ? "pointer" : "not-allowed",
                }}
              >
                {deleting ? "Deleting..." : "I understand, delete my account"}
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(false);
                  setDeleteText("");
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: "pointer",
                  color: t.fg,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
