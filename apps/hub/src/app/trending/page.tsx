'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import TrendingCard from '@/components/TrendingCard';

const t = {
  bg: "#ffffff",
  border: "#d0d7de",
  borderLight: "#eaeef2",
  fg: "#1f2328",
  fgMuted: "#656d76",
  link: "#0969da",
};

// Filter options
const dateRanges = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This week' },
  { id: 'monthly', label: 'This month' },
];

const languages = [
  { id: '', label: 'Any language' },
  { id: 'json', label: 'JSON' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
];

interface TrendingContainer {
  rank: number;
  container: {
    id: string;
    identifier: string;
    name: string;
    description?: string;
    starCount: number;
    forkCount: number;
    owner: {
      id: string;
      username: string;
      avatarUrl?: string;
    };
  };
  recentStars: number;
  recentForks: number;
}

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState<'containers' | 'developers'>('containers');
  const [dateRange, setDateRange] = useState('daily');
  const [language, setLanguage] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [containers, setContainers] = useState<TrendingContainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ since: dateRange });
        if (language) params.set('language', language);

        const res = await fetch(`/api/trending?${params}`);
        if (res.ok) {
          const data = await res.json();
          setContainers(data.containers || []);
        }
      } catch (e) {
        console.error('Failed to fetch trending:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, [dateRange, language]);

  // Dropdown component
  const FilterDropdown = ({
    id,
    label,
    options,
    value,
    onChange,
  }: {
    id: string;
    label: string;
    options: Array<{ id: string; label: string }>;
    value: string;
    onChange: (v: string) => void;
  }) => {
    const isOpen = dropdownOpen === id;
    const selectedLabel = options.find(o => o.id === value)?.label || label;

    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(isOpen ? null : id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 12px',
            fontSize: 14,
            fontWeight: 500,
            color: t.fg,
            backgroundColor: t.bg,
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <span>{label}: <strong>{selectedLabel}</strong></span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"/>
          </svg>
        </button>
        {isOpen && (
          <>
            <div
              onClick={() => setDropdownOpen(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              minWidth: 200,
              backgroundColor: '#fff',
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              {options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setDropdownOpen(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    fontSize: 14,
                    textAlign: 'left',
                    backgroundColor: value === opt.id ? '#f6f8fa' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {opt.label}
                  {value === opt.id && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill={t.link}>
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 1.042-.018.751.751 0 0 1 .018 1.042L6 13.06l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Explore navigation */}
        <nav style={{
          display: 'flex',
          gap: 24,
          padding: '16px 0',
          borderBottom: `1px solid ${t.borderLight}`,
          marginBottom: 24,
        }}>
          {[
            { href: '/explore', label: 'Explore' },
            { href: '/topics', label: 'Topics' },
            { href: '/trending', label: 'Trending', active: true },
            { href: '/collections', label: 'Collections' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontSize: 14,
                fontWeight: item.active ? 600 : 400,
                color: item.active ? t.fg : t.fgMuted,
                textDecoration: 'none',
                borderBottom: item.active ? `2px solid #fd8c73` : '2px solid transparent',
                paddingBottom: 14,
                marginBottom: -16,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: t.fg, margin: '0 0 8px' }}>
            Trending
          </h1>
          <p style={{ fontSize: 14, color: t.fgMuted, margin: 0 }}>
            See what the GitChain community is most excited about today.
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: '#f6f8fa',
          border: `1px solid ${t.border}`,
          borderRadius: '8px 8px 0 0',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            <button
              onClick={() => setActiveTab('containers')}
              style={{
                padding: '6px 16px',
                fontSize: 14,
                fontWeight: activeTab === 'containers' ? 600 : 400,
                color: activeTab === 'containers' ? t.fg : t.fgMuted,
                backgroundColor: activeTab === 'containers' ? t.bg : 'transparent',
                border: activeTab === 'containers' ? `1px solid ${t.border}` : '1px solid transparent',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Containers
            </button>
            <button
              onClick={() => setActiveTab('developers')}
              style={{
                padding: '6px 16px',
                fontSize: 14,
                fontWeight: activeTab === 'developers' ? 600 : 400,
                color: activeTab === 'developers' ? t.fg : t.fgMuted,
                backgroundColor: activeTab === 'developers' ? t.bg : 'transparent',
                border: activeTab === 'developers' ? `1px solid ${t.border}` : '1px solid transparent',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Developers
            </button>
          </div>

          {/* Filter dropdowns */}
          <div style={{ display: 'flex', gap: 8 }}>
            <FilterDropdown
              id="language"
              label="Language"
              options={languages}
              value={language}
              onChange={setLanguage}
            />
            <FilterDropdown
              id="dateRange"
              label="Date range"
              options={dateRanges}
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>

        {/* Results */}
        <div style={{
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: t.fgMuted }}>
              Loading trending containers...
            </div>
          ) : containers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                <svg width="48" height="48" viewBox="0 0 16 16" fill={t.fgMuted}>
                  <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: t.fg, margin: '0 0 8px' }}>
                No trending containers yet
              </h3>
              <p style={{ fontSize: 14, color: t.fgMuted, maxWidth: 400, margin: '0 auto' }}>
                Star some containers to see them appear here, or check back later as the community grows.
              </p>
            </div>
          ) : (
            <div style={{ padding: '0 16px' }}>
              {containers.map((item, index) => (
                <TrendingCard
                  key={item.container.id}
                  id={item.container.id}
                  identifier={item.container.identifier}
                  name={item.container.name}
                  description={item.container.description}
                  owner={item.container.owner}
                  starCount={item.container.starCount}
                  forkCount={item.container.forkCount}
                  recentStars={item.recentStars}
                  language="json"
                  topics={[]}
                  contributors={[]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ height: 48 }} />
      </div>
    </AppShell>
  );
}
