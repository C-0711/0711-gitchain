"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, Card, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface User {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  location?: string;
  company?: string;
  createdAt?: string;
  watchLevel?: string;
}

// Icons
const Ic = {
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14s-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2Z" />
    </svg>
  ),
  Back: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
    </svg>
  ),
  Location: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192 0ZM8 14.5l3.536-3.536a5 5 0 1 0-7.072 0Zm0-8.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    </svg>
  ),
};

function watchLevelLabel(level?: string): string {
  switch (level) {
    case "all":
      return "All activity";
    case "participating":
      return "Participating";
    case "mentions":
      return "Mentions only";
    default:
      return "Watching";
  }
}

function WatcherGridCard({ user }: { user: User }) {
  const [hover, setHover] = useState(false);
  const initial = (user.name || user.username || "?").charAt(0).toUpperCase();

  return (
    <Link
      href={`/users/${user.username}`}
      style={{
        display: "block",
        backgroundColor: "#fff",
        border: `1px solid ${hover ? t.border : "#eaeef2"}`,
        borderRadius: 8,
        padding: 20,
        textDecoration: "none",
        transition: "all 0.15s",
        boxShadow: hover ? "0 3px 12px rgba(0,0,0,0.04)" : "none",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 10,
        }}
      >
        {/* Avatar (letter circle) */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0969da 0%, #8250df 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
            border: `2px solid ${t.border}`,
          }}
        >
          {initial}
        </div>

        {/* Name */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.fg }}>
            {user.name || user.username}
          </div>
          <div style={{ fontSize: 13, color: t.fgMuted, fontFamily: mono }}>@{user.username}</div>
        </div>

        {/* Watch level badge */}
        {user.watchLevel && (
          <span
            style={{
              fontSize: 11,
              color: t.fgMuted,
              backgroundColor: t.canvas,
              border: `1px solid ${t.border}`,
              padding: "2px 8px",
              borderRadius: 12,
            }}
          >
            {watchLevelLabel(user.watchLevel)}
          </span>
        )}

        {/* Location */}
        {user.location && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: t.fgMuted,
            }}
          >
            <Ic.Location />
            {user.location}
          </div>
        )}

        {/* Company */}
        {user.company && <div style={{ fontSize: 12, color: t.fgMuted }}>{user.company}</div>}
      </div>
    </Link>
  );
}

export default function WatchersPage() {
  const params = useParams();
  const id = params.id as string;
  const containerId = decodeURIComponent(id);

  const [watchers, setWatchers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`/api/containers/${encodeURIComponent(containerId)}/watchers?page=${page}&limit=30`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load watchers (${r.status})`);
        return r.json();
      })
      .then((data) => {
        setWatchers(data.watchers || []);
        setTotalCount(data.total || 0);
        setHasMore(data.hasMore || false);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [containerId, page]);

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        {/* Breadcrumb */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 14 }}
        >
          <Link
            href={`/containers/${encodeURIComponent(containerId)}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: t.link,
              textDecoration: "none",
            }}
          >
            <Ic.Back /> {containerId}
          </Link>
          <span style={{ color: t.fgMuted }}>/</span>
          <span style={{ color: t.fg, fontWeight: 600 }}>Watchers</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{ color: t.fgMuted }}>
            <Ic.Eye />
          </span>
          <PageHeader
            title="Watchers"
            description={
              loading
                ? "Loading watchers..."
                : `${totalCount} user${totalCount !== 1 ? "s" : ""} watching this container for notifications`
            }
          />
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <div style={{ textAlign: "center", padding: 48, color: t.fgMuted, fontSize: 14 }}>
              Loading watchers...
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 14, color: "#cf222e", marginBottom: 12 }}>{error}</div>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  setPage(1);
                }}
                style={{
                  padding: "6px 16px",
                  fontSize: 13,
                  backgroundColor: "#fff",
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  color: t.fg,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && watchers.length === 0 && (
          <Card>
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ color: t.fgMuted, marginBottom: 12 }}>
                <svg width="48" height="48" viewBox="0 0 16 16" fill={t.fgMuted}>
                  <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14s-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2Z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
                No watchers yet
              </h3>
              <p style={{ fontSize: 14, color: t.fgMuted }}>
                Watch this container to receive notifications about activity.
              </p>
            </div>
          </Card>
        )}

        {/* Watchers Grid */}
        {!loading && !error && watchers.length > 0 && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {watchers.map((user) => (
                <WatcherGridCard key={user.id} user={user} />
              ))}
            </div>

            {/* Pagination */}
            {(page > 1 || hasMore) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 32,
                }}
              >
                {page > 1 && (
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    style={{
                      padding: "6px 16px",
                      fontSize: 14,
                      color: t.link,
                      backgroundColor: "#fff",
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Previous
                  </button>
                )}
                <span
                  style={{
                    padding: "6px 12px",
                    fontSize: 14,
                    color: t.fgMuted,
                  }}
                >
                  Page {page}
                </span>
                {hasMore && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    style={{
                      padding: "6px 16px",
                      fontSize: 14,
                      color: t.link,
                      backgroundColor: "#fff",
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Next
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Back link */}
        {!loading && (
          <div style={{ marginTop: 24 }}>
            <Link
              href={`/containers/${encodeURIComponent(containerId)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                color: t.fgMuted,
                textDecoration: "none",
              }}
            >
              <Ic.Back /> Back to container
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
