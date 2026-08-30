'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '../../hooks/useSession';
import { api } from '../../lib/api';
import type { CreatorAnalytics, Thought } from '../../types';

export default function AnalyticsPage() {
  const { session, ready } = useSession();
  const router = useRouter();
  const [data, setData] = useState<CreatorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'audience'>('overview');

  const fetchAnalytics = async (isManual = false) => {
    if (!session?.token) return;
    if (isManual) setRefreshing(true);
    try {
      const res = await api.getCreatorAnalytics(session.token);
      setData(res);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to load real-time analytics');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (ready && !session?.token) {
      router.push('/login');
      return;
    }

    if (ready && session?.token) {
      fetchAnalytics();
    }
  }, [session, ready, router]);

  if (!ready || (loading && !data)) {
    return (
      <div className="container" style={{ maxWidth: '880px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>📊</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Connecting to Creator Studio…</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Querying live impressions, engagements, and follower metrics from MongoDB Atlas.
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="container" style={{ maxWidth: '880px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Unable to Load Real-Time Analytics</h3>
        <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>{error}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => fetchAnalytics(true)}
          style={{ padding: '10px 24px', borderRadius: '12px' }}
        >
          🔄 Retry Real-Time Sync
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalThoughts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalSaves: 0,
    totalComments: 0,
    totalShares: 0,
    totalFollowers: 0,
    totalFollowing: 0,
    engagementRate: '0.0%',
    viewsPerThought: '0',
    likesPerThought: '0',
    commentsPerThought: '0'
  };

  const topThoughts: Thought[] = data?.topThoughts || [];
  const timeline = data?.timeline || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const creator = data?.creator || {
    name: session?.user?.name || 'Creator',
    username: session?.user?.username || 'user',
    avatar: session?.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name || 'user'}`
  };

  return (
    <div className="container" style={{ maxWidth: '920px', margin: '20px auto 80px', padding: '0 16px' }}>
      {/* Real-time Header & Creator Profile Lockup */}
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '24px',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={creator.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creator.name)}`}
              alt={creator.name}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--ember)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  {creator.name}
                </h1>
                <span className="pill" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  ● LIVE DATA
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', color: 'var(--muted)', fontSize: '0.86rem' }}>
                @{creator.username} • Creator Analytics Studio
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              style={{ fontSize: '0.84rem', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s ease' }}>🔄</span>
              {refreshing ? 'Syncing…' : 'Refresh Real Data'}
            </button>
            <Link
              href="/create"
              className="btn btn-primary"
              style={{ fontSize: '0.84rem', padding: '8px 18px', borderRadius: '12px' }}
            >
              ✍️ New Thought
            </Link>
          </div>
        </div>

        {/* Studio Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              background: activeTab === 'overview' ? 'var(--ember)' : 'transparent',
              color: activeTab === 'overview' ? '#fff' : 'var(--muted)',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📊 Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            style={{
              background: activeTab === 'content' ? 'var(--ember)' : 'transparent',
              color: activeTab === 'content' ? '#fff' : 'var(--muted)',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🏆 Top Content ({topThoughts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audience')}
            style={{
              background: activeTab === 'audience' ? 'var(--ember)' : 'transparent',
              color: activeTab === 'audience' ? '#fff' : 'var(--muted)',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            👥 Audience & Topics
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Engagement Rate Hero Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(200, 109, 52, 0.14) 0%, rgba(245, 158, 11, 0.08) 100%)',
              border: '1px solid rgba(200, 109, 52, 0.35)',
              borderRadius: '24px',
              padding: '26px 30px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ember)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Real Audience Engagement Rate
              </div>
              <div style={{ fontSize: '2.6rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1.1, marginTop: '4px' }}>
                {metrics.engagementRate}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.84rem', color: 'var(--muted)', maxWidth: '420px' }}>
                Real ratio of interactions (likes + comments + saves + shares) relative to total views across all your published thoughts.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ textAlign: 'center', background: 'var(--paper)', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700 }}>Avg Views/Post</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ink)', marginTop: '2px' }}>{metrics.viewsPerThought}</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--paper)', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700 }}>Avg Likes/Post</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ink)', marginTop: '2px' }}>{metrics.likesPerThought}</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--paper)', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700 }}>Avg Comments</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ink)', marginTop: '2px' }}>{metrics.commentsPerThought}</div>
              </div>
            </div>
          </div>

          {/* 6 Real Database Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '28px'
            }}
          >
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>✍️ Total Thoughts</span>
                <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 800 }}>LIVE</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginTop: '6px' }}>
                {metrics.totalThoughts}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px' }}>Published posts</div>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>👁️ Total Impressions</span>
                <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 800 }}>LIVE</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginTop: '6px' }}>
                {metrics.totalViews}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px' }}>Actual user views</div>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>❤️ Total Likes</span>
                <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 800 }}>LIVE</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginTop: '6px' }}>
                {metrics.totalLikes}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px' }}>Audience appreciations</div>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>💬 Total Comments</span>
                <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 800 }}>LIVE</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginTop: '6px' }}>
                {metrics.totalComments}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px' }}>Direct community replies</div>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>🔖 Total Saves</span>
                <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 800 }}>LIVE</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginTop: '6px' }}>
                {metrics.totalSaves || 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px' }}>Bookmarked by users</div>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '20px', padding: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>👥 Followers Network</span>
                <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 800 }}>LIVE</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginTop: '6px' }}>
                {metrics.totalFollowers}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px' }}>
                Following: {metrics.totalFollowing || 0}
              </div>
            </div>
          </div>

          {/* Real 7-Day Performance Timeline */}
          <div
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '24px',
              padding: '24px 28px',
              marginBottom: '28px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  📈 Real 7-Day Performance Timeline
                </h3>
                <p style={{ margin: '3px 0 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
                  Daily impressions and posts recorded in MongoDB over the past week.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '14px', fontSize: '0.76rem', color: 'var(--muted)', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--ember)', display: 'inline-block' }}></span>
                  Views
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#38bdf8', display: 'inline-block' }}></span>
                  Posts
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '160px', padding: '16px 0 0' }}>
              {timeline.map((item: any) => {
                const maxViews = Math.max(...timeline.map((t: any) => t.views || 0), 5);
                const viewsVal = item.views || 0;
                const heightPercent = Math.max(12, Math.round((viewsVal / maxViews) * 100));

                return (
                  <div
                    key={item.date}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '6px', fontWeight: 800 }}>
                      {viewsVal}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '42px',
                        height: `${heightPercent}%`,
                        background: viewsVal > 0 ? 'linear-gradient(180deg, var(--ember) 0%, rgba(200, 109, 52, 0.5) 100%)' : 'var(--dark-soft)',
                        borderRadius: '8px 8px 0 0',
                        transition: 'height 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid var(--line)',
                        position: 'relative'
                      }}
                      title={`${item.formattedDate}: ${viewsVal} views, ${item.posts || 0} posts, ${item.likes || 0} likes, ${item.comments || 0} comments`}
                    >
                      {item.posts > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-4px',
                            background: '#38bdf8',
                            color: '#000',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            fontSize: '0.64rem',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {item.posts}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--ink)', marginTop: '10px', fontWeight: 700 }}>
                      {item.day}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--muted)' }}>
                      {item.formattedDate?.split(' ')[1] || ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {(activeTab === 'overview' || activeTab === 'content') && (
        /* Top 5 Performing Thoughts */
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '24px',
            padding: '24px 28px',
            marginBottom: '28px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                🏆 Top Performing Thoughts
              </h3>
              <p style={{ margin: '3px 0 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
                Your highest engagement posts ranked by views, likes, comments, and saves.
              </p>
            </div>
            {topThoughts.length > 0 && (
              <span className="pill" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                {topThoughts.length} Top Ranked
              </span>
            )}
          </div>

          {topThoughts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✍️</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                You haven't published any thoughts yet. Publish your first thought to see real performance metrics!
              </p>
              <Link href="/create" className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '12px' }}>
                Create First Thought
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topThoughts.map((t: any, idx: number) => (
                <Link
                  key={t._id}
                  href={`/thought/${t._id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: 'var(--dark-soft)',
                    border: '1px solid var(--line)',
                    transition: 'transform 140ms ease, border-color 140ms ease',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 900,
                        color: idx === 0 ? 'var(--ember)' : 'var(--muted)',
                        minWidth: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: idx === 0 ? 'rgba(200, 109, 52, 0.15)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          color: 'var(--ink)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {t.content}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--ember)', fontWeight: 600 }}>
                          #{t.category}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                          • {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', flexShrink: 0, fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700 }}>
                    <span title="Total Views">👁️ {t.views || t.viewsCount || 0}</span>
                    <span title="Total Likes">❤️ {t.likes || t.likesCount || 0}</span>
                    <span title="Total Comments">💬 {t.comments || t.commentsCount || 0}</span>
                    <span title="Total Shares">📤 {t.shares || t.sharesCount || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'audience') && (
        /* Topics & Category Distribution */
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: '24px',
            padding: '24px 28px'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px 0' }}>
            🏷️ Category & Topics Distribution
          </h3>
          <p style={{ margin: '0 0 20px 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
            Breakdown of your published thoughts categorized across topics.
          </p>

          {categoryBreakdown.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>No categorized thoughts published yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {categoryBreakdown.map((cat: any) => (
                <div
                  key={cat.name}
                  style={{
                    background: 'var(--dark-soft)',
                    border: '1px solid var(--line)',
                    borderRadius: '16px',
                    padding: '16px 20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink)' }}>{cat.name}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--ember)' }}>
                      {cat.count} {cat.count === 1 ? 'post' : 'posts'} ({cat.percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${cat.percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--ember) 0%, #f59e0b 100%)',
                        borderRadius: '3px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
