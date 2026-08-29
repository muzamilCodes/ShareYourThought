'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer-compact">
      <div className="footer-compact-inner">
        {/* Inline Quick Links */}
        <nav className="footer-compact-links" aria-label="Footer Navigation">
          <Link href="/about">About</Link>
          <span className="footer-dot">·</span>
          <Link href="/trending">Trending</Link>
          <span className="footer-dot">·</span>
          <Link href="/explore">Topics</Link>
          <span className="footer-dot">·</span>
          <Link href="/search">Search</Link>
          <span className="footer-dot">·</span>
          <Link href="/create">Publish</Link>
          <span className="footer-dot">·</span>
          <Link href="/settings">Settings</Link>
          <span className="footer-dot">·</span>
          <Link href="/login">Account</Link>
        </nav>

        {/* Brand & Copyright */}
        <p className="footer-compact-copy">
          <span className="brand-mark-mini" />
          © {new Date().getFullYear()} <strong>ThoughtShare</strong> · Authentic Public Thoughts
        </p>
      </div>
    </footer>
  );
}
