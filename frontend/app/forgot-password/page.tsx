'use client';

import Link from 'next/link';
import { AuthForm } from '../../components/AuthForm';

export default function ForgotPasswordPage() {
  return (
    <div className="page container">
      <div className="auth-shell">
        <div className="auth-hero">
          <div>
            <div className="hero-kicker" style={{ marginBottom: '12px' }}>
              <span className="brand-mark" /> Account Recovery
            </div>
            <h1 className="display-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05 }}>
              Reset your password with ease.
            </h1>
            <p className="section-copy" style={{ marginTop: '14px', fontSize: '1rem' }}>
              Enter your registered email address to receive a secure 6-digit OTP code. Enter the code and set your new password instantly.
            </p>

            <div style={{ marginTop: '28px', display: 'grid', gap: '14px' }}>
              <div className="auth-hero-feature">
                <div className="auth-hero-icon">📬</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Instant OTP Delivery</strong>
                  <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>No broken reset links. Simply enter the 6-digit code from your email inbox.</span>
                </div>
              </div>

              <div className="auth-hero-feature">
                <div className="auth-hero-icon">🛡️</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--ink)' }}>Safe & Protected</strong>
                  <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Codes expire automatically in 10 minutes and can only be used once.</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
              Remember your password?{' '}
              <Link href="/login" style={{ color: 'var(--ember)', fontWeight: 700 }}>
                Back to Sign In →
              </Link>
            </p>
          </div>
        </div>

        <div>
          <AuthForm mode="forgot" />
        </div>
      </div>
    </div>
  );
}
