"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import AppShell, { Card, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface InviteData {
  email: string;
  role: string;
  organization: {
    slug: string;
    name: string;
    avatar_url: string | null;
  };
  invited_by: string | null;
  expires_at: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("token");

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invalid invite");
          return;
        }

        setInvite(data.invite);
      } catch {
        setError("Failed to load invite");
      } finally {
        setLoading(false);
      }
    }
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const authToken = localStorage.getItem("token");
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept invite");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/orgs/${data.organization.slug}`);
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
          <div style={{ color: t.fgMuted, fontSize: 14 }}>Loading invite...</div>
        </div>
      </AppShell>
    );
  }

  if (error && !invite) {
    return (
      <AppShell>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px" }}>
          <Card>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "rgba(248,81,73,0.1)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 16 16" fill="#f85149">
                  <path d="M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z" />
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
                Invite unavailable
              </h2>
              <p style={{ fontSize: 14, color: t.fgMuted, margin: "0 0 20px" }}>{error}</p>
              <Link
                href="/dashboard"
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  backgroundColor: t.accent,
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Go to Dashboard
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!invite) return null;

  const expiresIn = Math.max(
    0,
    Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))
  );

  return (
    <AppShell>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px" }}>
        <Card>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            {/* Org avatar */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                margin: "0 auto 16px",
                background: "linear-gradient(135deg, #238636, #0969da)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {invite.organization.name.charAt(0).toUpperCase()}
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: t.fg, margin: "0 0 4px" }}>
              You&apos;ve been invited to join
            </h2>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: t.fg, margin: "0 0 8px" }}>
              {invite.organization.name}
            </h1>

            {invite.invited_by && (
              <p style={{ fontSize: 14, color: t.fgMuted, margin: "0 0 4px" }}>
                Invited by <span style={{ color: t.fg, fontWeight: 500 }}>{invite.invited_by}</span>
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "16px 0" }}>
              <span
                style={{
                  padding: "2px 10px",
                  fontSize: 12,
                  fontFamily: mono,
                  lineHeight: "22px",
                  borderRadius: 12,
                  backgroundColor: "#fbefff",
                  color: "#8250df",
                  textTransform: "capitalize",
                }}
              >
                Role: {invite.role}
              </span>
              <span
                style={{
                  padding: "2px 10px",
                  fontSize: 12,
                  fontFamily: mono,
                  lineHeight: "22px",
                  borderRadius: 12,
                  backgroundColor: t.canvas,
                  border: `1px solid ${t.border}`,
                  color: t.fgMuted,
                }}
              >
                Expires in {expiresIn}h
              </span>
            </div>

            <p style={{ fontSize: 13, color: t.fgMuted, margin: "0 0 24px" }}>
              Invite sent to <span style={{ fontFamily: mono, color: t.fg }}>{invite.email}</span>
            </p>

            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  marginBottom: 16,
                  backgroundColor: "rgba(248,81,73,0.1)",
                  border: "1px solid #f85149",
                  borderRadius: 6,
                  color: "#f85149",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {success ? (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "rgba(35,134,54,0.1)",
                  border: "1px solid #238636",
                  borderRadius: 6,
                  color: "#3fb950",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Welcome to {invite.organization.name}! Redirecting...
              </div>
            ) : isLoggedIn ? (
              <button
                onClick={handleAccept}
                disabled={accepting}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: 15,
                  fontWeight: 600,
                  backgroundColor: accepting ? t.fgMuted : t.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: accepting ? "not-allowed" : "pointer",
                }}
              >
                {accepting ? "Accepting..." : "Accept Invitation"}
              </button>
            ) : (
              <div>
                <button
                  onClick={handleAccept}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    fontWeight: 600,
                    backgroundColor: t.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    marginBottom: 8,
                  }}
                >
                  Sign in to accept
                </button>
                <p style={{ fontSize: 13, color: t.fgMuted, margin: "8px 0 0" }}>
                  Don&apos;t have an account?{" "}
                  <Link
                    href={`/auth/register?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                    style={{ color: t.link, textDecoration: "none" }}
                  >
                    Create one
                  </Link>
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
