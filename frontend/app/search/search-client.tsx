'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '../../components/SectionHeading';
import { ThoughtCard } from '../../components/ThoughtCard';
import { api } from '../../lib/api';
import type { Thought, User } from '../../types';

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
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

  return (
    <div className="page container">
      <section className="explore-hero">
        <div className="mono">Search</div>
        <h1 className="display-title display-title-xl">Find people, thoughts, and hashtags.</h1>
        <form
          className="search-bar"
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(query);
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by keywords, usernames, or hashtags…"
            aria-label="Search"
          />
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </section>

      <section className="section">
        <SectionHeading eyebrow="People" title="Users matching your search." />
        <div className="list-grid">
          {users.map((user) => (
            <Link key={user.username} className="explore-card" href={`/profile/${user.username}`}>
              <div className="brand-lockup">
                <img
                  className="avatar"
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
                  }
                  alt={user.name}
                />
                <div>
                  <h3 className="card-title">{user.name}</h3>
                  <div className="meta">@{user.username}</div>
                </div>
              </div>
              <p className="card-copy" style={{ marginTop: '10px' }}>{user.bio || 'Thinking in public.'}</p>
            </Link>
          ))}
          {searched && !users.length && !loading ? (
            <p className="empty-state">No users matched "{query}".</p>
          ) : !searched ? (
            <p className="empty-state">Search usernames or names to see profile matches.</p>
          ) : null}
        </div>
      </section>

      <section className="section-dark">
        <div className="container">
          <SectionHeading eyebrow="Thoughts" title="Posts matching your search." />
          <div className="thought-grid">
            {thoughts.map((thought) => (
              <ThoughtCard key={thought._id} thought={thought} compact onDeleted={handleDeleted} />
            ))}
            {searched && !thoughts.length && !loading ? (
              <p className="empty-state">No thoughts matched "{query}".</p>
            ) : !searched ? (
              <p className="empty-state">Search thoughts, opinions, or hashtags to surface posts.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
