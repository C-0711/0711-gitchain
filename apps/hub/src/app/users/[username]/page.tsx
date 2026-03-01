"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface UserProfile {
  id: string;
  username: string;
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  created_at?: string;
  createdAt?: string;
  container_count?: number;
  star_count?: number;
}

interface Container {
  id: string;
  uuid: string;
  identifier: string;
  name: string;
  type: string;
  namespace: string;
  description?: string;
  visibility: string;
  isVerified: boolean;
  stats?: { atoms?: number };
  starCount: number;
  updatedAt: string;
}

function LetterAvatar({ name, size = 128 }: { name: string; size?: number }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  // Generate a stable color from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["#238636", "#0969da", "#8250df", "#bf8700", "#cf222e", "#1a7f37", "#0550ae"];
  const color = colors[Math.abs(hash) % colors.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `3px solid ${t.border}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: size * 0.45,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1,
        }}
      >
        {letter}
      </span>
    </div>
  );
}

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function UserProfilePage() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";

  const [user, setUser] = useState<UserProfile | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      if (!username) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/users/${username}`);
        if (!res.ok) throw new Error("User not found");
        const data = await res.json();
        setUser(data);

        // Fetch user's public containers
        try {
          const containersRes = await fetch(`/api/users/${username}/containers`);
          if (containersRes.ok) {
            const containersData = await containersRes.json();
            setContainers(containersData.containers || []);
          }
        } catch {
          // Containers fetch failed, continue with empty
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load user");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [username]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>
            Loading profile...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !user) {
    return (
      <AppShell>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
          <div
            style={{
              textAlign: "center",
              padding: 60,
              backgroundColor: "#fff",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 16 16"
              fill={t.border}
              style={{ marginBottom: 16 }}
            >
              <path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
            </svg>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: t.fg, marginBottom: 8 }}>
              User not found
            </h2>
            <p style={{ fontSize: 14, color: t.fgMuted, marginBottom: 20 }}>
              {error || `The user "${username}" does not exist or may have been removed.`}
            </p>
            <Link
              href="/explore"
              style={{
                padding: "8px 16px",
                backgroundColor: "#238636",
                color: "#fff",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Explore containers
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const memberSince = user.created_at || user.createdAt;
  const containerCount = user.container_count ?? containers.length;
  const starCount = user.star_count ?? 0;

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Profile Header */}
        <div
          style={{
            display: "flex",
            gap: 32,
            marginBottom: 32,
          }}
        >
          {/* Left: Avatar + Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: 200,
              flexShrink: 0,
            }}
          >
            <LetterAvatar name={user.name || user.username} size={160} />
          </div>

          {/* Right: Details */}
          <div style={{ flex: 1 }}>
            {/* Name and username */}
            <div style={{ marginBottom: 12 }}>
              {user.name && (
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: t.fg,
                    margin: "0 0 2px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {user.name}
                </h1>
              )}
              <div style={{ fontSize: 20, color: t.fgMuted, fontWeight: 300 }}>{user.username}</div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p
                style={{
                  fontSize: 15,
                  color: t.fg,
                  margin: "0 0 16px",
                  lineHeight: 1.6,
                  maxWidth: 600,
                }}
              >
                {user.bio}
              </p>
            )}

            {/* Stats badges */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  backgroundColor: "#f6f8fa",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill={t.fgMuted}>
                  <path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0Z" />
                </svg>
                <strong style={{ color: t.fg }}>{containerCount}</strong>
                <span style={{ color: t.fgMuted }}>containers</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  backgroundColor: "#f6f8fa",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill={t.fgMuted}>
                  <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
                </svg>
                <strong style={{ color: t.fg }}>{starCount}</strong>
                <span style={{ color: t.fgMuted }}>stars</span>
              </div>
            </div>

            {/* Meta info */}
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: t.fgMuted }}
            >
              {memberSince && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill={t.fgMuted}>
                    <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0Zm0 3.5h-2a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25h-8.5Zm-2.25 4v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Z" />
                  </svg>
                  <span>
                    Member since{" "}
                    {new Date(memberSince).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {user.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill={t.fgMuted}>
                    <path d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192 0ZM8 14.5l3.536-3.536a5 5 0 1 0-7.072 0Zm0-8.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                  </svg>
                  <span>{user.location}</span>
                </div>
              )}
              {user.company && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill={t.fgMuted}>
                    <path d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16Z" />
                  </svg>
                  <span>{user.company}</span>
                </div>
              )}
              {user.website && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill={t.fgMuted}>
                    <path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Z" />
                  </svg>
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: t.link, textDecoration: "none" }}
                  >
                    {user.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Public Containers */}
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: t.fg,
              marginBottom: 16,
              letterSpacing: "-0.01em",
            }}
          >
            Public containers
          </h2>

          {containers.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: t.fgMuted,
                backgroundColor: "#fff",
                border: `1px dashed ${t.border}`,
                borderRadius: 8,
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 16 16"
                fill={t.border}
                style={{ marginBottom: 12 }}
              >
                <path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0Z" />
              </svg>
              <p style={{ fontSize: 14, margin: 0 }}>
                {user.username} doesn&apos;t have any public containers yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#fff",
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {containers.map((c, i) => (
                <Link
                  key={c.uuid || c.id}
                  href={`/containers/${c.uuid || c.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: i < containers.length - 1 ? `1px solid ${t.border}` : "none",
                    textDecoration: "none",
                    transition: "background 0.1s",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill={t.fgMuted}>
                        <path d="m8.628 1.248 6 3.428a.75.75 0 0 1 0 1.302l-6 3.428a1.25 1.25 0 0 1-1.256 0l-6-3.428a.75.75 0 0 1 0-1.302l6-3.428a1.25 1.25 0 0 1 1.256 0Z" />
                      </svg>
                      <span
                        style={{ fontFamily: mono, fontSize: 14, color: t.link, fontWeight: 600 }}
                      >
                        {c.namespace ? `${c.namespace}/` : ""}
                        {c.name || c.identifier}
                      </span>
                      {c.isVerified && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            padding: "0 6px",
                            fontSize: 11,
                            fontFamily: mono,
                            lineHeight: "18px",
                            borderRadius: 12,
                            backgroundColor: "#dafbe1",
                            border: "1px solid #aceebb",
                            color: "#1a7f37",
                          }}
                        >
                          verified
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          padding: "0 6px",
                          borderRadius: 12,
                          border: `1px solid ${t.border}`,
                          color: t.fgMuted,
                          lineHeight: "18px",
                        }}
                      >
                        {c.visibility || "public"}
                      </span>
                    </div>
                    {c.description && (
                      <p style={{ fontSize: 13, color: t.fgMuted, margin: 0, lineHeight: 1.5 }}>
                        {c.description}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      fontSize: 12,
                      color: t.fgMuted,
                      flexShrink: 0,
                      marginLeft: 16,
                    }}
                  >
                    {c.stats?.atoms !== undefined && (
                      <span style={{ fontFamily: mono }}>
                        {c.stats.atoms.toLocaleString()} atoms
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
                      </svg>
                      {c.starCount ?? 0}
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 11, color: "#8b949e" }}>
                      {timeAgo(c.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
