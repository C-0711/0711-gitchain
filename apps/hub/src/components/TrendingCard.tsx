'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StarButton } from './SocialActions';
import { ContributorAvatars } from './UserCard';

const t = {
  bg: "#ffffff",
  border: "#d0d7de",
  borderLight: "#eaeef2",
  fg: "#1f2328",
  fgMuted: "#656d76",
  link: "#0969da",
  green: "#1a7f37",
  amber: "#9a6700",
};

// Language colors (like GitHub)
const languageColors: Record<string, string> = {
  json: "#292929",
  python: "#3572A5",
  javascript: "#f1e05a",
  typescript: "#3178c6",
  go: "#00ADD8",
  rust: "#dea584",
  java: "#b07219",
  cpp: "#f34b7d",
  csharp: "#178600",
  ruby: "#701516",
  php: "#4F5D95",
  swift: "#F05138",
  kotlin: "#A97BFF",
  default: "#8b8b8b",
};

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

interface TrendingContainerCardProps {
  id: string;
  identifier: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  starCount: number;
  forkCount: number;
  language?: string;
  topics?: string[];
  contributors?: Array<{ id: string; username: string; avatarUrl?: string }>;
  recentStars?: number;
  updatedAt?: string;
  hasStarred?: boolean;
}

export default function TrendingCard({
  id,
  identifier,
  name,
  description,
  owner,
  starCount,
  forkCount,
  language = 'json',
  topics = [],
  contributors = [],
  recentStars,
  updatedAt,
  hasStarred = false,
}: TrendingContainerCardProps) {
  const [hover, setHover] = useState(false);

  const langColor = languageColors[language.toLowerCase()] || languageColors.default;

  // Parse owner/name from identifier
  const [namespace, containerName] = identifier.includes('/')
    ? identifier.split('/').slice(0, 2)
    : [owner.username, identifier];

  return (
    <article
      style={{
        padding: '16px 0',
        borderBottom: `1px solid ${t.borderLight}`,
        backgroundColor: hover ? '#fafbfc' : 'transparent',
        transition: 'background-color 0.1s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Header with repo name and star button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href={`/users/${owner.username}`}>
            <img
              src={owner.avatarUrl || `https://avatars.githubusercontent.com/u/${owner.id}?v=4`}
              alt={owner.username}
              width={20}
              height={20}
              style={{ borderRadius: 4 }}
            />
          </Link>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 400 }}>
            <Link
              href={`/users/${owner.username}`}
              style={{ color: t.link, textDecoration: 'none' }}
            >
              {namespace}
            </Link>
            <span style={{ color: t.fgMuted }}> / </span>
            <Link
              href={`/containers/${encodeURIComponent(identifier)}`}
              style={{ color: t.link, textDecoration: 'none', fontWeight: 600 }}
            >
              {containerName || name}
            </Link>
          </h3>
        </div>
        <StarButton
          containerId={id}
          initialCount={starCount}
          initialHasStarred={hasStarred}
          showLabel={true}
          size="sm"
        />
      </div>

      {/* Description */}
      {description && (
        <p style={{
          margin: '0 0 12px 28px',
          fontSize: 14,
          color: t.fgMuted,
          lineHeight: 1.5,
          maxWidth: 700,
        }}>
          {description}
        </p>
      )}

      {/* Topics */}
      {topics.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginLeft: 28, marginBottom: 12 }}>
          {topics.slice(0, 6).map(topic => (
            <Link
              key={topic}
              href={`/topics/${topic}`}
              style={{
                padding: '0 10px',
                fontSize: 12,
                lineHeight: '22px',
                borderRadius: 12,
                backgroundColor: '#ddf4ff',
                color: '#0969da',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'background-color 0.1s',
              }}
            >
              {topic}
            </Link>
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginLeft: 28,
        fontSize: 12,
        color: t.fgMuted
      }}>
        {/* Language */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: langColor,
          }} />
          <span>{language}</span>
        </span>

        {/* Stars */}
        <Link
          href={`/containers/${encodeURIComponent(identifier)}/stargazers`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: t.fgMuted,
            textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
          </svg>
          {formatCount(starCount)}
        </Link>

        {/* Forks */}
        <Link
          href={`/containers/${encodeURIComponent(identifier)}/forks`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: t.fgMuted,
            textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
          </svg>
          {formatCount(forkCount)}
        </Link>

        {/* Contributors */}
        {contributors.length > 0 && (
          <ContributorAvatars contributors={contributors} maxDisplay={5} size={18} />
        )}

        {/* Recent stars indicator */}
        {recentStars !== undefined && recentStars > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
            </svg>
            {formatCount(recentStars)} stars today
          </span>
        )}
      </div>
    </article>
  );
}

// Compact trending row for sidebar
export function TrendingRow({
  rank,
  identifier,
  name,
  description,
  starCount,
  recentStars,
}: {
  rank: number;
  identifier: string;
  name: string;
  description?: string;
  starCount: number;
  recentStars?: number;
}) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={`/containers/${encodeURIComponent(identifier)}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 12px',
        backgroundColor: hover ? '#f6f8fa' : 'transparent',
        textDecoration: 'none',
        transition: 'background-color 0.1s',
        borderBottom: `1px solid ${t.borderLight}`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{
        fontSize: 14,
        fontWeight: 600,
        color: t.fgMuted,
        minWidth: 20,
        textAlign: 'right',
      }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.link, marginBottom: 2 }}>
          {name || identifier}
        </div>
        {description && (
          <div style={{
            fontSize: 12,
            color: t.fgMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {description}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12, color: t.fgMuted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
            </svg>
            {formatCount(starCount)}
          </span>
          {recentStars !== undefined && recentStars > 0 && (
            <span style={{ color: t.green }}>+{formatCount(recentStars)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
