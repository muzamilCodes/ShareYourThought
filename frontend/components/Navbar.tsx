'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import { ThemeToggle } from './ThemeToggle';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      if (session?.token) {
        await api.logout(session.token);
      }
    } catch {
      // ignore logout errors
    } finally {
      logout();
      setMobileMenuOpen(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link className="brand" href="/" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-mark" />
          <span>ThoughtShare</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links desktop-only" aria-label="Primary Navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Controls (Search + Auth + Theme) */}
        <div className="nav-actions desktop-only">
          <ThemeToggle compact />

          <form className="nav-search" onSubmit={handleSearch}>
            <span className="mono" style={{ fontSize: '0.75rem' }}>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search thoughts, users…"
              aria-label="Search thoughts or users"
            />
          </form>

          {ready && session ? (
            <>
              <Link className="button-ghost" href="/notifications" title="Notifications" style={{ padding: '8px 12px' }}>
                🔔
              </Link>
              <Link className="button-ghost" href={`/profile/${session.user.username}`} title="My Profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
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

        {/* Mobile Header Controls (Right side of top bar: only clean Theme Toggle) */}
        <div className="mobile-header-actions mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle compact />
        </div>
      </div>
    </header>
  );
}
