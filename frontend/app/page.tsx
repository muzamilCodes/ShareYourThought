'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { Reveal } from '../components/Reveal';
import { ThoughtCard } from '../components/ThoughtCard';
import { api } from '../lib/api';
import { demoCategories, demoStats, demoThoughts } from '../lib/demo';
import type { Category, Thought } from '../types';

export default function HomePage() {
  const [thoughts, setThoughts] = useState<Thought[]>(demoThoughts as Thought[]);
  const [trending, setTrending] = useState<Thought[]>(demoThoughts.slice(0, 3) as Thought[]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.allSettled([api.getThoughts({ limit: 6 }), api.trendingThoughts(), api.listCategories()]).then(([feed, trend, cats]) => {
      if (feed.status === 'fulfilled' && feed.value.thoughts.length) setThoughts(feed.value.thoughts);
      if (trend.status === 'fulfilled' && trend.value.thoughts.length) setTrending(trend.value.thoughts);
      if (cats.status === 'fulfilled' && cats.value.categories.length) setCategories(cats.value.categories);
    });
  }, []);

  const displayCategories = categories.length ? categories : demoCategories.map((name) => ({ _id: name, name, slug: name.toLowerCase(), description: `${name} conversations`, accent: 'neutral', thoughtCount: 0 }));

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-grid">
          <Reveal>
            <div className="hero-panel">
              <div className="hero-top">
                <div className="hero-kicker"><span className="brand-mark" /> A calm editorial space for public thought</div>
                <div className="pill">Real users · real ideas</div>
              </div>
              <div>
                <h1 className="hero-headline">Share your thoughts. Let ideas travel.</h1>
                <p className="hero-copy">ThoughtShare is a premium social platform where people publish short posts, discover new perspectives, and connect through conversation without the noise of a generic social feed.</p>
                <div className="hero-actions">
                  <Link href="/create" className="button">Share a Thought</Link>
                  <Link href="/explore" className="button-outline">Explore Thoughts</Link>
                </div>
              </div>
              <div className="hero-stat-grid">
                {demoStats.map((stat) => (
                  <div className="stat-card" key={stat.label}>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="hero-side">
              <div className="side-card">
                <div className="mono">Manifesto</div>
                <h2 className="display-title" style={{ fontSize: '2.2rem', maxWidth: '10ch' }}>Thoughts deserve better framing.</h2>
                <p className="section-copy">Everyone has something worth saying. Share thoughts without unnecessary complexity. Discover different perspectives. Connect through ideas.</p>
              </div>
              <div className="side-card side-stack">
                <div className="minicard"><div><h3 className="minicard-title">Share</h3><p className="minicard-copy">Publish honest posts, reflections, and quick ideas.</p></div><span className="pill">01</span></div>
                <div className="minicard"><div><h3 className="minicard-title">Discover</h3><p className="minicard-copy">Explore thoughts from people with different viewpoints.</p></div><span className="pill">02</span></div>
                <div className="minicard"><div><h3 className="minicard-title">Connect</h3><p className="minicard-copy">Like, comment, follow, save, and keep the conversation moving.</p></div><span className="pill">03</span></div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-dark">
        <div className="container">
          <SectionHeading eyebrow="Editorial panels" title="Three ways to move through the platform." copy="A familiar Halden-like rhythm: deliberate spacing, quiet typography, and a premium editorial flow." />
          <div className="panel-grid">
            <div className="panel"><div className="panel-number">Panel 01</div><h3 className="panel-title">Share</h3><p className="section-copy">Users can publish thoughts, ideas, opinions, and short posts with optional images and hashtags.</p></div>
            <div className="panel"><div className="panel-number">Panel 02</div><h3 className="panel-title">Discover</h3><p className="section-copy">Explore thoughts from other people, browse categories, and search by topic or keyword.</p></div>
            <div className="panel"><div className="panel-number">Panel 03</div><h3 className="panel-title">Connect</h3><p className="section-copy">Like, comment, reply, follow, save, and receive notifications when conversation continues.</p></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Thought showcase" title="Real posts, composed like magazine spreads." copy="Minimal cards keep the writing and the author first, while the interface stays calm and premium." />
          <div className="thought-grid">
            {thoughts.map((thought) => <Reveal key={thought._id}><ThoughtCard thought={thought} /></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section-dark">
        <div className="container">
          <div className="community-card">
            <div className="section-top">
              <div>
                <div className="mono">Community</div>
                <h2 className="display-title display-title-xl">10K+ people sharing ideas.</h2>
              </div>
              <Link href="/register" className="button-light">Join the conversation</Link>
            </div>
            <div className="metrics-row">
              <div><div className="metric-number">42K</div><div className="metric-label">Thoughts shared</div></div>
              <div><div className="metric-number">8.1K</div><div className="metric-label">Active users</div></div>
              <div><div className="metric-number">17K</div><div className="metric-label">Comments posted</div></div>
              <div><div className="metric-number">1.4K</div><div className="metric-label">Communities sparked</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Explore" title="Topics that shape the conversation." copy="Browse the categories people return to when they want a specific kind of thought." />
          <div className="category-grid">
            {displayCategories.map((category) => (
              <Link key={category.slug} className="category-card" href={`/explore?category=${category.slug}`}>
                <h3 className="category-title">{category.name}</h3>
                <p className="category-copy">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-dark">
        <div className="container">
          <SectionHeading eyebrow="Trending thoughts" title="What people are reading right now." copy="Trending is based on likes, comments, shares, and recent activity." />
          <div className="list-grid">
            {trending.map((thought) => <Reveal key={thought._id}><ThoughtCard thought={thought} compact /></Reveal>)}
          </div>
        </div>
      </section>
    </div>
  );
}
