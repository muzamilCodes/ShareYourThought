'use client';

import Link from 'next/link';

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="page container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <section
        className="form-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '40px 24px',
          borderRadius: '24px',
          boxShadow: 'var(--shadow)'
        }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📴</div>
        <div className="mono eyebrow" style={{ color: 'var(--ember)' }}>
          Offline Mode
        </div>
        <h1 className="display-title" style={{ fontSize: '2.2rem', marginTop: '8px', marginBottom: '12px' }}>
          You're Offline
        </h1>
        <p className="section-copy section-copy-lg" style={{ marginBottom: '24px' }}>
          Your internet connection appears to be unavailable. Don't worry, ThoughtShare will automatically reconnect once you're back online.
        </p>

        <div className="button-row" style={{ justifyContent: 'center', gap: '12px' }}>
          <button className="button" type="button" onClick={handleReload} style={{ minWidth: '140px' }}>
            🔄 Try Again
          </button>
          <Link href="/" className="button-outline">
            🏠 Return Home
          </Link>
        </div>
      </section>
    </div>
  );
}
