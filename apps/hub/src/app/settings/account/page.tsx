"use client";

import { useState } from "react";

const t = {
  fg: "#1f2328",
  fgMuted: "#656d76",
  border: "#d1d9e0",
  green: "#1a7f37",
  greenBg: "#dafbe1",
  red: "#cf222e",
  redBg: "#ffebe9",
};

export default function AccountSettingsPage() {
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

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
    setSaving(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Account settings</h2>

      {/* Change Password */}
      <div style={{
        padding: 20,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Change password</h3>
        
        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Current password
            </label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "8px 12px",
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              New password
            </label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "8px 12px",
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Confirm new password
            </label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "8px 12px",
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          {message.text && (
            <div style={{
              padding: "12px 16px",
              backgroundColor: message.type === "success" ? t.greenBg : t.redBg,
              color: message.type === "success" ? t.green : t.red,
              borderRadius: 6,
              marginBottom: 16,
              fontSize: 14,
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !passwords.current || !passwords.new}
            style={{
              padding: "10px 20px",
              backgroundColor: t.green,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving || !passwords.current || !passwords.new ? 0.7 : 1,
            }}
          >
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div style={{
        padding: 20,
        border: `1px solid ${t.red}`,
        borderRadius: 8,
        backgroundColor: t.redBg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: t.red, marginBottom: 8 }}>
          Danger zone
        </h3>
        <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 16 }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          style={{
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: t.red,
            border: `1px solid ${t.red}`,
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
