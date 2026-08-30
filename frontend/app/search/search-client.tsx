'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThoughtCard } from '@/components/ThoughtCard';
import { api } from '@/lib/api';
import type { Category, HashtagSummary, Thought, User } from '@/types';

const RECENT_SEARCHES_KEY = 'thoughtshare_recent_searches';

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'thoughts' | 'creators' | 'hashtags' | 'categories'>('all');
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingTags, setTrendingTags] = useState<HashtagSummary[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // ignore
    }

    api.getTrendingHashtags().then((res) => {
      if (res?.hashtags) setTrendingTags(res.hashtags);
    }).catch(() => {});
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const runSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearched(true);
    saveRecentSearch(trimmed);

    try {
      const res = await api.universalSearch(trimmed);
      setThoughts(res.thoughts || []);
      setUsers(res.users || []);
      setHashtags(res.hashtags || []);
      setCategories(res.categories || []);
    } catch {
      // fallback
      try {
        const [thoughtResults, userResults] = await Promise.allSettled([
          api.searchThoughts(trimmed),
          api.searchUsers(trimmed)
        ]);
        if (thoughtResults.status === 'fulfilled') setThoughts(thoughtResults.value.thoughts || []);
        if (userResults.status === 'fulfilled') setUsers(userResults.value.users || []);
      } catch {
        // ignore
      }
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
    const cleanTag = tag.replace(/^#/, '');
    setQuery(cleanTag);
    runSearch(cleanTag);
  };

  const totalResults = thoughts.length + users.length + hashtags.length + categories.length;

  return (
    <div className="page container" style={{ maxWidth: '680px', margin: '20px auto 60px', padding: '0 16px' }}>
      {/* Search Header & Input Bar */}
      <section style={{ marginBottom: '20px' }}>
        <h1 className="display-title" style={{ fontSize: '1.75rem', marginBottom: '14px', color: 'var(--ink)' }}>
          🔍 Universal Search
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
            placeholder="Search thoughts, creators, #hashtags, categories…"
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
              onClick={() => {
                setQuery('');
                setSearched(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ✕
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.84rem' }}>
            Search
          </button>
        </form>
      </section>

      {/* Recent Searches */}
      {!searched && recentSearches.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🕒 Recent Searches
            </span>
            <button
              type="button"
              onClick={clearRecentSearches}
              style={{ background: 'none', border: 'none', fontSize: '0.74rem', color: 'var(--ember)', cursor: 'pointer', fontWeight: 600 }}
            >
              Clear
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  runSearch(term);
                }}
                style={{
                  background: 'var(--dark-soft)',
                  border: '1px solid var(--line)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.80rem',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Hashtags Spotlight */}
      {!searched && trendingTags.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
            🔥 Trending Topics & Hashtags
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {trendingTags.map((h) => (
              <button
                key={h.tag}
                type="button"
                onClick={() => handleTagClick(h.tag)}
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>#{h.tag}</span>
                <span style={{ fontSize: '0.70rem', color: 'var(--muted)', fontWeight: 500 }}>
                  ({h.count} {h.count === 1 ? 'post' : 'posts'})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {searched && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--line)'
          }}
        >
          {[
            { id: 'all', label: `All (${totalResults})` },
            { id: 'thoughts', label: `Thoughts (${thoughts.length})` },
            { id: 'creators', label: `Creators (${users.length})` },
            { id: 'hashtags', label: `Hashtags (${hashtags.length})` },
            { id: 'categories', label: `Categories (${categories.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'var(--ember)' : 'var(--dark-soft)',
                color: activeTab === tab.id ? '#ffffff' : 'var(--muted)',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.80rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 120ms ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Results Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔎</div>
          <p style={{ fontWeight: 600 }}>Searching across thoughts and creators...</p>
        </div>
      ) : searched && totalResults === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🍃</div>
          <h3>No matches found for "{query}"</h3>
          <p style={{ fontSize: '0.88rem' }}>Try searching for a different keyword, creator name, or topic.</p>
        </div>
      ) : (
        <div>
          {/* Creators Section */}
          {(activeTab === 'all' || activeTab === 'creators') && users.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px 0' }}>👤 Creators</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {users.map((u) => (
                  <Link
                    key={u._id || u.username}
                    href={`/profile/${u.username}`}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      background: 'var(--paper)',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <img
                      src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.name}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>@{u.username}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags Section */}
          {(activeTab === 'all' || activeTab === 'hashtags') && hashtags.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px 0' }}>#️⃣ Hashtags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {hashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    style={{
                      background: 'var(--paper)',
                      border: '1px solid var(--line)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'var(--ember)',
                      cursor: 'pointer'
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories Section */}
          {(activeTab === 'all' || activeTab === 'categories') && categories.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px 0' }}>🏷️ Categories</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    style={{
                      textDecoration: 'none',
                      background: 'var(--paper)',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'var(--ink)'
                    }}
                  >
                    #{cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Thoughts Section */}
          {(activeTab === 'all' || activeTab === 'thoughts') && thoughts.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px 0' }}>✍️ Thoughts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {thoughts.map((thought) => (
                  <ThoughtCard key={thought._id} thought={thought} onDeleted={handleDeleted} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
