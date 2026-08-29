'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { Reveal } from '../components/Reveal';
import { ThoughtCard } from '../components/ThoughtCard';
import { FeedSkeleton } from '../components/SkeletonLoader';
import { StoryTray } from '../components/StoryTray';
import { useSession } from '../hooks/useSession';
import { api } from '../lib/api';
import type { Category, Thought } from '../types';

export default function HomePage() {
  const { session } = useSession();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<'following' | 'trending' | 'newest' | 'popular'>('trending');

  const fetchFeed = (sortMode: 'following' | 'trending' | 'newest' | 'popular') => {
    setLoading(true);
    api.getThoughts({ sort: sortMode, limit: 16 }, session?.token)
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
      {/* Instagram-Style Story Sparks Tray */}
      <div className="container" style={{ maxWidth: '650px', marginTop: '12px' }}>
        <StoryTray thoughts={thoughts} />
      </div>

      {/* Mobile Quick Create Banner */}
      <div className="container mobile-only" style={{ marginBottom: '16px' }}>
        <Link
          href="/create"
          className="note-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '16px',
            textDecoration: 'none',
            color: 'inherit',
            background: 'var(--paper)',
            boxShadow: 'var(--shadow)'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>✍️</span>
          <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--muted)' }}>
            What's on your mind? Share a thought…
          </div>
          <span className="button" style={{ fontSize: '0.78rem', padding: '6px 12px', minHeight: 'auto' }}>
            Post
          </span>
        </Link>
      </div>

      {/* Main Thought Feed Showcase with Sorting Tabs */}
      <section className="section">
        <div className="container" style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <h2 className="display-title" style={{ fontSize: '1.4rem', margin: 0 }}>
              {activeSort === 'following' ? '👥 Following Feed' : activeSort === 'trending' ? '🔥 Trending Feed' : activeSort === 'popular' ? '🏆 Most Liked' : '⚡ Latest Feed'}
            </h2>

            {/* Feed Sort Tabs */}
            <div className="feed-sort-tabs">
              {session?.token ? (
                <button
                  type="button"
                  className={`feed-sort-tab ${activeSort === 'following' ? 'is-active' : ''}`}
                  onClick={() => setActiveSort('following')}
                >
                  👥 Following
                </button>
              ) : null}
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
                🏆 Liked
              </button>
            </div>
          </div>

          {loading ? (
            <FeedSkeleton count={4} />
          ) : thoughts.length ? (
            <div className="thought-grid">
              {thoughts.map((thought, idx) => (
                <Reveal key={thought._id}>
                  <div style={{ position: 'relative' }}>
                    {activeSort === 'trending' && idx < 3 ? (
                      <div className="trend-rank-badge">
                        {idx === 0 ? '🥇 #1 Trending' : idx === 1 ? '🥈 #2 Trending' : '🥉 #3 Trending'}
                      </div>
                    ) : null}
                    <ThoughtCard thought={thought} onDeleted={handleDeleted} />
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', background: 'var(--paper)', borderRadius: '16px', border: '1px solid var(--line)' }}>
              <p className="empty-state">No thoughts found in this view yet.</p>
              <div style={{ marginTop: '16px' }}>
                <Link href="/create" className="button">
                  ✍️ Be the First to Share a Thought
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Community Categories */}
      <section className="section">
        <div className="container">
          <div className="community-card">
            <div className="section-top">
              <div>
                <div className="mono">Community Topics</div>
                <h2 className="display-title display-title-xl">Explore perspectives across categories.</h2>
              </div>
              <Link href="/create" className="button">
                ✍️ Share a Thought
              </Link>
            </div>
            {categories.length ? (
              <div className="category-row" style={{ marginTop: '24px' }}>
                {categories.map((cat) => (
                  <Link key={cat.slug} href={`/explore?category=${cat.slug}`} className="category-pill">
                    #{cat.name} ({cat.thoughtCount || 0})
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

