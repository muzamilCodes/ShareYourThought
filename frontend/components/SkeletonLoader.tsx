'use client';

export function ThoughtSkeleton() {
  return (
    <article className="thought-card skeleton-card">
      <div className="thought-top">
        <div className="brand-lockup" style={{ width: '100%' }}>
          <div className="skeleton-circle" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton-line" style={{ width: '35%', height: '14px' }} />
            <div className="skeleton-line" style={{ width: '20%', height: '10px' }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
        <div className="skeleton-line" style={{ width: '95%', height: '14px' }} />
        <div className="skeleton-line" style={{ width: '85%', height: '14px' }} />
        <div className="skeleton-line" style={{ width: '60%', height: '14px' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
        <div className="skeleton-line" style={{ width: '50px', height: '24px', borderRadius: '12px' }} />
        <div className="skeleton-line" style={{ width: '50px', height: '24px', borderRadius: '12px' }} />
        <div className="skeleton-line" style={{ width: '50px', height: '24px', borderRadius: '12px' }} />
      </div>
    </article>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="list-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ThoughtSkeleton key={i} />
      ))}
    </div>
  );
}
