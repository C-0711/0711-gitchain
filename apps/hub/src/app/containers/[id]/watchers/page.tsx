'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import UserCard from '@/components/UserCard';
import SocialActions from '@/components/SocialActions';

const t = {
  bg: "#ffffff",
  border: "#d0d7de",
  borderLight: "#eaeef2",
  fg: "#1f2328",
  fgMuted: "#656d76",
  link: "#0969da",
};

interface User {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  location?: string;
  company?: string;
  createdAt?: string;
  viewerIsFollowing: boolean;
  watchLevel?: string;
}

interface Container {
  id: string;
  identifier: string;
  name: string;
  visibility: string;
  starCount: number;
  watchCount: number;
  forkCount: number;
  viewerHasStarred: boolean;
  viewerWatchLevel?: string;
  owner: {
    id: string;
    username: string;
  };
}

export default function WatchersPage() {
  const params = useParams();
  const containerId = typeof params.id === 'string' ? decodeURIComponent(params.id) : '';

  const [container, setContainer] = useState<Container | null>(null);
  const [watchers, setWatchers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!containerId) return;
      setLoading(true);
      try {
        // Fetch container info
        const containerRes = await fetch(`/api/containers/${encodeURIComponent(containerId)}`);
        if (containerRes.ok) {
          const containerData = await containerRes.json();
          setContainer(containerData);
        }

        // Fetch watchers
        const watchersRes = await fetch(
          `/api/containers/${encodeURIComponent(containerId)}/watchers?page=${page}&limit=30`
        );
        if (watchersRes.ok) {
          const data = await watchersRes.json();
          setWatchers(data.watchers || []);
          setTotalCount(data.total || 0);
          setHasMore(data.hasMore || false);
        }
      } catch (e) {
        console.error('Failed to fetch watchers:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [containerId, page]);

  const formatCount = (n: number): string => {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return n.toString();
  };

  const watchLevelLabel = (level?: string) => {
    switch (level) {
      case 'all': return 'Watching all activity';
      case 'participating': return 'Watching participating';
      case 'mentions': return 'Watching mentions';
      default: return 'Watching';
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Container header */}
        {container && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 0',
            borderBottom: `1px solid ${t.borderLight}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}>
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Z"/>
              </svg>
              <Link
                href={`/users/${container.owner.username}`}
                style={{ color: t.link, textDecoration: 'none', fontSize: 16 }}
              >
                {container.owner.username}
              </Link>
              <span style={{ color: t.fgMuted }}>/</span>
              <Link
                href={`/containers/${encodeURIComponent(container.identifier)}`}
                style={{ color: t.link, textDecoration: 'none', fontSize: 16, fontWeight: 600 }}
              >
                {container.name || container.identifier}
              </Link>
              <span style={{
                fontSize: 11,
                padding: '0 6px',
                borderRadius: 12,
                border: `1px solid ${t.border}`,
                color: t.fgMuted,
              }}>
                {container.visibility}
              </span>
            </div>
            <SocialActions
              containerId={container.id}
              initialStarCount={container.starCount}
              initialWatchCount={container.watchCount}
              initialForkCount={container.forkCount}
              initialHasStarred={container.viewerHasStarred}
              initialWatchLevel={container.viewerWatchLevel || null}
              size="sm"
            />
          </div>
        )}

        {/* Page header */}
        <div style={{ padding: '24px 0' }}>
          <h1 style={{ fontSize: 24, fontWeight: 400, color: t.fg, margin: 0 }}>
            Watchers
          </h1>
          <p style={{ fontSize: 14, color: t.fgMuted, margin: '8px 0 0' }}>
            {formatCount(totalCount)} people are watching this container for notifications.
          </p>
        </div>

        {/* Watchers list */}
        <div style={{
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          backgroundColor: t.bg,
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: t.fgMuted }}>
              Loading watchers...
            </div>
          ) : watchers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 16 16" fill={t.fgMuted} style={{ marginBottom: 16 }}>
                <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14s-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2Z"/>
              </svg>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: '0 0 8px' }}>
                No watchers yet
              </h3>
              <p style={{ fontSize: 14, color: t.fgMuted, maxWidth: 400, margin: '0 auto' }}>
                Watch this container to receive notifications about activity.
              </p>
            </div>
          ) : (
            <>
              {watchers.map(user => (
                <div key={user.id} style={{ position: 'relative' }}>
                  <UserCard
                    id={user.id}
                    username={user.username}
                    name={user.name}
                    avatarUrl={user.avatarUrl}
                    location={user.location}
                    company={user.company}
                    joinedAt={user.createdAt}
                    isFollowing={user.viewerIsFollowing}
                    showFollowButton={true}
                  />
                  {user.watchLevel && (
                    <span style={{
                      position: 'absolute',
                      right: 100,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 11,
                      color: t.fgMuted,
                      backgroundColor: '#f6f8fa',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      {watchLevelLabel(user.watchLevel)}
                    </span>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {(page > 1 || hasMore) && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 16,
                  borderTop: `1px solid ${t.borderLight}`,
                }}>
                  {page > 1 && (
                    <button
                      onClick={() => setPage(p => p - 1)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 14,
                        color: t.link,
                        backgroundColor: 'transparent',
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Previous
                    </button>
                  )}
                  {hasMore && (
                    <button
                      onClick={() => setPage(p => p + 1)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 14,
                        color: t.link,
                        backgroundColor: 'transparent',
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ height: 48 }} />
      </div>
    </AppShell>
  );
}
