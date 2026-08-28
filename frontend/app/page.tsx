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

  useEffect(() => {
    Promise.allSettled([
      api.getThoughts({ limit: 6 }),
      api.listCategories()
    ])
      .then(([feed, cats]) => {
        if (feed.status === 'fulfilled') {
          setThoughts(feed.value.thoughts || []);
          setTotalCount(feed.value.total || 0);
        }
        if (cats.status === 'fulfilled' && cats.value.categories?.length) {
          setCategories(cats.value.categories);
        }
      })
      .finally(() => setLoading(false));
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
                <div className="hero-actions">
                  <Link href="/create" className="button">
                    Share a Thought
                  </Link>
                  <Link href="/explore" className="button-outline">
                    Explore Thoughts
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
                  <div className="stat-label">Real Data & Users</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="hero-side">
              <div className="side-card">
                <div className="mono">Manifesto</div>
                <h2 className="display-title" style={{ fontSize: '2.2rem', maxWidth: '10ch' }}>
                  Thoughts deserve better framing.
                </h2>
                <p className="section-copy">
                  Everyone has something worth saying. Share thoughts without unnecessary complexity. Discover different perspectives. Connect through ideas.
                </p>
              </div>
              <div className="side-card side-stack">
                <div className="minicard">
                  <div>
                    <h3 className="minicard-title">Share</h3>
                    <p className="minicard-copy">Publish honest posts, reflections, and quick ideas.</p>
                  </div>
                  <span className="pill">01</span>
                </div>
                <div className="minicard">
                  <div>
                    <h3 className="minicard-title">Discover</h3>
                    <p className="minicard-copy">Explore thoughts from people with different viewpoints.</p>
                  </div>
                  <span className="pill">02</span>
                </div>
                <div className="minicard">
                  <div>
                    <h3 className="minicard-title">Connect</h3>
                    <p className="minicard-copy">Like, comment, follow, save, and keep the conversation moving.</p>
                  </div>
                  <span className="pill">03</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-dark">
        <div className="container">
          <SectionHeading
            eyebrow="Editorial panels"
            title="Three ways to move through the platform."
            copy="Deliberate spacing, quiet typography, and a premium editorial flow."
          />
          <div className="panel-grid">
            <div className="panel">
              <div className="panel-number">Panel 01</div>
              <h3 className="panel-title">Share</h3>
              <p className="section-copy">
                Publish thoughts, ideas, opinions, and short posts with optional images and hashtags.
              </p>
            </div>
            <div className="panel">
              <div className="panel-number">Panel 02</div>
              <h3 className="panel-title">Discover</h3>
              <p className="section-copy">
                Explore thoughts from other people, browse categories, and search by topic or keyword.
              </p>
            </div>
            <div className="panel">
              <div className="panel-number">Panel 03</div>
              <h3 className="panel-title">Connect</h3>
              <p className="section-copy">
                Like, comment, reply, follow, save, and receive notifications when conversation continues.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Thought showcase"
            title="Recent thoughts published by the community."
            copy="Minimal cards keep the writing and the author first, while the interface stays calm and focused."
          />
          {thoughts.length ? (
            <div className="thought-grid">
              {thoughts.map((thought) => (
                <Reveal key={thought._id}>
                  <ThoughtCard thought={thought} onDeleted={handleDeleted} />
                </Reveal>
              ))}
            </div>
          ) : !loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p className="empty-state">No thoughts have been published yet.</p>
              <div style={{ marginTop: '16px' }}>
                <Link href="/create" className="button">
                  Be the First to Publish a Thought
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-dark">
        <div className="container">
          <div className="community-card">
            <div className="section-top">
              <div>
                <div className="mono">Community Topics</div>
                <h2 className="display-title display-title-xl">Explore perspectives across categories.</h2>
              </div>
              <Link href="/create" className="button">
                Share a Thought
              </Link>
            </div>
            {categories.length ? (
              <div className="category-row" style={{ marginTop: '24px' }}>
                {categories.map((cat) => (
                  <Link key={cat.slug} href="/explore" className="category-pill">
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
