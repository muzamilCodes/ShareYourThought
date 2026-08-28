'use client';

import { useEffect, useState } from 'react';
import { SectionHeading } from '../../components/SectionHeading';
import { ThoughtCard } from '../../components/ThoughtCard';
import { api } from '../../lib/api';
import { demoCategories, demoThoughts } from '../../lib/demo';
import type { Category, Thought } from '../../types';

export default function ExplorePage() {
  const [thoughts, setThoughts] = useState<Thought[]>(demoThoughts as Thought[]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState('all');

  useEffect(() => {
    Promise.allSettled([api.listCategories(), api.exploreThoughts()]).then(([cats, feed]) => {
      if (cats.status === 'fulfilled') setCategories(cats.value.categories);
      if (feed.status === 'fulfilled' && feed.value.thoughts.length) setThoughts(feed.value.thoughts);
    });
  }, []);

  const visibleThoughts = active === 'all' ? thoughts : thoughts.filter((thought) => thought.category === active);
  const categoryList = categories.length ? categories : demoCategories.map((name) => ({ _id: name, name, slug: name.toLowerCase(), description: `${name} conversations`, accent: 'neutral', thoughtCount: 0 }));

  return (
    <div className="page container">
      <section className="explore-hero">
        <div className="mono">Explore</div>
        <h1 className="display-title display-title-xl">Browse the topics that shape the conversation.</h1>
        <p className="section-copy section-copy-lg">The explore section keeps the structure editorial and the topics clear: life, technology, motivation, education, business, sports, travel, relationships, creativity, and more.</p>
        <div className="category-row">
          <button className={`category-pill ${active === 'all' ? 'is-active' : ''}`} onClick={() => setActive('all')}>All</button>
          {categoryList.map((category) => (
            <button key={category.slug} className={`category-pill ${active === category.slug ? 'is-active' : ''}`} onClick={() => setActive(category.slug)}>
              {category.name}
            </button>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHeading eyebrow="Category landscape" title="Topics with room to breathe." />
        <div className="category-grid">
          {categoryList.map((category) => (
            <div key={category.slug} className="category-card">
              <div className="mono">{category.slug}</div>
              <h3 className="category-title">{category.name}</h3>
              <p className="category-copy">{category.description}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section-dark">
        <div className="container">
          <SectionHeading eyebrow="Explore feed" title="Thoughts sorted by conversation." />
          <div className="thought-grid">
            {visibleThoughts.map((thought) => <ThoughtCard key={thought._id} thought={thought} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
