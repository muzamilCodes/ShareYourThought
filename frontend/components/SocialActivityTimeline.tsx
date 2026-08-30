'use client';

import { useState } from 'react';

export interface DailyActivityItem {
  date: string;
  users: number;
  thoughts: number;
  views: number;
  engagement: number;
}

interface SocialActivityTimelineProps {
  timeline?: DailyActivityItem[];
  totalUsers?: number;
  totalThoughts?: number;
  totalViews?: number;
  totalEngagement?: number;
}

export function SocialActivityTimeline({
  timeline = [],
  totalUsers = 2,
  totalThoughts = 2,
  totalViews = 24,
  totalEngagement = 6
}: SocialActivityTimelineProps) {
  const [selectedMetric, setSelectedMetric] = useState<'thoughts' | 'users' | 'views' | 'engagement'>('thoughts');

  // Fallback 7-day daily activity
  const daysData: DailyActivityItem[] =
    timeline && timeline.length > 0
      ? timeline.slice(-7)
      : [
          { date: 'Mon', users: 0, thoughts: 0, views: 2, engagement: 0 },
          { date: 'Tue', users: 0, thoughts: 0, views: 4, engagement: 1 },
          { date: 'Wed', users: 1, thoughts: 1, views: 8, engagement: 2 },
          { date: 'Thu', users: 0, thoughts: 0, views: 5, engagement: 1 },
          { date: 'Fri', users: 1, thoughts: 1, views: 12, engagement: 3 },
          { date: 'Sat', users: 0, thoughts: 0, views: 8, engagement: 2 },
          { date: 'Today', users: totalUsers, thoughts: totalThoughts, views: totalViews, engagement: totalEngagement }
        ];

  const getMetricVal = (item: DailyActivityItem) => {
    if (selectedMetric === 'users') return item.users || 0;
    if (selectedMetric === 'thoughts') return item.thoughts || 0;
    if (selectedMetric === 'views') return item.views || 0;
    return item.engagement || 0;
  };

  const maxVal = Math.max(...daysData.map(getMetricVal), 4);

  const metricLabel =
    selectedMetric === 'users'
      ? 'New Creators Joined'
      : selectedMetric === 'thoughts'
      ? 'Thoughts Published'
      : selectedMetric === 'views'
      ? 'Page Views'
      : 'Likes & Comments';

  const metricIcon =
    selectedMetric === 'users' ? '👥' : selectedMetric === 'thoughts' ? '✍️' : selectedMetric === 'views' ? '👁️' : '❤️';

  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: 'var(--shadow)',
        marginBottom: '28px'
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--line)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--ember)', textTransform: 'uppercase', marginBottom: '4px' }}>
            📅 7-Day Activity Timeline
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
            Daily Platform Growth
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--muted)' }}>
            Track daily creator signups, published thoughts, and audience engagement.
          </p>
        </div>

        {/* Metric Switcher Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--dark-soft)', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedMetric('thoughts')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.80rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedMetric === 'thoughts' ? 'var(--paper)' : 'transparent',
              color: selectedMetric === 'thoughts' ? 'var(--ink)' : 'var(--muted)',
              boxShadow: selectedMetric === 'thoughts' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            ✍️ Thoughts ({totalThoughts})
          </button>

          <button
            type="button"
            onClick={() => setSelectedMetric('users')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.80rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedMetric === 'users' ? 'var(--paper)' : 'transparent',
              color: selectedMetric === 'users' ? 'var(--ink)' : 'var(--muted)',
              boxShadow: selectedMetric === 'users' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            👥 Creators ({totalUsers})
          </button>

          <button
            type="button"
            onClick={() => setSelectedMetric('views')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.80rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedMetric === 'views' ? 'var(--paper)' : 'transparent',
              color: selectedMetric === 'views' ? 'var(--ink)' : 'var(--muted)',
              boxShadow: selectedMetric === 'views' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            👁️ Views ({totalViews})
          </button>

          <button
            type="button"
            onClick={() => setSelectedMetric('engagement')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.80rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: selectedMetric === 'engagement' ? 'var(--paper)' : 'transparent',
              color: selectedMetric === 'engagement' ? 'var(--ink)' : 'var(--muted)',
              boxShadow: selectedMetric === 'engagement' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            ❤️ Engagement ({totalEngagement})
          </button>
        </div>
      </div>

      {/* Simple & Clean Daily Activity Bar Graph */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', height: '180px', paddingTop: '20px', paddingBottom: '10px' }}>
        {daysData.map((d, i) => {
          const val = getMetricVal(d);
          const heightPercent = Math.max(12, Math.round((val / maxVal) * 100));
          const isToday = d.date === 'Today';

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative'
              }}
            >
              {/* Value Number on top of bar */}
              <span
                style={{
                  fontSize: '0.80rem',
                  fontWeight: 800,
                  color: isToday ? 'var(--ember)' : 'var(--ink)',
                  marginBottom: '6px'
                }}
              >
                {val}
              </span>

              {/* Vertical Bar */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '38px',
                  height: `${heightPercent}%`,
                  background: isToday ? 'var(--ember)' : 'var(--dark-soft)',
                  border: isToday ? 'none' : '1px solid var(--line)',
                  borderRadius: '10px 10px 4px 4px',
                  transition: 'height 300ms ease, background 200ms ease',
                  cursor: 'pointer'
                }}
                title={`${d.date}: ${val} ${metricLabel}`}
              />

              {/* Day Label at bottom */}
              <span
                style={{
                  marginTop: '10px',
                  fontSize: '0.78rem',
                  fontWeight: isToday ? 800 : 600,
                  color: isToday ? 'var(--ember)' : 'var(--muted)'
                }}
              >
                {d.date}
              </span>
            </div>
          );
        })}
      </div>

      {/* Clean Bottom Summary */}
      <div
        style={{
          marginTop: '16px',
          padding: '10px 16px',
          background: 'var(--dark-soft)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.82rem'
        }}
      >
        <span style={{ color: 'var(--ink)', fontWeight: 700 }}>
          {metricIcon} Viewing: <strong>{metricLabel}</strong> over the past 7 days
        </span>
        <span style={{ color: '#10b981', fontWeight: 800 }}>
          ● Live Active Growth
        </span>
      </div>
    </div>
  );
}
