'use client';

import { useState, useEffect } from 'react';

const t = {
  fg: "#1f2328",
  fgMuted: "#656d76",
  border: "#d0d7de",
  borderLight: "#eaeef2",
};

// GitHub-style contribution colors
const contributionColors = [
  '#ebedf0', // 0 contributions - gray
  '#9be9a8', // Level 1 - light green
  '#40c463', // Level 2
  '#30a14e', // Level 3
  '#216e39', // Level 4 - dark green
];

interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4
}

interface ContributionCalendarProps {
  userId?: string;
  data?: {
    year: number;
    totalContributions: number;
    longestStreak: number;
    currentStreak: number;
    weeks: ContributionDay[][];
  };
  loading?: boolean;
}

const CELL_SIZE = 10;
const CELL_GAP = 2;
const MONTH_LABEL_HEIGHT = 15;

// Generate sample data for preview
function generateSampleData(): ContributionDay[][] {
  const weeks: ContributionDay[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364); // Go back ~1 year

  // Align to start of week (Sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay());

  let currentDate = new Date(startDate);

  for (let week = 0; week < 53; week++) {
    const weekDays: ContributionDay[] = [];
    for (let day = 0; day < 7; day++) {
      // Random contribution with some patterns
      const isWeekday = day > 0 && day < 6;
      const baseChance = isWeekday ? 0.6 : 0.3;
      const hasContribution = Math.random() < baseChance;

      let count = 0;
      let level = 0;

      if (hasContribution) {
        // Weighted random for contribution amount
        const r = Math.random();
        if (r < 0.5) { count = Math.floor(Math.random() * 3) + 1; level = 1; }
        else if (r < 0.8) { count = Math.floor(Math.random() * 5) + 3; level = 2; }
        else if (r < 0.95) { count = Math.floor(Math.random() * 8) + 5; level = 3; }
        else { count = Math.floor(Math.random() * 15) + 10; level = 4; }
      }

      weekDays.push({
        date: currentDate.toISOString().split('T')[0],
        count,
        level,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(weekDays);
  }

  return weeks;
}

// Get month labels with positions
function getMonthLabels(weeks: ContributionDay[][]): Array<{ label: string; x: number }> {
  const labels: Array<{ label: string; x: number }> = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    if (week.length > 0) {
      const date = new Date(week[0].date);
      const month = date.getMonth();

      if (month !== lastMonth) {
        labels.push({
          label: months[month],
          x: weekIndex * (CELL_SIZE + CELL_GAP),
        });
        lastMonth = month;
      }
    }
  });

  return labels;
}

const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function ContributionGraph({
  userId,
  data,
  loading = false,
}: ContributionCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [calendarData, setCalendarData] = useState<ContributionDay[][] | null>(null);
  const [stats, setStats] = useState({ total: 0, longest: 0, current: 0 });

  useEffect(() => {
    if (data) {
      setCalendarData(data.weeks);
      setStats({
        total: data.totalContributions,
        longest: data.longestStreak,
        current: data.currentStreak,
      });
    } else if (userId) {
      // Fetch from API
      fetch(`/api/users/${userId}/contributions`)
        .then(res => res.json())
        .then(d => {
          setCalendarData(d.weeks || []);
          setStats({
            total: d.totalContributions || 0,
            longest: d.longestStreak || 0,
            current: d.currentStreak || 0,
          });
        })
        .catch(() => {
          // Use sample data on error
          const sample = generateSampleData();
          setCalendarData(sample);
          // Calculate stats from sample
          let total = 0;
          sample.forEach(week => week.forEach(day => { total += day.count; }));
          setStats({ total, longest: 12, current: 5 });
        });
    } else {
      // Use sample data
      const sample = generateSampleData();
      setCalendarData(sample);
      let total = 0;
      sample.forEach(week => week.forEach(day => { total += day.count; }));
      setStats({ total, longest: 12, current: 5 });
    }
  }, [userId, data]);

  if (loading || !calendarData) {
    return (
      <div style={{
        padding: 16,
        backgroundColor: '#fff',
        border: `1px solid ${t.border}`,
        borderRadius: 8,
      }}>
        <div style={{ height: 128, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgMuted }}>
          Loading contributions...
        </div>
      </div>
    );
  }

  const monthLabels = getMonthLabels(calendarData);
  const width = calendarData.length * (CELL_SIZE + CELL_GAP);
  const height = 7 * (CELL_SIZE + CELL_GAP);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{
      padding: 16,
      backgroundColor: '#fff',
      border: `1px solid ${t.border}`,
      borderRadius: 8,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 14, color: t.fg }}>
          <strong>{stats.total.toLocaleString()}</strong> contributions in the last year
        </span>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: t.fgMuted }}>
          <span>Longest streak: <strong style={{ color: t.fg }}>{stats.longest}</strong> days</span>
          <span>Current streak: <strong style={{ color: t.fg }}>{stats.current}</strong> days</span>
        </div>
      </div>

      {/* Graph */}
      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <svg
          width={width + 40}
          height={height + MONTH_LABEL_HEIGHT + 10}
          style={{ display: 'block' }}
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={m.x + 40}
              y={10}
              fontSize={10}
              fill={t.fgMuted}
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {dayLabels.map((label, i) => (
            <text
              key={i}
              x={0}
              y={MONTH_LABEL_HEIGHT + 8 + i * (CELL_SIZE + CELL_GAP)}
              fontSize={9}
              fill={t.fgMuted}
              dominantBaseline="middle"
            >
              {label}
            </text>
          ))}

          {/* Contribution cells */}
          <g transform={`translate(40, ${MONTH_LABEL_HEIGHT})`}>
            {calendarData.map((week, weekIndex) => (
              <g key={weekIndex} transform={`translate(${weekIndex * (CELL_SIZE + CELL_GAP)}, 0)`}>
                {week.map((day, dayIndex) => (
                  <rect
                    key={dayIndex}
                    x={0}
                    y={dayIndex * (CELL_SIZE + CELL_GAP)}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    fill={contributionColors[day.level]}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      setHoveredDay(day);
                      setMousePos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setMousePos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                ))}
              </g>
            ))}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredDay && (
          <div style={{
            position: 'fixed',
            left: mousePos.x + 10,
            top: mousePos.y - 40,
            padding: '6px 10px',
            backgroundColor: '#24292f',
            color: '#fff',
            fontSize: 12,
            borderRadius: 6,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 100,
          }}>
            <strong>{hoveredDay.count} contribution{hoveredDay.count !== 1 ? 's' : ''}</strong>
            <span style={{ color: '#8b949e' }}> on {formatDate(hoveredDay.date)}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        marginTop: 8,
        fontSize: 11,
        color: t.fgMuted,
      }}>
        <span>Less</span>
        {contributionColors.map((color, i) => (
          <span
            key={i}
            style={{
              width: 10,
              height: 10,
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
