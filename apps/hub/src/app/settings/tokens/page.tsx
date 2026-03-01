"use client";

import { useState, useEffect } from "react";

import AppShell, { PageHeader, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface Token {
  id: string;
  name: string;
  token_prefix: string;
  scopes: string[];
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export default function TokensSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newToken, setNewToken] = useState({ name: "", expiresInDays: 90 });
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const fetchTokens = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/tokens", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (_) {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchTokens();
  }, []);

  const createToken = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/user/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newToken),
    });

    const data = await res.json();
    if (data.token) {
      setCreatedToken(data.token);
      setShowNew(false);
      setNewToken({ name: "", expiresInDays: 90 });
      fetchTokens();
    }
  };

  const revokeToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this token?")) return;

    const token = localStorage.getItem("token");
    await fetch(`/api/user/tokens?id=${tokenId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTokens();
  };

  const copyToken = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
    }
  };

  if (!mounted || loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>Loading...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <PageHeader title="Personal access tokens" description="Tokens for API authentication" />
          <button
            onClick={() => setShowNew(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Generate new token
          </button>
        </div>

        {createdToken && (
          <div
            style={{
              padding: 16,
              backgroundColor: "#dafbe1",
              borderRadius: 8,
              marginBottom: 24,
              border: "1px solid #1a7f37",
            }}
          >
            <p style={{ fontWeight: 500, marginBottom: 8 }}>Your new token has been created!</p>
            <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 12 }}>
              Make sure to copy it now. You will not be able to see it again!
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <code
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  backgroundColor: "#fff",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: mono,
                }}
              >
                {createdToken}
              </code>
              <button
                onClick={copyToken}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#fff",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setCreatedToken(null)}
              style={{
                marginTop: 12,
                padding: "6px 12px",
                backgroundColor: "transparent",
                border: "none",
                color: t.fgMuted,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {showNew && (
          <div
            style={{
              padding: 20,
              backgroundColor: "#fff",
              borderRadius: 8,
              marginBottom: 24,
              border: `1px solid ${t.border}`,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New token</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Token name
              </label>
              <input
                type="text"
                value={newToken.name}
                onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                placeholder="e.g., CI/CD Pipeline"
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
                Expiration
              </label>
              <select
                value={newToken.expiresInDays}
                onChange={(e) =>
                  setNewToken({ ...newToken, expiresInDays: Number(e.target.value) })
                }
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
                <option value={0}>No expiration</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={createToken}
                disabled={!newToken.name}
                style={{
                  padding: "8px 16px",
                  backgroundColor: newToken.name ? "#238636" : t.border,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: newToken.name ? "pointer" : "not-allowed",
                }}
              >
                Generate token
              </button>
              <button
                onClick={() => setShowNew(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {tokens.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: t.fgMuted,
              border: `1px dashed ${t.border}`,
              borderRadius: 8,
              backgroundColor: "#fff",
            }}
          >
            <p style={{ margin: "0 0 8px" }}>No tokens yet</p>
            <p style={{ fontSize: 14, margin: 0 }}>
              Tokens allow you to authenticate with the GitChain API
            </p>
          </div>
        ) : (
          <div
            style={{ border: `1px solid ${t.border}`, borderRadius: 8, backgroundColor: "#fff" }}
          >
            {tokens.map((token, i) => (
              <div
                key={token.id}
                style={{
                  padding: 16,
                  borderBottom: i < tokens.length - 1 ? `1px solid ${t.border}` : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{token.name}</div>
                  <div style={{ fontSize: 13, color: t.fgMuted, fontFamily: mono }}>
                    {token.token_prefix}...
                  </div>
                  <div style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>
                    Created {new Date(token.created_at).toLocaleDateString()}
                    {token.expires_at &&
                      ` · Expires ${new Date(token.expires_at).toLocaleDateString()}`}
                    {token.last_used_at &&
                      ` · Last used ${new Date(token.last_used_at).toLocaleDateString()}`}
                  </div>
                </div>
                <button
                  onClick={() => revokeToken(token.id)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#ffebe9",
                    color: "#cf222e",
                    border: "1px solid #cf222e",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
