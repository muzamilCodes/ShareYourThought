'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready, logout } = useSession();
  const [query, setQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleCount = (e: Event) => {
      const custom = e as CustomEvent<number>;
      if (typeof custom.detail === 'number') {
        setUnreadCount(custom.detail);
      }
    };
    window.addEventListener('unread-count-updated', handleCount);
    return () => window.removeEventListener('unread-count-updated', handleCount);
  }, []);

  const handleLogout = async () => {
    try {
      if (session?.token) {
        await api.logout(session.token);
      }
    } catch {
      // ignore
    } finally {
      logout();
      router.push('/login');
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const profileHref = session?.user?.username ? `/profile/${session.user.username}` : '/profile';
  const userAvatar = session?.user?.avatar || (session?.user?.name ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.name)}` : '');

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (ready && session?.token) {
      api.getUnreadMessagesCount(session.token)
        .then((res) => {
          if (typeof res?.unreadCount === 'number') {
            setUnreadMessagesCount(res.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [ready, session?.token, pathname]);

  const navLinks = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/explore', label: 'Explore', icon: '🔍' },
    { href: '/trending', label: 'Trending', icon: '🔥' },
    { href: '/search', label: 'Search', icon: '🏷️' },
    {
      href: '/messages',
      label: 'Messages',
      icon: '💬',
      authRequired: true,
      badge: unreadMessagesCount > 0 ? (unreadMessagesCount > 9 ? '9+' : unreadMessagesCount) : null
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: '🔔',
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : null
    },
    { href: profileHref, label: 'Profile', icon: '👤', authRequired: true },
    ...(session?.user?.role === 'admin'
      ? [{ href: '/admin', label: 'Admin Panel', icon: '🛡️', authRequired: true }]
      : [])
  ];

  return (
    <>
      {/* =========================================================
          DESKTOP FIXED LEFT SIDEBAR (TWITTER / INSTAGRAM STYLE)
      ========================================================= */}
      <aside className="desktop-sidebar desktop-only" aria-label="Desktop Sidebar Navigation">
        <div className="desktop-sidebar-top">
          {/* Brand Logo */}
          <Link href="/" className="sidebar-brand">
            <span className="brand-mark" />
            <span className="brand-name">Share Your Thoughts</span>
          </Link>

          {/* Search Input Box */}
          <form className="sidebar-search" onSubmit={handleSearch}>
            <span style={{ fontSize: '0.88rem' }}>🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search thoughts, users…"
              aria-label="Search thoughts or users"
            />
          </form>

          {/* Nav Links */}
          <nav className="sidebar-nav">
            {navLinks.map((item) => {
              if (item.authRequired && !session) return null;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item ${isActive ? 'is-active' : ''}`}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                  {item.badge ? (
                    <span className="sidebar-nav-badge">{item.badge}</span>
                  ) : null}
                </Link>
              );
            })}

            {/* Install App Button */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-pwa-install'))}
              className="sidebar-nav-item"
              style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              <span className="sidebar-nav-icon">📲</span>
              <span className="sidebar-nav-label">Install App</span>
            </button>
          </nav>

          {/* Prominent Create Post Button */}
          <Link href="/create" className="sidebar-create-btn">
            <span>✍️</span>
            <span>Share Thought</span>
          </Link>
        </div>

        {/* Bottom User Area */}
        <div className="desktop-sidebar-bottom">
          {ready && session ? (
            <div className="sidebar-user-card">
              <Link href={profileHref} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}>
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={session.user.name}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '1.4rem' }}>👤</span>
                )}
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.86rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.user.name}
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                    @{session.user.username}
                  </span>
                </div>
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ThemeToggle compact />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="button-ghost"
                  style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
                  title="Log Out"
                  aria-label="Log Out"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : ready ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.80rem', color: 'var(--muted)' }}>Theme</span>
                <ThemeToggle compact />
              </div>
              <Link href="/login" className="button" style={{ width: '100%', fontSize: '0.88rem' }}>
                Sign In
              </Link>
              <Link href="/register" className="button-outline" style={{ width: '100%', fontSize: '0.88rem' }}>
                Create Account
              </Link>
            </div>
          ) : null}
        </div>
      </aside>

      {/* =========================================================
          MOBILE TOP COMPACT HEADER (FULL-WIDTH EDGE-TO-EDGE)
      ========================================================= */}
      <header className="mobile-header mobile-only" style={{ width: '100%', boxSizing: 'border-box' }}>
        <div
          className="mobile-header-inner"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: '8px 16px',
            boxSizing: 'border-box'
          }}
        >
          {/* Brand Logo on the Left Edge */}
          <Link href="/" className="sidebar-brand" style={{ padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-mark" />
            <span className="brand-name" style={{ fontSize: '1.05rem', fontWeight: 800 }}>Share Your Thoughts</span>
          </Link>

          {/* Right Action Group on the Far-Right Corner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            {session?.user?.role === 'admin' ? (
              <Link
                href="/admin"
                style={{
                  padding: '4px 8px',
                  borderRadius: '10px',
                  background: pathname.startsWith('/admin') ? 'var(--ember)' : 'var(--dark-soft)',
                  color: pathname.startsWith('/admin') ? '#ffffff' : 'var(--ink)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  border: '1px solid var(--line)'
                }}
                title="Admin Command Center"
              >
                <span>🛡️</span>
                <span>Admin</span>
              </Link>
            ) : null}

            <ThemeToggle compact />

            {/* Mobile Header Logout Button with Modern SVG Icon */}
            {ready && session ? (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink)',
                  borderRadius: '8px'
                }}
                title="Log Out"
                aria-label="Log Out"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            ) : null}

            {/* Absolute Far-Right Corner Alert / Notification Icon */}
            <Link
              href="/notifications"
              style={{
                position: 'relative',
                padding: '6px',
                fontSize: '1.35rem',
                border: 'none',
                background: 'transparent',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink)',
                cursor: 'pointer'
              }}
              title="Notifications"
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    border: '2px solid var(--paper)',
                    lineHeight: 1
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
