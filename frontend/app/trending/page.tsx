'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '@/components/SectionHeading';
import { ThoughtCard } from '@/components/ThoughtCard';
import { api } from '@/lib/api';
import type { Thought } from '@/types';

export default function TrendingPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trendingThoughts()
      .then((data) => {
        setThoughts(data.thoughts || []);
      })
      .catch(() => setThoughts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleted = (deletedId: string) => {
    setThoughts((current) => current.filter((t) => t._id !== deletedId));
  };

  return (
    <div className="page container" style={{ maxWidth: '650px' }}>
      {/* Clean Trending Header */}
      <div style={{ marginBottom: '20px' }}>
        <div className="hero-kicker" style={{ marginBottom: '6px', fontSize: '0.82rem' }}>
          🔥 Trending Leaderboard
        </div>
        <h1 className="display-title" style={{ fontSize: '1.75rem', margin: '0 0 6px 0', color: 'var(--ink)' }}>
          Top Ranked Thoughts Right Now
        </h1>
        <p className="section-copy" style={{ margin: 0, fontSize: '0.90rem' }}>
          Calculated in real-time based on Likes, Comments, Saves, and Views.
        </p>
      </div>

      {/* Leaderboard List */}
      <section style={{ marginTop: '12px' }}>
        {thoughts.length ? (
          <div className="list-grid">
            {thoughts.map((thought, index) => {
              const badge =
                index === 0
                  ? '🥇 #1 Trending'
                  : index === 1
                  ? '🥈 #2 Trending'
                  : index === 2
                  ? '🥉 #3 Trending'
                  : `Rank #${index + 1}`;
              return (
                <div key={thought._id} className="trend-card" style={{ position: 'relative' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        color: index < 3 ? 'var(--ember)' : 'var(--muted)',
                        fontWeight: 800,
                        fontSize: '0.92rem'
                      }}
                    >
                      {badge}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {(thought.likes?.length || 0) +
                        (thought.commentsCount || 0) +
                        (thought.sharesCount || 0)}{' '}
                      Reactions
                    </span>
                  </div>
                  <ThoughtCard thought={thought} onDeleted={handleDeleted} />
                </div>
              );
            })}
          </div>
        ) : !loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              background: 'var(--paper)',
              borderRadius: '20px',
              border: '1px solid var(--line)'
            }}
          >
            <p className="empty-state">
              No trending thoughts yet. Publish, like, or comment on thoughts to see them trend!
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link href="/create" className="button">
                ✍️ Share a Thought
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

