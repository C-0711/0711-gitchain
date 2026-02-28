'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import ContributionGraph from '@/components/ContributionGraph';
import { FollowButton } from '@/components/UserCard';

const t = {
  bg: "#ffffff",
  border: "#d0d7de",
  borderLight: "#eaeef2",
  fg: "#1f2328",
  fgMuted: "#656d76",
  link: "#0969da",
  green: "#1a7f37",
};

interface UserProfile {
  id: string;
  username: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  followerCount: number;
  followingCount: number;
  createdAt: string;
  viewerIsFollowing: boolean;
  isViewer: boolean;
}

interface Container {
  id: string;
  identifier: string;
  name: string;
  description?: string;
  visibility: string;
  starCount: number;
  forkCount: number;
  updatedAt: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = typeof params.username === 'string' ? params.username : '';

  const [user, setUser] = useState<UserProfile | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'containers' | 'stars'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      if (!username) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${username}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        setUser(data);

        // Fetch user's containers
        const containersRes = await fetch(`/api/users/${username}/containers`);
        if (containersRes.ok) {
          const containersData = await containersRes.json();
          setContainers(containersData.containers || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [username]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: 48, textAlign: 'center', color: t.fgMuted }}>
          Loading profile...
        </div>
      </AppShell>
    );
  }

  if (error || !user) {
    return (
      <AppShell>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, color: t.fg, marginBottom: 8 }}>User not found</h1>
          <p style={{ color: t.fgMuted }}>{error || 'The user you are looking for does not exist.'}</p>
        </div>
      </AppShell>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'containers', label: 'Containers', count: containers.length },
    { id: 'stars', label: 'Stars' },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Profile header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '256px 1fr',
          gap: 24,
          paddingTop: 24,
        }}>
          {/* Left sidebar - Profile info */}
          <div>
            {/* Avatar */}
            <div style={{ marginBottom: 16 }}>
              <img
                src={user.avatarUrl || `https://avatars.githubusercontent.com/u/${user.id}?v=4`}
                alt={user.username}
                width={256}
                height={256}
                style={{
                  borderRadius: '50%',
                  border: `1px solid ${t.border}`,
                }}
              />
            </div>

            {/* Name & username */}
            <div style={{ marginBottom: 16 }}>
              {user.name && (
                <h1 style={{ fontSize: 24, fontWeight: 600, color: t.fg, margin: 0 }}>
                  {user.name}
                </h1>
              )}
              <div style={{ fontSize: 20, color: t.fgMuted, fontWeight: 300 }}>
                {user.username}
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p style={{ fontSize: 14, color: t.fg, marginBottom: 16, lineHeight: 1.5 }}>
                {user.bio}
              </p>
            )}

            {/* Follow button */}
            {!user.isViewer && (
              <div style={{ marginBottom: 16 }}>
                <FollowButton
                  userId={user.id}
                  initialIsFollowing={user.viewerIsFollowing}
                />
              </div>
            )}

            {/* Followers/Following */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              color: t.fgMuted,
              marginBottom: 16,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z"/>
              </svg>
              <Link
                href={`/users/${user.username}/followers`}
                style={{ color: t.fg, textDecoration: 'none' }}
              >
                <strong>{user.followerCount.toLocaleString()}</strong>
                <span style={{ color: t.fgMuted }}> followers</span>
              </Link>
              <span style={{ color: t.fgMuted }}>·</span>
              <Link
                href={`/users/${user.username}/following`}
                style={{ color: t.fg, textDecoration: 'none' }}
              >
                <strong>{user.followingCount.toLocaleString()}</strong>
                <span style={{ color: t.fgMuted }}> following</span>
              </Link>
            </div>

            {/* Location, company, website */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              {user.company && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.fg }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}>
                    <path d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16Zm-1-12h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1 0-1.5Zm0 3h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1 0-1.5Zm0 3h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1 0-1.5Z"/>
                  </svg>
                  {user.company}
                </div>
              )}
              {user.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.fg }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}>
                    <path d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192 0ZM8 14.5l3.536-3.536a5 5 0 1 0-7.072 0Zm0-8.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                  </svg>
                  {user.location}
                </div>
              )}
              {user.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}>
                    <path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-.025 5.42a.75.75 0 0 0-1.06 0l-2.5 2.5a3.5 3.5 0 1 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0Z"/>
                  </svg>
                  <a href={user.website} target="_blank" rel="noopener noreferrer" style={{ color: t.link }}>
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right content area */}
          <div>
            {/* Tab navigation */}
            <nav style={{
              display: 'flex',
              gap: 0,
              borderBottom: `1px solid ${t.border}`,
              marginBottom: 24,
            }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    fontSize: 14,
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    color: activeTab === tab.id ? t.fg : t.fgMuted,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? `2px solid #fd8c73` : '2px solid transparent',
                    cursor: 'pointer',
                    marginBottom: -1,
                  }}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span style={{
                      padding: '0 6px',
                      fontSize: 12,
                      backgroundColor: '#eaeef2',
                      borderRadius: 10,
                      color: t.fgMuted,
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Tab content */}
            {activeTab === 'overview' && (
              <div>
                {/* Pinned containers */}
                {containers.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 400, color: t.fg, marginBottom: 12 }}>
                      Popular containers
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      {containers.slice(0, 4).map(container => (
                        <Link
                          key={container.id}
                          href={`/containers/${encodeURIComponent(container.identifier)}`}
                          style={{
                            padding: 16,
                            border: `1px solid ${t.border}`,
                            borderRadius: 6,
                            textDecoration: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill={t.fgMuted}>
                              <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
                            </svg>
                            <span style={{ fontSize: 14, fontWeight: 600, color: t.link }}>
                              {container.name || container.identifier}
                            </span>
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
                          {container.description && (
                            <p style={{
                              fontSize: 12,
                              color: t.fgMuted,
                              margin: '0 0 12px',
                              lineHeight: 1.5,
                            }}>
                              {container.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: t.fgMuted }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
                              </svg>
                              {container.starCount}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0Z"/>
                              </svg>
                              {container.forkCount}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contribution graph */}
                <ContributionGraph userId={user.id} />
              </div>
            )}

            {activeTab === 'containers' && (
              <div>
                {containers.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: t.fgMuted }}>
                    {user.username} doesn't have any public containers yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {containers.map(container => (
                      <Link
                        key={container.id}
                        href={`/containers/${encodeURIComponent(container.identifier)}`}
                        style={{
                          padding: 16,
                          border: `1px solid ${t.border}`,
                          borderRadius: 6,
                          textDecoration: 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: t.link, marginBottom: 4 }}>
                              {container.name || container.identifier}
                            </div>
                            {container.description && (
                              <p style={{ fontSize: 14, color: t.fgMuted, margin: 0 }}>
                                {container.description}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: t.fgMuted }}>
                            <span>{container.starCount} stars</span>
                            <span>{container.forkCount} forks</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stars' && (
              <div style={{ padding: 48, textAlign: 'center', color: t.fgMuted }}>
                Stars feature coming soon.
              </div>
            )}
          </div>
        </div>

        <div style={{ height: 48 }} />
      </div>
    </AppShell>
  );
}
