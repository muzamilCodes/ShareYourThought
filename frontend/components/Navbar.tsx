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
      window.location.href = '/';
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      setMobileMenuOpen(false);
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand-lockup" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-mark" />
          <span className="brand-name">ThoughtShare</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links desktop-only" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Nav Utility */}
        <div className="nav-utility desktop-only">
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

        {/* Mobile Header Controls (Right side of top bar) */}
        <div className="mobile-header-actions mobile-only">
          {ready && session ? (
            <>
              <Link href="/notifications" className="mobile-icon-btn" title="Notifications" onClick={() => setMobileMenuOpen(false)}>
                🔔
              </Link>
              <Link href="/profile" className="mobile-icon-btn" title="Profile" onClick={() => setMobileMenuOpen(false)}>
                👤
              </Link>
            </>
          ) : null}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen ? (
        <div className="mobile-menu-drawer mobile-only">
          <form className="nav-search mobile-search-form" onSubmit={handleSearch}>
            <span className="mono" style={{ fontSize: '0.75rem' }}>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search thoughts, users…"
              aria-label="Search thoughts or users"
            />
          </form>

          <nav className="mobile-nav-links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-auth-actions">
            {ready && session ? (
              <>
                <Link
                  href="/profile"
                  className="button"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👤 My Profile (@{session.user.username})
                </Link>
                <button
                  className="button-outline"
                  onClick={handleLogout}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Logout
                </button>
              </>
            ) : ready ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
                <Link
                  href="/login"
                  className="button"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="button-outline"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
