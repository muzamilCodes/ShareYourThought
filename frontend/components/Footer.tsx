'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function Footer() {
  const [stats, setStats] = useState({
    totalThoughts: 0,
    totalCategories: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0
  });

  useEffect(() => {
    api.getStats()
      .then((data) => {
        if (data) {
          setStats({
            totalThoughts: data.totalThoughts || 0,
            totalCategories: data.totalCategories || 0,
            totalViews: data.totalViews || 0,
            totalLikes: data.totalLikes || 0,
            totalComments: data.totalComments || 0
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Top Live Metrics Bar (100% Real Live Database Numbers) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(200, 109, 52, 0.06), rgba(20, 20, 17, 0.03))',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)',
                display: 'inline-block'
              }}
            />
            <div>
              <strong style={{ fontSize: '0.92rem', color: 'var(--ink)', display: 'block' }}>
                Real-Time Community Pulse
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                Live platform activity from active readers & writers
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
                {stats.totalThoughts}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Thoughts
              </span>
            </div>

            <div style={{ width: '1px', height: '28px', background: 'var(--line)' }} />

            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
                {stats.totalViews}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Views
              </span>
            </div>

            <div style={{ width: '1px', height: '28px', background: 'var(--line)' }} />

            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
                {stats.totalLikes + stats.totalComments}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Engagements
              </span>
            </div>

            <div style={{ width: '1px', height: '28px', background: 'var(--line)' }} />

            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
                {stats.totalCategories}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Topics
              </span>
            </div>
          </div>
        </div>

        {/* Main Footer Links Grid */}
        <div className="footer-grid">
          <div>
            <div className="brand-lockup" style={{ marginBottom: '10px' }}>
              <span className="brand-mark" />
              <span className="brand-name">ThoughtShare</span>
            </div>
            <p className="footer-copy" style={{ maxWidth: '32ch' }}>
              An authentic publishing network where thoughts are celebrated, perspectives are shared, and conversations remain real.
            </p>
          </div>

          <div>
            <p className="footer-title">Explore</p>
            <ul className="footer-list">
              <li>
                <Link href="/">Home Feed</Link>
              </li>
              <li>
                <Link href="/trending">🔥 Trending Momentum</Link>
              </li>
              <li>
                <Link href="/explore">Topics & Categories</Link>
              </li>
              <li>
                <Link href="/search">Search Thoughts & Users</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="footer-title">Publish & Connect</p>
            <ul className="footer-list">
              <li>
                <Link href="/create">✍️ Share a Thought</Link>
              </li>
              <li>
                <Link href="/notifications">🔔 Notifications</Link>
              </li>
              <li>
                <Link href="/profile">👤 My Profile</Link>
              </li>
              <li>
                <Link href="/settings">⚙️ Account Settings</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="footer-title">Authentication</p>
            <ul className="footer-list">
              <li>
                <Link href="/login">Sign In (Password / OTP)</Link>
              </li>
              <li>
                <Link href="/register">Create Account</Link>
              </li>
              <li>
                <Link href="/forgot-password">Forgot Password</Link>
              </li>
              <li>
                <Link href="/about">About ThoughtShare</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-meta">
            © {new Date().getFullYear()} ThoughtShare. Real Thoughts · Real Discussions · Real Views.
          </p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <Link href="/about" className="footer-meta" style={{ textDecoration: 'underline' }}>
              About
            </Link>
            <span className="footer-meta">·</span>
            <Link href="/trending" className="footer-meta" style={{ textDecoration: 'underline' }}>
              Leaderboard
            </Link>
            <span className="footer-meta">·</span>
            <Link href="/create" className="footer-meta" style={{ textDecoration: 'underline' }}>
              Publish
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

