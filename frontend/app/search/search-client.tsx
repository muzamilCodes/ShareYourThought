'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThoughtCard } from '@/components/ThoughtCard';
import { api } from '@/lib/api';
import type { Thought, User } from '@/types';

const POPULAR_TAGS = ['life', 'technology', 'mindset', 'creativity', 'motivation', 'education', 'business', 'growth'];

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'thoughts' | 'people'>('all');
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const runSearch = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [thoughtResults, userResults] = await Promise.allSettled([
        api.searchThoughts(term),
        api.searchUsers(term)
      ]);
      if (thoughtResults.status === 'fulfilled') setThoughts(thoughtResults.value.thoughts || []);
      if (userResults.status === 'fulfilled') setUsers(userResults.value.users || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || initialQuery;
      if (q) {
        setQuery(q);
        runSearch(q).catch(() => undefined);
      }
    }
  }, [initialQuery]);

  const handleDeleted = (deletedId: string) => {
    setThoughts((current) => current.filter((t) => t._id !== deletedId));
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    runSearch(tag);
  };

  return (
    <div className="page container" style={{ maxWidth: '650px' }}>
      {/* Search Header & Input Bar */}
      <section style={{ marginBottom: '24px' }}>
        <h1 className="display-title" style={{ fontSize: '1.75rem', marginBottom: '14px', color: 'var(--ink)' }}>
          🔍 Search Share Your Thoughts
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--paper)',
            border: '1.5px solid var(--line-strong)',
            borderRadius: '999px',
            padding: '6px 14px',
            boxShadow: 'var(--shadow)',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '1.1rem', color: 'var(--muted)' }}>🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search thoughts, authors, or #hashtags…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.96rem',
              color: 'var(--ink)'
            }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '4px'
              }}
            >
              ✕
            </button>
          ) : null}
          <button
            type="submit"
            className="button"
            style={{ minHeight: '36px', padding: '0 16px', fontSize: '0.86rem' }}
            disabled={loading}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {/* Popular Tags Quick Filters */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Suggested:</span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="category-pill"
              style={{
                fontSize: '0.76rem',
                padding: '4px 10px',
                cursor: 'pointer',
                background: query.toLowerCase() === tag ? 'rgba(200, 109, 52, 0.15)' : 'var(--paper)',
                color: query.toLowerCase() === tag ? 'var(--ember)' : 'var(--ink)'
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {/* Filter Tabs */}
      {searched ? (
        <div
          className="feed-sort-tabs"
          style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}
        >
          <button
            type="button"
            className={`feed-sort-tab ${activeTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{ flex: 1 }}
          >
            ⚡ All ({thoughts.length + users.length})
          </button>
          <button
            type="button"
            className={`feed-sort-tab ${activeTab === 'thoughts' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('thoughts')}
            style={{ flex: 1 }}
          >
            ✍️ Thoughts ({thoughts.length})
          </button>
          <button
            type="button"
            className={`feed-sort-tab ${activeTab === 'people' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('people')}
            style={{ flex: 1 }}
          >
            👥 People ({users.length})
          </button>
        </div>
      ) : null}

      {/* Search Results Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p className="empty-state">Searching across Share Your Thoughts…</p>
        </div>
      ) : !searched ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--paper)', borderRadius: '20px', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🔎</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>
            Search anything on Share Your Thoughts
          </h3>
          <p className="section-copy" style={{ margin: '0 auto', fontSize: '0.9rem', maxWidth: '38ch' }}>
            Type a username, keyword, phrase, or tap on suggested hashtags to discover insights.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* People Section */}
          {(activeTab === 'all' || activeTab === 'people') && users.length ? (
            <div>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  People ({users.length})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {users.map((user) => {
                  const uAvatar =
                    user.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;
                  return (
                    <div
                      key={user.username}
                      className="note-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: '16px',
                        background: 'var(--paper)',
                        border: '1px solid var(--line)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <img
                          src={uAvatar}
                          alt={user.name}
                          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <Link
                            href={`/profile/${user.username}`}
                            style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '0.96rem', textDecoration: 'none' }}
                          >
                            {user.name}
                          </Link>
                          <div style={{ fontSize: '0.80rem', color: 'var(--muted)' }}>@{user.username}</div>
                          {user.bio ? (
                            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                              {user.bio}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <Link href={`/profile/${user.username}`} className="button" style={{ fontSize: '0.80rem', padding: '6px 14px', minHeight: 'auto' }}>
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Thoughts Section */}
          {(activeTab === 'all' || activeTab === 'thoughts') && (
            <div>
              {activeTab === 'all' && users.length && thoughts.length ? (
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                    Thoughts ({thoughts.length})
                  </h3>
                </div>
              ) : null}

              {thoughts.length ? (
                <div className="thought-grid">
                  {thoughts.map((thought) => (
                    <ThoughtCard key={thought._id} thought={thought} onDeleted={handleDeleted} />
                  ))}
                </div>
              ) : activeTab === 'thoughts' ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', background: 'var(--paper)', borderRadius: '16px', border: '1px solid var(--line)' }}>
                  <p className="empty-state" style={{ margin: 0 }}>No thoughts matched "{query}".</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Empty Results Case */}
          {!thoughts.length && !users.length ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--paper)', borderRadius: '20px', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '2.4rem', display: 'block', marginBottom: '8px' }}>🍃</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>
                No results found
              </h3>
              <p className="section-copy" style={{ margin: '0 auto', fontSize: '0.9rem', maxWidth: '38ch' }}>
                We couldn't find any thoughts or people matching "{query}". Try another keyword or hashtag.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
