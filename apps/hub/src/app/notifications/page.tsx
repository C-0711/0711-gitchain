"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import AppShell, { PageHeader, Card, theme as t } from "@/components/AppShell";

interface Notification {
  id: string;
  type: "star" | "verify" | "update" | "mention" | "invite" | "system";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

const typeIcons: Record<string, { color: string; path: string }> = {
  star: {
    color: "#e3b341",
    path: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z",
  },
  verify: {
    color: "#1a7f37",
    path: "M9.585.52a2.678 2.678 0 0 0-3.17 0l-.928.68a1.178 1.178 0 0 1-.518.215L3.83 1.59a2.678 2.678 0 0 0-2.24 2.24l-.175 1.14a1.178 1.178 0 0 1-.215.518l-.68.928a2.678 2.678 0 0 0 0 3.17l.68.928c.113.153.186.33.215.518l.175 1.138a2.678 2.678 0 0 0 2.24 2.24l1.138.175c.187.029.365.102.518.215l.928.68a2.678 2.678 0 0 0 3.17 0l.928-.68a1.17 1.17 0 0 1 .518-.215l1.138-.175a2.678 2.678 0 0 0 2.241-2.24l.175-1.138c.029-.187.102-.365.215-.518l.68-.928a2.678 2.678 0 0 0 0-3.17l-.68-.928a1.179 1.179 0 0 1-.215-.518L14.41 3.83a2.678 2.678 0 0 0-2.24-2.24l-1.138-.175a1.179 1.179 0 0 1-.518-.215ZM7.303 1.728l.928-.68a1.178 1.178 0 0 1 1.395 0l.928.68c.348.256.752.423 1.18.489l1.136.174a1.178 1.178 0 0 1 .987.987l.174 1.137c.066.427.233.831.49 1.18l.68.927c.305.415.305.98 0 1.394l-.68.928a2.678 2.678 0 0 0-.489 1.18l-.174 1.136a1.178 1.178 0 0 1-.987.987l-1.137.174a2.678 2.678 0 0 0-1.18.489l-.927.68a1.178 1.178 0 0 1-1.394 0l-.928-.68a2.678 2.678 0 0 0-1.18-.489l-1.136-.174a1.178 1.178 0 0 1-.987-.987l-.174-1.137a2.678 2.678 0 0 0-.489-1.18l-.68-.927a1.178 1.178 0 0 1 0-1.394l.68-.928c.256-.348.423-.752.489-1.18l.174-1.136a1.178 1.178 0 0 1 .987-.987l1.137-.174a2.678 2.678 0 0 0 1.18-.489ZM11.28 6.78a.75.75 0 0 0-1.06-1.06L7 8.94 5.78 7.72a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0Z",
  },
  update: {
    color: "#0969da",
    path: "M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z",
  },
  mention: {
    color: "#8250df",
    path: "M4.75 7.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0-3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 6a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z",
  },
  invite: {
    color: "#238636",
    path: "M7.9 8.548a.25.25 0 0 1-.2 0l-5.45-2.2A1.75 1.75 0 0 1 1 4.648V3.5A1.75 1.75 0 0 1 2.75 1.75h10.5A1.75 1.75 0 0 1 15 3.5v1.148a1.75 1.75 0 0 1-1.25 1.7Zm-5.15 1.2L7.7 11.95a.75.75 0 0 0 .6 0l4.95-2.2V12.5a1.75 1.75 0 0 1-1.75 1.75H3.5A1.75 1.75 0 0 1 1.75 12.5Z",
  },
  system: {
    color: t.fgMuted,
    path: "M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Z",
  },
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/user/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.data?.notifications || data.notifications || []);
        }
      } catch {
        // API may not exist yet - show empty state
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: 60, textAlign: "center", color: t.fgMuted }}>Loading...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <PageHeader
            title="Notifications"
            description={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          />
          <div style={{ display: "flex", gap: 8 }}>
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  fontWeight: filter === f ? 600 : 400,
                  backgroundColor: filter === f ? t.accent : "transparent",
                  color: filter === f ? "#fff" : t.fgMuted,
                  border: `1px solid ${filter === f ? t.accent : t.border}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 16 16"
                fill={t.border}
                style={{ marginBottom: 16 }}
              >
                <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z" />
              </svg>
              <div style={{ fontSize: 16, fontWeight: 500, color: t.fg, marginBottom: 8 }}>
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </div>
              <div style={{ fontSize: 14, color: t.fgMuted }}>
                You&apos;ll be notified when someone stars, verifies, or updates your containers.
              </div>
            </div>
          </Card>
        ) : (
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, overflow: "hidden" }}>
            {filtered.map((n, i) => {
              const icon = typeIcons[n.type] || typeIcons.system;
              return (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 16px",
                    backgroundColor: n.read ? "#fff" : "#f6f8fa",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${t.border}` : "none",
                    alignItems: "flex-start",
                  }}
                >
                  {!n.read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#0969da",
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill={icon.color}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  >
                    <path d={icon.path} />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: t.fg }}>
                      {n.link ? (
                        <Link href={n.link} style={{ color: t.fg, textDecoration: "none" }}>
                          <strong>{n.title}</strong> — {n.message}
                        </Link>
                      ) : (
                        <>
                          <strong>{n.title}</strong> — {n.message}
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
