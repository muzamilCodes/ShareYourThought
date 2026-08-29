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
    <div className="page container">
      <section className="explore-hero">
        <div className="hero-kicker" style={{ marginBottom: '10px' }}>
          🔥 Live Algorithm
        </div>
        <h1 className="display-title display-title-xl">Thoughts with the highest momentum.</h1>
        <p className="section-copy section-copy-lg">
          Calculated in real-time based on Likes, Comments, Saves, Shares, and Views. The most active discussions rise to the top.
        </p>

        {/* Trending Dynamics Pillars */}
        <div className="panel-grid" style={{ marginTop: '24px', textAlign: 'left' }}>
          <div className="note-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div className="mono">01 · Likes & Reactions</div>
              <span className="pill">5x Boost</span>
            </div>
            <p className="note-copy">Direct likes and interactions boost rank & visibility across the community.</p>
          </div>
          <div className="note-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div className="mono">02 · Deep Discussions</div>
              <span className="pill">4x Boost</span>
            </div>
            <p className="note-copy">Active comment sections and debates keep thoughts alive & trending.</p>
          </div>
          <div className="note-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div className="mono">03 · Views & Impressions</div>
              <span className="pill">Real Views</span>
            </div>
            <p className="note-copy">Real-time readership metrics track what people are actively returning to.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Momentum Leaderboard" title="Top Ranked Thoughts Right Now" />
          {thoughts.length ? (
            <div className="list-grid">
              {thoughts.map((thought, index) => {
                const badge = index === 0 ? '🥇 #1 Trending' : index === 1 ? '🥈 #2 Trending' : index === 2 ? '🥉 #3 Trending' : `Rank #${index + 1}`;
                return (
                  <div key={thought._id} className="trend-card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className="mono" style={{ color: index < 3 ? 'var(--ember)' : 'var(--muted)', fontWeight: 800, fontSize: '0.92rem' }}>
                        {badge}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {(thought.likes?.length || 0) + (thought.commentsCount || 0) + (thought.sharesCount || 0)} Total Reactions
                      </span>
                    </div>
                    <ThoughtCard thought={thought} onDeleted={handleDeleted} />
                  </div>
                );
              })}
            </div>
          ) : !loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p className="empty-state">No trending thoughts yet. Publish, like, or comment on thoughts to see them trend!</p>
              <div style={{ marginTop: '16px' }}>
                <Link href="/create" className="button">
                  ✍️ Share a Thought
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

