'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';

const links = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/trending', label: 'Trending' },
  { href: '/search', label: 'Search' },
  { href: '/about', label: 'About' }
];

export function Navbar() {
  const { session, ready, logout } = useSession();
  const [query, setQuery] = useState('');

  const handleLogout = async () => {
    try {
      if (session?.token) {
        await api.logout(session.token);
      }
    } catch {
      // ignore logout errors
    } finally {
      logout();
      window.location.href = '/';
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark" />
          <span className="brand-name">ThoughtShare</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-utility">
          <form className="nav-search" onSubmit={handleSearch}>
            <span className="mono" style={{ fontSize: '0.75rem' }}>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Thoughts, authors, tags…"
              aria-label="Search thoughts or users"
            />
          </form>

          {ready && session ? (
            <>
              <Link className="button-ghost" href="/notifications" title="Notifications" style={{ padding: '8px 12px' }}>
                🔔
              </Link>
              <Link className="button-ghost" href="/profile" title="My Profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>👤</span>
                <span>@{session.user.username}</span>
              </Link>
              <button className="button-outline" onClick={handleLogout} style={{ padding: '8px 14px' }}>
                Logout
              </button>
            </>
          ) : ready ? (
            <>
              <Link className="button-ghost" href="/login">
                Login
              </Link>
              <Link className="button-outline" href="/register">
                Register
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
