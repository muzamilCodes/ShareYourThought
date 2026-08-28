'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page container">
      <section className="auth-hero">
        <div className="mono">Error</div>
        <h1 className="display-title display-title-xl">Something went wrong</h1>
        <p className="section-copy section-copy-lg">
          An unexpected error occurred while loading this page.
        </p>
        <div className="button-row" style={{ marginTop: '20px' }}>
          <button className="button" onClick={() => reset()}>
            Try Again
          </button>
          <Link href="/" className="button-outline">
            Go Home
          </Link>
        </div>
      </section>
    </div>
  );
}
