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

  const runSearch = async (term: string) => {
    if (!term.trim()) return;
    const [thoughtResults, userResults] = await Promise.allSettled([api.searchThoughts(term), api.searchUsers(term)]);
    if (thoughtResults.status === 'fulfilled') setThoughts(thoughtResults.value.thoughts);
    if (userResults.status === 'fulfilled') setUsers(userResults.value.users);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || initialQuery;
    if (q) {
      setQuery(q);
      runSearch(q).catch(() => undefined);
    }
  }, [initialQuery]);

  return (
    <div className="page container">
      <section className="explore-hero">
        <div className="mono">Search</div>
        <h1 className="display-title display-title-xl">Find people, thoughts, and hashtags.</h1>
        <form className="search-bar" onSubmit={(event) => { event.preventDefault(); runSearch(query); }}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, thought, or hashtag" />
          <button className="button" type="submit">Search</button>
        </form>
      </section>
      <section className="section">
        <SectionHeading eyebrow="People" title="Users matching your search." />
        <div className="list-grid">
          {users.map((user) => (
            <Link key={user.username} className="explore-card" href={`/profile/${user.username}`}>
              <div className="brand-lockup">
                <img className="avatar" src={user.avatar} alt={user.name} />
                <div>
                  <h3 className="card-title">{user.name}</h3>
                  <div className="meta">@{user.username}</div>
                </div>
              </div>
              <p className="card-copy">{user.bio}</p>
            </Link>
          ))}
          {!users.length ? <p className="empty-state">Search users to see profile matches.</p> : null}
        </div>
      </section>
      <section className="section-dark">
        <div className="container">
          <SectionHeading eyebrow="Thoughts" title="Posts matching your search." />
          <div className="thought-grid">
            {thoughts.map((thought) => <ThoughtCard key={thought._id} thought={thought} compact />)}
            {!thoughts.length ? <p className="empty-state">Search thoughts, opinions, or hashtags to surface posts.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
