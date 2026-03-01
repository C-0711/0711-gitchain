"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, Card, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface Commit {
  id: string;
  version: number;
  message: string;
  hash: string;
  parentHash: string | null;
  author: string;
  authorName: string;
  createdAt: string;
  isAnchored: boolean;
  txHash: string | null;
  blockNumber: number | null;
  network: string | null;
  layerInfo?: {
    type: string;
    trustLevel: string;
    atomCount: number;
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const trustColors: Record<string, string> = {
  highest: "#4ade80",
  high: "#60a5fa",
  certified: "#818cf8",
  verified: "#22d3ee",
  medium: "#facc15",
  customer: "#a78bfa",
  generated: "#fb923c",
  community: "#9ca3af",
};

// Icons
const Ic = {
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" />
    </svg>
  ),
  Commit: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Z" />
    </svg>
  ),
  Back: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
    </svg>
  ),
  Chain: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    </svg>
  ),
  Shield: ({ s = 12 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z" />
    </svg>
  ),
};

export default function HistoryPage() {
  const params = useParams();
  const id = params.id as string;
  const containerId = decodeURIComponent(id);

  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/containers/${encodeURIComponent(containerId)}/commits`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load commits (${r.status})`);
        return r.json();
      })
      .then((data) => {
        setCommits(data.commits || []);
        setSource(data.source || "");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [containerId]);

  const shortHash = (hash: string) => hash?.substring(0, 7) || "";

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
          <span style={{ color: t.fg, fontWeight: 600 }}>History</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: t.fgMuted }}>
              <Ic.Clock />
            </span>
            <PageHeader
              title="Commit History"
              description={`${loading ? "Loading" : commits.length} commit${commits.length !== 1 ? "s" : ""} in this container`}
            />
          </div>
          {source === "layers" && (
            <span
              style={{
                fontSize: 12,
                color: t.fgMuted,
                backgroundColor: t.canvas,
                border: `1px solid ${t.border}`,
                padding: "3px 10px",
                borderRadius: 12,
              }}
            >
              Generated from layers
            </span>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <div style={{ textAlign: "center", padding: 48, color: t.fgMuted, fontSize: 14 }}>
              Loading commit history...
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 14, color: "#cf222e", marginBottom: 12 }}>{error}</div>
              <Link
                href={`/containers/${encodeURIComponent(containerId)}`}
                style={{ fontSize: 14, color: t.link, textDecoration: "none" }}
              >
                Back to container
              </Link>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && commits.length === 0 && (
          <Card>
            <div style={{ textAlign: "center", padding: 48 }}>
              <div style={{ color: t.fgMuted, marginBottom: 12 }}>
                <Ic.Commit />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: "0 0 8px" }}>
                No commits yet
              </h3>
              <p style={{ fontSize: 14, color: t.fgMuted }}>
                This container has no commit history.
              </p>
            </div>
          </Card>
        )}

        {/* Timeline */}
        {!loading && !error && commits.length > 0 && (
          <div style={{ position: "relative" }}>
            {/* Vertical timeline line */}
            <div
              style={{
                position: "absolute",
                left: 19,
                top: 28,
                bottom: 28,
                width: 2,
                backgroundColor: t.border,
                zIndex: 0,
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {commits.map((commit, idx) => {
                const dotColor = commit.isAnchored
                  ? "#1a7f37"
                  : commit.layerInfo
                    ? trustColors[commit.layerInfo.trustLevel] || "#9ca3af"
                    : "#60a5fa";

                return (
                  <div
                    key={commit.id || commit.hash}
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "14px 0",
                      position: "relative",
                    }}
                  >
                    {/* Timeline dot */}
                    <div
                      style={{
                        width: 40,
                        display: "flex",
                        justifyContent: "center",
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          border: "2px solid #fff",
                          marginTop: 6,
                        }}
                      />
                    </div>

                    {/* Commit card */}
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: "#fff",
                        border: `1px solid ${t.border}`,
                        borderRadius: 8,
                        padding: "14px 18px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          {/* Message */}
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: t.fg,
                              marginBottom: 8,
                              lineHeight: 1.4,
                            }}
                          >
                            {commit.message}
                          </div>

                          {/* Author + date row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Author avatar */}
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #238636 0%, #0969da 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#fff",
                              }}
                            >
                              {(commit.authorName || commit.author || "?").charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, color: t.fgMuted }}>
                              <strong style={{ color: t.fg, fontWeight: 500 }}>
                                {commit.authorName || commit.author}
                              </strong>
                              {" committed "}
                              <span
                                title={formatDate(commit.createdAt)}
                                style={{ fontFamily: mono, fontSize: 12, color: "#8b949e" }}
                              >
                                {relativeTime(commit.createdAt)}
                              </span>
                            </span>
                          </div>

                          {/* Layer info */}
                          {commit.layerInfo && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginTop: 10,
                                fontSize: 12,
                              }}
                            >
                              <span
                                style={{
                                  padding: "1px 8px",
                                  backgroundColor: t.canvas,
                                  border: `1px solid ${t.border}`,
                                  borderRadius: 4,
                                  color: t.fgMuted,
                                }}
                              >
                                {commit.layerInfo.type}
                              </span>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    backgroundColor:
                                      trustColors[commit.layerInfo.trustLevel] || "#9ca3af",
                                    display: "inline-block",
                                  }}
                                />
                                <span style={{ color: t.fgMuted }}>
                                  {commit.layerInfo.trustLevel}
                                </span>
                              </span>
                              <span style={{ color: t.fgMuted }}>
                                {commit.layerInfo.atomCount} atoms
                              </span>
                            </div>
                          )}

                          {/* Parent hash */}
                          {commit.parentHash && (
                            <div style={{ marginTop: 6, fontSize: 12, color: "#8b949e" }}>
                              Parent:{" "}
                              <code style={{ fontFamily: mono, fontSize: 11 }}>
                                {shortHash(commit.parentHash)}
                              </code>
                            </div>
                          )}
                        </div>

                        {/* Right side: hash + anchored badge */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 6,
                            flexShrink: 0,
                          }}
                        >
                          {/* Hash badge */}
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: 12,
                              color: t.link,
                              backgroundColor: t.canvas,
                              border: `1px solid ${t.border}`,
                              padding: "2px 8px",
                              borderRadius: 4,
                              letterSpacing: "0.02em",
                              userSelect: "all",
                            }}
                            title={commit.hash}
                          >
                            {shortHash(commit.hash)}
                          </span>

                          {/* Anchored badge */}
                          {commit.isAnchored ? (
                            <a
                              href={
                                commit.txHash ? `https://basescan.org/tx/${commit.txHash}` : "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 8px",
                                fontSize: 11,
                                fontFamily: mono,
                                backgroundColor: "#dafbe1",
                                border: "1px solid #aceebb",
                                borderRadius: 4,
                                color: "#1a7f37",
                                textDecoration: "none",
                              }}
                            >
                              <Ic.Shield s={10} />
                              Block #{commit.blockNumber}
                            </a>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 8px",
                                fontSize: 11,
                                fontFamily: mono,
                                backgroundColor: t.canvas,
                                border: `1px solid ${t.border}`,
                                borderRadius: 4,
                                color: t.fgMuted,
                              }}
                            >
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Commit count footer */}
            <div
              style={{ textAlign: "center", padding: "20px 0 8px", fontSize: 13, color: t.fgMuted }}
            >
              Showing {commits.length} commit{commits.length !== 1 ? "s" : ""}
            </div>
          </div>
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
