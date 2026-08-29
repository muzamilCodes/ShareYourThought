'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '@/components/SectionHeading';
import { ThoughtCard } from '@/components/ThoughtCard';
import { api } from '@/lib/api';
import type { Category, Thought } from '@/types';

export default function ExplorePage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.listCategories(), api.exploreThoughts()])
      .then(([cats, feed]) => {
        if (cats.status === 'fulfilled' && cats.value?.categories) {
          setCategories(cats.value.categories);
        }
        if (feed.status === 'fulfilled' && feed.value?.thoughts) {
          setThoughts(feed.value.thoughts);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleThoughts =
    active === 'all'
      ? thoughts
      : thoughts.filter((thought) => thought.category?.toLowerCase() === active.toLowerCase());

  const handleCategorySelect = (slug: string) => {
    setActive(slug);
    const feedElement = document.getElementById('explore-feed');
    if (feedElement) {
      feedElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleThoughtDeleted = (deletedId: string) => {
    setThoughts((current) => current.filter((t) => t._id !== deletedId));
  };

  return (
    <div className="page container" style={{ maxWidth: '650px' }}>
      {/* Clean Explore Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="display-title" style={{ fontSize: '1.75rem', margin: '0 0 6px 0', color: 'var(--ink)' }}>
          {active === 'all' ? 'All Published Thoughts' : `Thoughts in #${active.toUpperCase()}`}
        </h1>
        <p className="section-copy" style={{ margin: 0, fontSize: '0.90rem' }}>
          Explore ideas and conversations shared across categories.
        </p>

        {/* Category Filter Pills */}
        <div className="category-row" style={{ marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            type="button"
            className={`category-pill ${active === 'all' ? 'is-active' : ''}`}
            onClick={() => setActive('all')}
          >
            All ({thoughts.length})
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.slug}
              className={`category-pill ${active === category.slug ? 'is-active' : ''}`}
              onClick={() => setActive(category.slug)}
            >
              #{category.name} ({category.thoughtCount || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      <section id="explore-feed" style={{ marginTop: '12px' }}>
        {visibleThoughts.length ? (
          <div className="thought-grid">
            {visibleThoughts.map((thought) => (
              <ThoughtCard key={thought._id} thought={thought} onDeleted={handleThoughtDeleted} />
            ))}
          </div>
        ) : !loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', background: 'var(--paper)', borderRadius: '20px', border: '1px solid var(--line)' }}>
            <p className="empty-state">
              {active === 'all'
                ? 'No thoughts have been published yet.'
                : `No thoughts published under #${active} yet.`}
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link href="/create" className="button">
                ✍️ Publish a Thought
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
