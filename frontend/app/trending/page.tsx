'use client';

import { useEffect, useState } from 'react';
import { SectionHeading } from '../../components/SectionHeading';
import { ThoughtCard } from '../../components/ThoughtCard';
import { api } from '../../lib/api';
import { demoThoughts } from '../../lib/demo';
import type { Thought } from '../../types';

export default function TrendingPage() {
  const [thoughts, setThoughts] = useState<Thought[]>(demoThoughts.slice(0, 3) as Thought[]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trendingThoughts()
      .then((data) => {
        if (data.thoughts?.length) setThoughts(data.thoughts);
      })
      .catch(() => undefined)
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

      <section className="section-dark">
        <div className="container">
          <SectionHeading eyebrow="Top Momentum" title="Currently Popular Thoughts" />
          <div className="list-grid">
            {thoughts.map((thought, index) => (
              <div key={thought._id} className="trend-card">
                <div className="mono" style={{ color: 'var(--ember)', fontWeight: 600 }}>Rank #{index + 1}</div>
                <ThoughtCard thought={thought} compact onDeleted={handleDeleted} />
              </div>
            ))}
            {!thoughts.length && !loading ? (
              <p className="empty-state">No trending thoughts yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
