import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page container">
      <section className="auth-hero">
        <div className="mono">404</div>
        <h1 className="display-title display-title-xl">Page not found</h1>
        <p className="section-copy section-copy-lg">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="button-row" style={{ marginTop: '20px' }}>
          <Link href="/" className="button">
            Back to Home
          </Link>
          <Link href="/explore" className="button-outline">
            Explore Thoughts
          </Link>
        </div>
      </section>
    </div>
  );
}
