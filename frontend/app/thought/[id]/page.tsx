'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThoughtCard } from '@/components/ThoughtCard';
import { CommentSection } from '@/components/CreateThought';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import type { Thought } from '@/types';

export default function ThoughtPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession();
  const [thought, setThought] = useState<Thought | null>(null);
  const [loading, setLoading] = useState(true);

  const thoughtId = params?.id ? String(params.id) : '';

  useEffect(() => {
    if (!thoughtId) return;
    setLoading(true);
    api.getThought(thoughtId, session?.token)
      .then((data) => setThought(data.thought))
      .catch(() => setThought(null))
      .finally(() => setLoading(false));
  }, [thoughtId, session?.token]);

  const handleDeleted = () => {
    router.push('/explore');
  };

  if (loading) {
    return (
      <div className="page container">
        <section className="auth-hero">
          <div className="mono">Thought</div>
          <h1 className="display-title display-title-xl">Loading thought…</h1>
        </section>
      </div>
    );
  }

  if (!thought) {
    return (
      <div className="page container">
        <section className="auth-hero">
          <div className="mono">404</div>
          <h1 className="display-title display-title-xl">Thought not found.</h1>
          <p className="section-copy section-copy-lg">This thought may have been deleted or the link is invalid.</p>
          <div className="button-row" style={{ marginTop: '20px' }}>
            <Link href="/explore" className="button">
              Explore Thoughts
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page container">
      <section className="page-frame">
        <div className="page-frame-main">
          <div className="mono eyebrow">Thought Detail</div>
          <ThoughtCard thought={thought} onDeleted={handleDeleted} />
          <CommentSection thoughtId={thought._id} />
        </div>
        <aside className="page-frame-aside">
          <div className="note-card">
            <div className="mono">Author</div>
            <p className="note-copy">
              <Link href={`/profile/${thought.author?.username}`} style={{ textDecoration: 'underline' }}>
                {thought.author?.name}
              </Link>{' '}
              · @{thought.author?.username}
            </p>
          </div>
          <div className="note-card">
            <div className="mono">Category</div>
            <p className="note-copy">
              <Link href="/explore" style={{ textDecoration: 'underline' }}>
                {thought.category}
              </Link>
            </p>
          </div>
          {thought.hashtags?.length ? (
            <div className="note-card">
              <div className="mono">Hashtags</div>
              <p className="note-copy">
                {thought.hashtags.map((tag) => `#${tag}`).join(' · ')}
              </p>
            </div>
          ) : null}
          <Link href="/explore" className="button-outline">
            ← Back to Explore
          </Link>
        </aside>
      </section>
    </div>
  );
}
