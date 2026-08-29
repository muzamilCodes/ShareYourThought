'use client';

import Link from 'next/link';
import { AuthForm } from '../../components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="page container">
      <div className="auth-shell">
        <div className="auth-hero">
          <div>
            <div className="hero-kicker" style={{ marginBottom: '12px' }}>
              <span className="brand-mark" /> Join the Community
            </div>
            <h1 className="display-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05 }}>
              Create a place for your ideas.
            </h1>
            <p className="section-copy" style={{ marginTop: '14px', fontSize: '1rem' }}>
              Set up your profile, start publishing thoughts, and follow thinkers whose ideas you want to keep reading.
            </p>

            <div style={{ marginTop: '28px', display: 'grid', gap: '14px' }}>
              <div className="auth-hero-feature">
                <div className="auth-hero-icon">✍️</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Publish Freely</strong>
                  <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Share reflections, opinions, and insights with rich tags & images.</span>
                </div>
              </div>

              <div className="auth-hero-feature">
                <div className="auth-hero-icon">🔒</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Secure OTP Verification</strong>
                  <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Instant 6-digit email code ensures your account is authentic.</span>
                </div>
              </div>

              <div className="auth-hero-feature">
                <div className="auth-hero-icon">💬</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Engage in Discussions</strong>
                  <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Comment, like, bookmark, and follow writers across topics.</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
              Already registered?{' '}
              <Link href="/login" style={{ color: 'var(--ember)', fontWeight: 700 }}>
                Sign in here →
              </Link>
            </p>
          </div>
        </div>

        <div>
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}

