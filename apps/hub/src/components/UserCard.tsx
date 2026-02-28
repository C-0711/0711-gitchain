'use client';

import { useState } from 'react';
import Link from 'next/link';

const t = {
  bg: "#ffffff",
  border: "#d0d7de",
  fg: "#1f2328",
  fgMuted: "#656d76",
  link: "#0969da",
  green: "#1a7f37",
};

interface UserCardProps {
  id: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  company?: string | null;
  bio?: string | null;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  joinedAt?: string;
  showFollowButton?: boolean;
  compact?: boolean;
}

export function FollowButton({
  userId,
  initialIsFollowing = false,
  size = 'md',
}: {
  userId: string;
  initialIsFollowing?: boolean;
  size?: 'sm' | 'md';
}) {
  const [following, setFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/user/follow/${userId}`, {
        method: following ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setFollowing(!following);
      }
    } catch (e) {
      console.error('Follow action failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const px = size === 'sm' ? '4px 12px' : '5px 16px';
  const fontSize = size === 'sm' ? 12 : 13;

  // Unfollow state shows red on hover
  const buttonText = following
    ? (hover ? 'Unfollow' : 'Following')
    : 'Follow';

  const buttonBg = following
    ? (hover ? '#ffebe9' : '#f6f8fa')
    : t.bg;

  const buttonBorder = following
    ? (hover ? '#ff818266' : t.border)
    : t.border;

  const buttonColor = following
    ? (hover ? '#cf222e' : t.fg)
    : t.fg;

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={loading}
      style={{
        padding: px,
        fontSize,
        fontWeight: 500,
        color: buttonColor,
        backgroundColor: buttonBg,
        border: `1px solid ${buttonBorder}`,
        borderRadius: 6,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.1s',
        minWidth: size === 'sm' ? 70 : 80,
      }}
    >
      {buttonText}
    </button>
  );
}

export default function UserCard({
  id,
  username,
  name,
  avatarUrl,
  location,
  company,
  bio,
  followerCount = 0,
  followingCount = 0,
  isFollowing = false,
  joinedAt,
  showFollowButton = true,
  compact = false,
}: UserCardProps) {
  const [hover, setHover] = useState(false);

  const avatarSize = compact ? 40 : 48;
  const defaultAvatar = `https://avatars.githubusercontent.com/u/${id}?v=4`;

  // Format relative date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          backgroundColor: hover ? '#f6f8fa' : 'transparent',
          borderBottom: `1px solid ${t.border}`,
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Link href={`/users/${username}`}>
          <img
            src={avatarUrl || defaultAvatar}
            alt={username}
            width={avatarSize}
            height={avatarSize}
            style={{ borderRadius: '50%', border: `1px solid ${t.border}` }}
          />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={`/users/${username}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, color: t.fg }}>{name || username}</div>
            <div style={{ fontSize: 13, color: t.fgMuted }}>@{username}</div>
          </Link>
        </div>
        {showFollowButton && (
          <FollowButton userId={id} initialIsFollowing={isFollowing} size="sm" />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: '16px 20px',
        backgroundColor: hover ? '#f6f8fa' : 'transparent',
        borderBottom: `1px solid ${t.border}`,
        transition: 'background-color 0.1s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={`/users/${username}`}>
        <img
          src={avatarUrl || defaultAvatar}
          alt={username}
          width={avatarSize}
          height={avatarSize}
          style={{ borderRadius: '50%', border: `1px solid ${t.border}` }}
        />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <Link href={`/users/${username}`} style={{ textDecoration: 'none' }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: t.link }}>{username}</div>
            </Link>
            {name && <div style={{ fontSize: 14, color: t.fgMuted }}>{name}</div>}
          </div>
          {showFollowButton && (
            <FollowButton userId={id} initialIsFollowing={isFollowing} />
          )}
        </div>

        {bio && (
          <p style={{ fontSize: 14, color: t.fg, margin: '8px 0', lineHeight: 1.5 }}>{bio}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: t.fgMuted, marginTop: 8 }}>
          {location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192 0ZM8 14.5l3.536-3.536a5 5 0 1 0-7.072 0Zm0-8.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
              </svg>
              {location}
            </span>
          )}
          {company && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16Zm-1-12h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1 0-1.5Zm0 3h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1 0-1.5Zm0 3h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1 0-1.5Z"/>
              </svg>
              {company}
            </span>
          )}
          {joinedAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0Zm6.75 5H2.5v9.25c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V5Z"/>
              </svg>
              Joined {formatDate(joinedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Contributor avatar row (like GitHub's "Built by" section)
export function ContributorAvatars({
  contributors,
  maxDisplay = 5,
  size = 20,
}: {
  contributors: Array<{ id: string; username: string; avatarUrl?: string }>;
  maxDisplay?: number;
  size?: number;
}) {
  const displayed = contributors.slice(0, maxDisplay);
  const remaining = contributors.length - maxDisplay;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 12, color: t.fgMuted, marginRight: 4 }}>Built by</span>
      <div style={{ display: 'flex', marginLeft: -4 }}>
        {displayed.map((c, i) => (
          <Link key={c.id} href={`/users/${c.username}`} style={{ marginLeft: i > 0 ? -4 : 0 }}>
            <img
              src={c.avatarUrl || `https://avatars.githubusercontent.com/u/${c.id}?v=4`}
              alt={c.username}
              title={c.username}
              width={size}
              height={size}
              style={{
                borderRadius: '50%',
                border: '2px solid #fff',
                boxSizing: 'content-box',
              }}
            />
          </Link>
        ))}
      </div>
      {remaining > 0 && (
        <span style={{ fontSize: 12, color: t.fgMuted, marginLeft: 4 }}>
          +{remaining}
        </span>
      )}
    </div>
  );
}
