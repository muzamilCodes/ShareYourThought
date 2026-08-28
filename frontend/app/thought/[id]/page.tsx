'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ThoughtCard } from '../../../components/ThoughtCard';
import { CommentSection } from '../../../components/CommentSection';
import { api } from '../../../lib/api';
import type { Thought } from '../../../types';

export default function ThoughtPage() {
  const params = useParams<{ id: string }>();
  const [thought, setThought] = useState<Thought | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    api.getThought(params.id).then((data) => setThought(data.thought)).catch(() => undefined);
  }, [params?.id]);

  if (!thought) {
    return (
      <div className="page container">
        <section className="auth-hero">
          <div className="mono">Thought</div>
          <h1 className="display-title display-title-xl">Loading the thought…</h1>
        </section>
      </div>
    );
  }

  return (
    <div className="page container">
      <section className="page-frame">
        <div className="page-frame-main">
          <div className="mono eyebrow">Thought detail</div>
          <ThoughtCard thought={thought} />
          <CommentSection thoughtId={thought._id} />
        </div>
        <aside className="page-frame-aside">
          <div className="note-card"><div className="mono">Author</div><p className="note-copy">{thought.author.name} · @{thought.author.username}</p></div>
          <div className="note-card"><div className="mono">Category</div><p className="note-copy">{thought.category}</p></div>
          <div className="note-card"><div className="mono">Hashtags</div><p className="note-copy">{thought.hashtags.map((tag) => `#${tag}`).join(' · ')}</p></div>
          <Link href="/explore" className="button-outline">Back to explore</Link>
        </aside>
      </section>
    </div>
  );
}
