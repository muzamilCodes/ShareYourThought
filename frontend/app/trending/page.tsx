'use client';

import { useEffect, useState } from 'react';
import { SectionHeading } from '../../components/SectionHeading';
import { ThoughtCard } from '../../components/ThoughtCard';
import { api } from '../../lib/api';
import { demoThoughts } from '../../lib/demo';
import type { Thought } from '../../types';

export default function TrendingPage() {
  const [thoughts, setThoughts] = useState<Thought[]>(demoThoughts.slice(0, 3) as Thought[]);

  useEffect(() => {
    api.trendingThoughts().then((data) => {
      if (data.thoughts.length) setThoughts(data.thoughts);
    }).catch(() => undefined);
  }, []);

  return (
    <div className="page container">
      <section className="explore-hero">
        <div className="mono">Trending</div>
        <h1 className="display-title display-title-xl">The thoughts people are returning to right now.</h1>
        <p className="section-copy section-copy-lg">Trending is built from likes, comments, shares, and recent activity so the page feels alive rather than algorithmic.</p>
      </section>
      <section className="section-dark">
        <div className="container">
          <SectionHeading eyebrow="Top momentum" title="Currently popular thoughts." />
          <div className="list-grid">
            {thoughts.map((thought, index) => (
              <div key={thought._id} className="trend-card">
                <div className="mono">Rank 0{index + 1}</div>
                <ThoughtCard thought={thought} compact />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
