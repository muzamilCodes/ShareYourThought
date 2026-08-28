'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '../../components/SectionHeading';
import { ThoughtCard } from '../../components/ThoughtCard';
import { api } from '../../lib/api';
import type { Category, Thought } from '../../types';

export default function ExplorePage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.listCategories(), api.exploreThoughts()])
      .then(([cats, feed]) => {
        if (cats.status === 'fulfilled' && cats.value.categories?.length) {
          setCategories(cats.value.categories);
        }
        if (feed.status === 'fulfilled' && feed.value.thoughts?.length) {
          setThoughts(feed.value.thoughts);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const visibleThoughts = active === 'all' ? thoughts : thoughts.filter((thought) => thought.category === active);

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
    <div className="page container">
      <section className="explore-hero">
        <div className="mono">Explore Topics</div>
        <h1 className="display-title display-title-xl">Browse the topics that shape the conversation.</h1>
        <p className="section-copy section-copy-lg">
          Filter by category to explore perspectives on life, technology, motivation, education, business, creativity, and more.
        </p>
        <div className="category-row">
          <button
            className={`category-pill ${active === 'all' ? 'is-active' : ''}`}
            onClick={() => setActive('all')}
          >
            All ({thoughts.length})
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              className={`category-pill ${active === category.slug ? 'is-active' : ''}`}
              onClick={() => setActive(category.slug)}
            >
              {category.name} ({category.thoughtCount || 0})
            </button>
          ))}
        </div>
      </section>

      {categories.length ? (
        <section className="section">
          <SectionHeading eyebrow="Category Landscape" title="Topics with room to breathe." />
          <div className="category-grid">
            {categories.map((category) => (
              <div
                key={category.slug}
                className="category-card"
                style={{
                  cursor: 'pointer',
                  border: active === category.slug ? '1px solid var(--ember)' : undefined
                }}
                onClick={() => handleCategorySelect(category.slug)}
              >
                <div className="mono">#{category.slug}</div>
                <h3 className="category-title">{category.name}</h3>
                <p className="category-copy">{category.description}</p>
                <div style={{ marginTop: '12px' }}>
                  <span className="pill">{category.thoughtCount || 0} thoughts</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-dark" id="explore-feed">
        <div className="container">
          <SectionHeading
            eyebrow="Explore Feed"
            title={active === 'all' ? 'All Published Thoughts' : `Thoughts on #${active.toUpperCase()}`}
          />
          {visibleThoughts.length ? (
            <div className="thought-grid">
              {visibleThoughts.map((thought) => (
                <ThoughtCard key={thought._id} thought={thought} onDeleted={handleThoughtDeleted} />
              ))}
            </div>
          ) : !loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p className="empty-state">
                {active === 'all'
                  ? 'No thoughts have been published yet.'
                  : `No thoughts published under #${active} yet.`}
              </p>
              <div style={{ marginTop: '16px' }}>
                <Link href="/create" className="button">
                  Publish a Thought
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
