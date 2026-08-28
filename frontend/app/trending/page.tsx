'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '../../components/SectionHeading';
import { ThoughtCard } from '../../components/ThoughtCard';
import { api } from '../../lib/api';
import type { Thought } from '../../types';

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
        <div className="mono">Trending</div>
        <h1 className="display-title display-title-xl">The thoughts people are returning to right now.</h1>
        <p className="section-copy section-copy-lg">
          Trending is dynamically computed from likes, comments, shares, and recent activity so discussions feel alive.
        </p>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Top Momentum" title="Currently Popular Thoughts" />
          {thoughts.length ? (
            <div className="list-grid">
              {thoughts.map((thought, index) => (
                <div key={thought._id} className="trend-card">
                  <div className="mono" style={{ color: 'var(--ember)', fontWeight: 700 }}>Rank #{index + 1}</div>
                  <ThoughtCard thought={thought} compact onDeleted={handleDeleted} />
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p className="empty-state">No trending thoughts yet. Publish and interact with thoughts to see them trend.</p>
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
