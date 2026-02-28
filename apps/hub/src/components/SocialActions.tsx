'use client';

import { useState, useEffect } from 'react';

// Theme
const t = {
  bg: "#ffffff",
  bgHover: "#f6f8fa",
  border: "#d0d7de",
  borderLight: "#eaeef2",
  fg: "#1f2328",
  fgMuted: "#656d76",
  link: "#0969da",
  green: "#1a7f37",
  amber: "#9a6700",
};

// Icons
const Icons = {
  Star: ({ filled = false, s = 16 }: { filled?: boolean; s?: number }) => (
    filled ? (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="#e3b341">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
      </svg>
    ) : (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"/>
      </svg>
    )
  ),
  Eye: ({ s = 16 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14s-3.671-.992-4.933-2.078C1.797 10.831.88 9.577.43 8.899a1.62 1.62 0 0 1 0-1.798c.45-.678 1.367-1.932 2.637-3.023C4.33 2.992 6.019 2 8 2Zm0 1.5c-1.622 0-2.974.802-4.041 1.76C2.757 6.359 1.898 7.5 1.5 8c.398.5 1.257 1.641 2.459 2.74C5.026 11.698 6.378 12.5 8 12.5c1.622 0 2.974-.802 4.041-1.76 1.202-1.099 2.061-2.24 2.459-2.74-.398-.5-1.257-1.641-2.459-2.74C10.974 4.302 9.622 3.5 8 3.5ZM8 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/>
    </svg>
  ),
  Fork: ({ s = 16 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
    </svg>
  ),
  ChevDown: ({ s = 12 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"/>
    </svg>
  ),
};

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

interface SocialActionsProps {
  containerId: string;
  initialStarCount?: number;
  initialWatchCount?: number;
  initialForkCount?: number;
  initialHasStarred?: boolean;
  initialWatchLevel?: string | null;
  showLabels?: boolean;
  size?: 'sm' | 'md';
}

export function StarButton({
  containerId,
  initialCount = 0,
  initialHasStarred = false,
  showLabel = true,
  size = 'md',
}: {
  containerId: string;
  initialCount?: number;
  initialHasStarred?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}) {
  const [starred, setStarred] = useState(initialHasStarred);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/containers/${encodeURIComponent(containerId)}/star`, {
        method: starred ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setStarred(!starred);
        setCount(c => starred ? c - 1 : c + 1);
      }
    } catch (e) {
      console.error('Star action failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const px = size === 'sm' ? '8px 10px' : '5px 12px';
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <div style={{ display: 'inline-flex', borderRadius: 6, overflow: 'hidden' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: px,
          fontSize,
          fontWeight: 500,
          color: t.fg,
          backgroundColor: starred ? '#fff8c5' : t.bg,
          border: `1px solid ${starred ? '#d4a72c66' : t.border}`,
          borderRight: 'none',
          borderRadius: '6px 0 0 6px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'background-color 0.1s',
        }}
      >
        <Icons.Star filled={starred} s={size === 'sm' ? 14 : 16} />
        {showLabel && <span>{starred ? 'Starred' : 'Star'}</span>}
      </button>
      <a
        href={`/containers/${encodeURIComponent(containerId)}/stargazers`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: px,
          fontSize,
          fontWeight: 600,
          color: t.fg,
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: '0 6px 6px 0',
          textDecoration: 'none',
          transition: 'background-color 0.1s',
        }}
      >
        {formatCount(count)}
      </a>
    </div>
  );
}

export function WatchButton({
  containerId,
  initialCount = 0,
  initialLevel = null,
  showLabel = true,
  size = 'md',
}: {
  containerId: string;
  initialCount?: number;
  initialLevel?: string | null;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}) {
  const [level, setLevel] = useState(initialLevel);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const watchOptions = [
    { id: 'participating', label: 'Participating and @mentions', desc: 'Only receive notifications from this container when participating or @mentioned.' },
    { id: 'all', label: 'All Activity', desc: 'Notified of all notifications on this container.' },
    { id: 'ignore', label: 'Ignore', desc: 'Never be notified.' },
  ];

  const handleWatch = async (newLevel: string) => {
    setLoading(true);
    setMenuOpen(false);
    try {
      if (newLevel === level) {
        // Unwatch
        const res = await fetch(`/api/containers/${encodeURIComponent(containerId)}/watch`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setLevel(null);
          setCount(c => c - 1);
        }
      } else {
        const res = await fetch(`/api/containers/${encodeURIComponent(containerId)}/watch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: newLevel }),
        });
        if (res.ok) {
          if (!level) setCount(c => c + 1);
          setLevel(newLevel);
        }
      }
    } catch (e) {
      console.error('Watch action failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const px = size === 'sm' ? '8px 10px' : '5px 12px';
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', borderRadius: 6, overflow: 'visible' }}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: px,
          fontSize,
          fontWeight: 500,
          color: t.fg,
          backgroundColor: level ? '#ddf4ff' : t.bg,
          border: `1px solid ${level ? '#54aeff66' : t.border}`,
          borderRight: 'none',
          borderRadius: '6px 0 0 6px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'background-color 0.1s',
        }}
      >
        <Icons.Eye s={size === 'sm' ? 14 : 16} />
        {showLabel && <span>{level ? 'Watching' : 'Watch'}</span>}
        <Icons.ChevDown s={10} />
      </button>
      <a
        href={`/containers/${encodeURIComponent(containerId)}/watchers`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: px,
          fontSize,
          fontWeight: 600,
          color: t.fg,
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: '0 6px 6px 0',
          textDecoration: 'none',
          transition: 'background-color 0.1s',
        }}
      >
        {formatCount(count)}
      </a>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            width: 300,
            backgroundColor: '#fff',
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.borderLight}`, fontSize: 12, fontWeight: 600, color: t.fg }}>
              Notifications
            </div>
            {watchOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleWatch(opt.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '10px 12px',
                  textAlign: 'left',
                  backgroundColor: level === opt.id ? '#f6f8fa' : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${t.borderLight}`,
                  cursor: 'pointer',
                  transition: 'background-color 0.1s',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: t.fg }}>{opt.label}</span>
                <span style={{ fontSize: 12, color: t.fgMuted }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ForkButton({
  containerId,
  initialCount = 0,
  showLabel = true,
  size = 'md',
}: {
  containerId: string;
  initialCount?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}) {
  const [count] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleFork = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/containers/${encodeURIComponent(containerId)}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        // Navigate to forked container
        window.location.href = `/containers/${encodeURIComponent(data.container.identifier)}`;
      }
    } catch (e) {
      console.error('Fork action failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const px = size === 'sm' ? '8px 10px' : '5px 12px';
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <div style={{ display: 'inline-flex', borderRadius: 6, overflow: 'hidden' }}>
      <button
        onClick={handleFork}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: px,
          fontSize,
          fontWeight: 500,
          color: t.fg,
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          borderRight: 'none',
          borderRadius: '6px 0 0 6px',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'background-color 0.1s',
        }}
      >
        <Icons.Fork s={size === 'sm' ? 14 : 16} />
        {showLabel && <span>Fork</span>}
      </button>
      <a
        href={`/containers/${encodeURIComponent(containerId)}/forks`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: px,
          fontSize,
          fontWeight: 600,
          color: t.fg,
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: '0 6px 6px 0',
          textDecoration: 'none',
          transition: 'background-color 0.1s',
        }}
      >
        {formatCount(count)}
      </a>
    </div>
  );
}

export default function SocialActions({
  containerId,
  initialStarCount = 0,
  initialWatchCount = 0,
  initialForkCount = 0,
  initialHasStarred = false,
  initialWatchLevel = null,
  showLabels = true,
  size = 'md',
}: SocialActionsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <WatchButton
        containerId={containerId}
        initialCount={initialWatchCount}
        initialLevel={initialWatchLevel}
        showLabel={showLabels}
        size={size}
      />
      <ForkButton
        containerId={containerId}
        initialCount={initialForkCount}
        showLabel={showLabels}
        size={size}
      />
      <StarButton
        containerId={containerId}
        initialCount={initialStarCount}
        initialHasStarred={initialHasStarred}
        showLabel={showLabels}
        size={size}
      />
    </div>
  );
}
