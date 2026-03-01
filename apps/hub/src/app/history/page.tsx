"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, theme as t } from "@/components/AppShell";

const mono = "'SFMono-Regular','Consolas','Liberation Mono','Menlo',monospace";

interface ActivityEntry {
  id: string;
  action: string;
  type: string;
  target?: string;
  target_url?: string;
  actor?: string;
  description?: string;
  timestamp: string;
  container_id?: string;
  container_name?: string;
}

// Action type to icon + color mapping
function getActionIcon(type: string): { icon: React.ReactNode; color: string } {
  switch (type) {
    case "create":
    case "container_created":
      return {
        color: "#1a7f37",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#1a7f37">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
          </svg>
        ),
      };
    case "verify":
    case "container_verified":
      return {
        color: "#1a7f37",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#1a7f37">
            <path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V7c0 1.566-.32 3.182-1.303 4.682-.983 1.498-2.585 2.813-5.032 3.855a1.697 1.697 0 0 1-1.33 0c-2.447-1.042-4.049-2.357-5.032-3.855C1.32 10.182 1 8.566 1 7V3.48a1.75 1.75 0 0 1 1.217-1.667Z" />
          </svg>
        ),
      };
    case "update":
    case "container_updated":
      return {
        color: "#0969da",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#0969da">
            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61ZM11.524 2a.25.25 0 0 0-.177.073L3.286 10.135a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.249.249 0 0 0 .108-.064l8.062-8.062a.25.25 0 0 0 0-.354l-1.086-1.086A.25.25 0 0 0 11.524 2Z" />
          </svg>
        ),
      };
    case "delete":
    case "container_deleted":
      return {
        color: "#cf222e",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#cf222e">
            <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
          </svg>
        ),
      };
    case "inject":
    case "context_injected":
      return {
        color: "#8250df",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#8250df">
            <path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.346 1.909 1.22 3.004l-7.34 7.142a1.249 1.249 0 0 1-2.33-.861l1.545-4.285H3.462c-1.57 0-2.346-1.909-1.22-3.004Z" />
          </svg>
        ),
      };
    case "star":
    case "container_starred":
      return {
        color: "#bf8700",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#bf8700">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
          </svg>
        ),
      };
    case "login":
    case "session_created":
      return {
        color: t.fgMuted,
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}>
            <path d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm6.56 4.5 1.97-1.97a.749.749 0 1 0-1.06-1.06L6.22 7.47a.749.749 0 0 0 0 1.06l3.25 3.25a.749.749 0 1 0 1.06-1.06L8.56 8.75h4.69a.75.75 0 0 0 0-1.5Z" />
          </svg>
        ),
      };
    case "token_created":
      return {
        color: "#bf8700",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#bf8700">
            <path d="M6.5 5.5a4 4 0 1 1 2.731 3.795.75.75 0 0 0-.768.18L7.44 10.5H6.25a.75.75 0 0 0-.75.75v1.19l-.06.06H4.25a.75.75 0 0 0-.75.75v1.19l-.06.06H1.75a.25.25 0 0 1-.25-.25v-1.69l5.024-5.024a.75.75 0 0 0 .18-.768A3.995 3.995 0 0 1 6.5 5.5ZM11 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
          </svg>
        ),
      };
    default:
      return {
        color: t.fgMuted,
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}>
            <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Z" />
          </svg>
        ),
      };
  }
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const ms = now.getTime() - date.getTime();
  const mins = Math.floor(ms / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;

  // Show date for older entries
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      setError("Please log in to view your activity history.");
      return;
    }

    fetch("/api/user/activity", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load activity");
        return r.json();
      })
      .then((data) => {
        setActivities(data.activities || data.activity || []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load activity");
      })
      .finally(() => setLoading(false));
  }, []);

  // Group activities by date
  const groupedActivities: { date: string; items: ActivityEntry[] }[] = [];
  activities.forEach((activity) => {
    const dateKey = new Date(activity.timestamp).toDateString();
    const existing = groupedActivities.find((g) => g.date === dateKey);
    if (existing) {
      existing.items.push(activity);
    } else {
      groupedActivities.push({ date: dateKey, items: [activity] });
    }
  });

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <PageHeader title="Activity" description="Your recent actions across the platform" />

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: t.fgMuted }}>
            Loading activity...
          </div>
        ) : error ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              backgroundColor: "#fff",
              border: `1px solid ${t.border}`,
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
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm.75 3.75v3.5a.75.75 0 0 1-1.5 0v-3.5a.75.75 0 0 1 1.5 0Zm-.75 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
            </svg>
            <p style={{ fontSize: 14, color: t.fgMuted, margin: 0 }}>
              {error}
              {error.includes("log in") && (
                <>
                  {" "}
                  <a href="/auth/login" style={{ color: t.link }}>
                    Sign in
                  </a>
                </>
              )}
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              backgroundColor: "#fff",
              border: `1px dashed ${t.border}`,
              borderRadius: 8,
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 16 16"
              fill={t.border}
              style={{ marginBottom: 16 }}
            >
              <path d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0ZM8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm.5 4.75a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 .37.65l2.5 1.5a.75.75 0 1 0 .76-1.3L8.5 7.94Z" />
            </svg>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: t.fg, marginBottom: 8 }}>
              No activity yet
            </h3>
            <p style={{ fontSize: 14, color: t.fgMuted, margin: "0 0 20px" }}>
              When you create, update, or interact with containers, your activity will show up here.
            </p>
            <Link
              href="/containers/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                backgroundColor: "#238636",
                color: "#fff",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create a container
            </Link>
          </div>
        ) : (
          <div>
            {groupedActivities.map((group) => (
              <div key={group.date} style={{ marginBottom: 32 }}>
                {/* Date header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: t.border,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: t.fg }}>
                    {formatDate(group.items[0].timestamp)}
                  </span>
                </div>

                {/* Timeline items */}
                <div
                  style={{
                    borderLeft: `2px solid ${t.border}`,
                    marginLeft: 4,
                    paddingLeft: 24,
                  }}
                >
                  {group.items.map((activity, i) => {
                    const { icon, color } = getActionIcon(activity.type);
                    return (
                      <div
                        key={activity.id || `${activity.timestamp}-${i}`}
                        style={{
                          position: "relative",
                          paddingBottom: i < group.items.length - 1 ? 16 : 0,
                        }}
                      >
                        {/* Timeline dot */}
                        <div
                          style={{
                            position: "absolute",
                            left: -31,
                            top: 4,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            backgroundColor: "#fff",
                            border: `2px solid ${t.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: color,
                            }}
                          />
                        </div>

                        {/* Activity card */}
                        <div
                          style={{
                            backgroundColor: "#fff",
                            border: `1px solid ${t.border}`,
                            borderRadius: 8,
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                          }}
                        >
                          <span style={{ marginTop: 2, flexShrink: 0 }}>{icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, color: t.fg, lineHeight: 1.5 }}>
                              {activity.actor && <strong>{activity.actor}</strong>}
                              {activity.actor && " "}
                              {activity.action || activity.description || activity.type}
                              {activity.container_name && (
                                <>
                                  {" "}
                                  {activity.container_id ? (
                                    <Link
                                      href={`/containers/${activity.container_id}`}
                                      style={{
                                        fontFamily: mono,
                                        color: t.link,
                                        textDecoration: "none",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {activity.container_name}
                                    </Link>
                                  ) : (
                                    <span style={{ fontFamily: mono, fontWeight: 500 }}>
                                      {activity.container_name}
                                    </span>
                                  )}
                                </>
                              )}
                              {activity.target && !activity.container_name && (
                                <>
                                  {" "}
                                  {activity.target_url ? (
                                    <Link
                                      href={activity.target_url}
                                      style={{
                                        fontFamily: mono,
                                        color: t.link,
                                        textDecoration: "none",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {activity.target}
                                    </Link>
                                  ) : (
                                    <span style={{ fontFamily: mono, fontWeight: 500 }}>
                                      {activity.target}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>
                              {formatTimestamp(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
