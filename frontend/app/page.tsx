'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { Reveal } from '../components/Reveal';
import { ThoughtCard } from '../components/ThoughtCard';
import { FeedSkeleton } from '../components/SkeletonLoader';
import { StoryTray } from '../components/StoryTray';
import { MobileSuggestedUsers } from '../components/MobileSuggestedUsers';
import { InstagramRightRail } from '../components/InstagramRightRail';
import { DailyThoughtSpotlight } from '../components/DailyThoughtSpotlight';
import { useSession } from '../hooks/useSession';
import { api } from '../lib/api';
import type { Category, Thought } from '../types';

export default function HomePage() {
  const { session } = useSession();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<'trending' | 'newest' | 'views' | 'popular' | 'following'>('trending');

  const fetchFeed = (sortMode: 'trending' | 'newest' | 'views' | 'popular' | 'following') => {
    setLoading(true);
    api.getThoughts(sortMode, 1, 20, session?.token)
      .then((feed) => {
        setThoughts(feed.thoughts || []);
        setTotalCount(feed.total || 0);
      })
      .catch(() => setThoughts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeed(activeSort);
  }, [activeSort, session?.token]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchFeed(activeSort);
    };
    window.addEventListener('follow-status-updated', handleRefresh);
    window.addEventListener('thought-created', handleRefresh);
    return () => {
      window.removeEventListener('follow-status-updated', handleRefresh);
      window.removeEventListener('thought-created', handleRefresh);
    };
  }, [activeSort, session?.token]);

  useEffect(() => {
    api.listCategories()
      .then((cats) => {
        if (cats.categories?.length) {
          setCategories(cats.categories);
        }
      })
      .catch(() => {});
  }, []);

  const handleDeleted = (deletedId: string) => {
    setThoughts((current) => current.filter((t) => t._id !== deletedId));
    setTotalCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="page">
      <div className="insta-feed-layout">
        {/* =========================================================
            CENTER MAIN FEED COLUMN (INSTAGRAM SINGLE COLUMN STREAM)
        ========================================================= */}
        <div className="insta-main-column">
          {/* Instagram-Style Story Sparks Tray */}
          <div style={{ marginBottom: '16px' }}>
            <StoryTray thoughts={thoughts} />
          </div>

          {/* Mobile Quick Create Banner */}
          <div className="mobile-create-wrapper mobile-only">
            <Link href="/create" className="mobile-create-bar">
              <img
                src={
                  session?.user?.avatar ||
                  (session?.user?.name
                    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.name)}`
                    : 'https://api.dicebear.com/7.x/initials/svg?seed=User')
                }
                alt={session?.user?.name || 'You'}
                className="mobile-create-avatar"
              />
              <span className="mobile-create-placeholder">
                What&apos;s on your mind? Share a thought…
              </span>
              <span className="mobile-create-btn">
                Post ✍️
              </span>
            </Link>
          </div>

          {/* Daily Thought of the Day Spotlight */}
          <DailyThoughtSpotlight />

          {/* Feed Filter Sorting Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '16px',
              padding: '0 2px'
            }}
          >
            <h2 className="display-title" style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
              {activeSort === 'views'
                ? '👁️ Most Viewed'
                : activeSort === 'trending'
                ? '🔥 Trending'
                : activeSort === 'newest'
                ? '⚡ Latest'
                : activeSort === 'popular'
                ? '❤️ Most Liked'
                : '👥 Following Feed'}
            </h2>

            {/* Feed Sort Tabs */}
            <div className="feed-sort-tabs">
              <button
                type="button"
                className={`feed-sort-tab ${activeSort === 'views' ? 'is-active' : ''}`}
                onClick={() => setActiveSort('views')}
              >
                👁️ Most Viewed
              </button>
              <button
                type="button"
                className={`feed-sort-tab ${activeSort === 'trending' ? 'is-active' : ''}`}
                onClick={() => setActiveSort('trending')}
              >
                🔥 Trending
              </button>
              <button
                type="button"
                className={`feed-sort-tab ${activeSort === 'newest' ? 'is-active' : ''}`}
                onClick={() => setActiveSort('newest')}
              >
                ⚡ Latest
              </button>
              <button
                type="button"
                className={`feed-sort-tab ${activeSort === 'popular' ? 'is-active' : ''}`}
                onClick={() => setActiveSort('popular')}
              >
                ❤️ Most Liked
              </button>
              {session?.token ? (
                <button
                  type="button"
                  className={`feed-sort-tab ${activeSort === 'following' ? 'is-active' : ''}`}
                  onClick={() => setActiveSort('following')}
                >
                  👥 Following
                </button>
              ) : null}
            </div>
          </div>

          {/* Main Feed Thought Posts Stream */}
          {loading ? (
            <FeedSkeleton count={4} />
          ) : thoughts.length ? (
            <div className="thought-grid">
              {thoughts.map((thought, idx) => (
                <div key={thought._id}>
                  <Reveal>
                    <div style={{ position: 'relative' }}>
                      {activeSort === 'trending' && idx < 3 ? (
                        <div className="trend-rank-badge">
                          {idx === 0 ? '🥇 #1 Trending' : idx === 1 ? '🥈 #2 Trending' : '🥉 #3 Trending'}
                        </div>
                      ) : null}
                      <ThoughtCard thought={thought} onDeleted={handleDeleted} />
                    </div>
                  </Reveal>

                  {/* Clean In-Feed Suggested Creators (Appears after 2nd post only if unfollowed creators exist) */}
                  {idx === 1 && <MobileSuggestedUsers />}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                background: 'var(--paper)',
                borderRadius: '20px',
                border: '1px solid var(--line)'
              }}
            >
              <p className="empty-state">No thoughts found in this view yet.</p>
              <div style={{ marginTop: '16px' }}>
                <Link href="/create" className="button">
                  ✍️ Be the First to Share a Thought
                </Link>
              </div>
            </div>
          )}

          {/* Community Topics Quick Explorer */}
          {categories.length ? (
            <div
              style={{
                marginTop: '28px',
                padding: '18px',
                background: 'var(--paper)',
                borderRadius: '20px',
                border: '1px solid var(--line)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--ink)' }}>
                  🏷️ Popular Topics
                </span>
                <Link href="/explore" style={{ fontSize: '0.78rem', color: 'var(--ember)', fontWeight: 700, textDecoration: 'none' }}>
                  Explore all →
                </Link>
              </div>
              <div className="category-row">
                {categories.slice(0, 8).map((cat) => (
                  <Link key={cat.slug} href={`/explore?category=${cat.slug}`} className="category-pill">
                    #{cat.name} ({cat.thoughtCount || 0})
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* =========================================================
            RIGHT SIDEBAR RAIL (SUGGESTED CREATORS & PROFILE SWITCH)
        ========================================================= */}
        <InstagramRightRail />
      </div>
    </div>
  );
}

