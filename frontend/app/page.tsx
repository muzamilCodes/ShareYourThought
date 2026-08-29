'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { Reveal } from '../components/Reveal';
import { ThoughtCard } from '../components/ThoughtCard';
import { api } from '../lib/api';
import type { Category, Thought } from '../types';

export default function HomePage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<'trending' | 'newest' | 'popular'>('trending');

  const fetchFeed = (sortMode: 'trending' | 'newest' | 'popular') => {
    setLoading(true);
    api.getThoughts({ sort: sortMode, limit: 12 })
      .then((feed) => {
        setThoughts(feed.thoughts || []);
        setTotalCount(feed.total || 0);
      })
      .catch(() => setThoughts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeed(activeSort);
  }, [activeSort]);

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
      <section className="hero">
        <div className="container hero-grid">
          <Reveal>
            <div className="hero-panel">
              <div className="hero-top">
                <div className="hero-kicker">
                  <span className="brand-mark" /> A calm editorial space for public thought
                </div>
                <div className="pill">Public Thoughts · Real Discussions</div>
              </div>
              <div>
                <h1 className="hero-headline">Share your thoughts. Let ideas travel.</h1>
                <p className="hero-copy">
                  ThoughtShare is an authentic publishing platform where people share reflections, discover new
                  perspectives, and connect through thoughtful conversation.
                </p>
                <div className="hero-actions" style={{ marginTop: '20px' }}>
                  <Link href="/create" className="button">
                    ✍️ Share a Thought
                  </Link>
                  <Link href="/trending" className="button-outline">
                    🔥 View Trending
                  </Link>
                </div>
              </div>
              <div className="hero-stat-grid">
                <div className="stat-card">
                  <div className="stat-value">{totalCount}</div>
                  <div className="stat-label">Published Thoughts</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{categories.length}</div>
                  <div className="stat-label">Active Topics</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">100%</div>
                  <div className="stat-label">Real Engagement</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="hero-side">
              <div className="side-card">
                <div className="mono">Trending Dynamics</div>
                <h2 className="display-title" style={{ fontSize: '2.2rem', maxWidth: '10ch' }}>
                  What's gaining momentum.
                </h2>
                <p className="section-copy">
                  Thoughts with higher likes, comments, and views dynamically rise to the top of the feed and trending charts.
                </p>
              </div>
              <div className="side-card side-stack">
                <div className="minicard">
                  <div>
                    <h3 className="minicard-title">🔥 Likes & Reactions</h3>
                    <p className="minicard-copy">Direct engagement boosts rank & visibility across the community.</p>
                  </div>
                  <span className="pill">01</span>
                </div>
                <div className="minicard">
                  <div>
                    <h3 className="minicard-title">💬 Deep Discussions</h3>
                    <p className="minicard-copy">Active comment sections keep thoughts alive & trending.</p>
                  </div>
                  <span className="pill">02</span>
                </div>
                <div className="minicard">
                  <div>
                    <h3 className="minicard-title">👁️ Views & Impressions</h3>
                    <p className="minicard-copy">Real-time readership metrics track what people are returning to.</p>
                  </div>
                  <span className="pill">03</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Main Thought Feed Showcase with Sorting Tabs */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div className="mono" style={{ color: 'var(--ember)', fontWeight: 700 }}>Thought Showcase</div>
              <h2 className="display-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', margin: '4px 0 0' }}>
                {activeSort === 'trending' ? '🔥 Trending & Most Engaging' : activeSort === 'popular' ? '🏆 Most Popular All-Time' : '⚡ Latest Published Thoughts'}
              </h2>
            </div>

            {/* Feed Sort Tabs */}
            <div className="feed-sort-tabs">
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
                🏆 Most Liked
              </button>
            </div>
          </div>

          {thoughts.length ? (
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
          ) : !loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p className="empty-state">No thoughts found in this view yet.</p>
              <div style={{ marginTop: '16px' }}>
                <Link href="/create" className="button">
                  ✍️ Be the First to Share a Thought
                </Link>
              </div>
            </div>
          ) : null}
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

