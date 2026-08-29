'use client';

import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="page container">
      <div className="auth-shell">
        <div className="auth-hero">
          <div>
            <div className="hero-kicker" style={{ marginBottom: '12px' }}>
              <span className="brand-mark" /> Welcome Back
            </div>
            <h1 className="display-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05 }}>
              Enter the conversation again.
            </h1>
            <p className="section-copy" style={{ marginTop: '14px', fontSize: '1rem' }}>
              Sign in with your password or use fast Instant OTP to access your published thoughts, notifications, and profile.
            </p>

            <div style={{ marginTop: '28px', display: 'grid', gap: '14px' }}>
              <div className="auth-hero-feature">
                <div className="auth-hero-icon">⚡</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Passwordless Instant OTP</strong>
                  <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Forgot your password? Sign in with a one-time code sent directly to your email.</span>
                </div>
              </div>

              <div className="auth-hero-feature">
                <div className="auth-hero-icon">🔔</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Live Notifications</strong>
                  <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>See who liked your thoughts, commented on posts, or started following you.</span>
                </div>
              </div>

              <div className="auth-hero-feature">
                <div className="auth-hero-icon">🔖</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Saved Thoughts & Bookmarks</strong>
                  <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Access your reading list and favorite discussions anytime.</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
              New to ThoughtShare?{' '}
              <Link href="/register" style={{ color: 'var(--ember)', fontWeight: 700 }}>
                Create an account →
              </Link>
            </p>
          </div>
        </div>

        <div>
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  );
}

