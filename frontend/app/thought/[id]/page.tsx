'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThoughtCard } from '@/components/ThoughtCard';
import { CommentSection } from '@/components/CreateThought';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import type { Thought, User } from '@/types';

export default function ThoughtPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession();
  const [thought, setThought] = useState<Thought | null>(null);
  const [authorProfile, setAuthorProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const thoughtId = params?.id ? String(params.id) : '';

  useEffect(() => {
    if (!thoughtId) return;
    setLoading(true);
    api.getThought(thoughtId, session?.token)
      .then((data) => {
        setThought(data.thought);
        if (data.thought?.author?.username) {
          api.getProfile(data.thought.author.username, session?.token)
            .then((p) => setAuthorProfile(p.profile))
            .catch(() => {});
        }
      })
      .catch(() => setThought(null))
      .finally(() => setLoading(false));
  }, [thoughtId, session?.token]);

  const handleDeleted = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="page container" style={{ maxWidth: '720px', padding: '32px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--line)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ flex: 1, height: '20px', borderRadius: '8px', background: 'var(--line)', animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ height: '180px', borderRadius: '20px', background: 'var(--paper)', border: '1px solid var(--line)', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (!thought) {
    return (
      <div className="page container" style={{ maxWidth: '640px', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ background: 'var(--paper)', padding: '48px 24px', borderRadius: '24px', border: '1px solid var(--line)', boxShadow: 'var(--shadow)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>💭</span>
          <h1 className="display-title" style={{ fontSize: '1.6rem', marginBottom: '8px', color: 'var(--ink)' }}>
            Thought not found
          </h1>
          <p className="section-copy" style={{ margin: '0 auto 24px auto', maxWidth: '38ch', fontSize: '0.92rem' }}>
            This thought may have been deleted by the author or the link is invalid.
          </p>
          <div className="button-row" style={{ justifyContent: 'center', gap: '12px' }}>
            <Link href="/" className="button">
              🏠 Back to Home
            </Link>
            <Link href="/explore" className="button-outline">
              🔍 Explore Topics
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page container" style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--line)'
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="button-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '0.90rem',
            fontWeight: 700,
            color: 'var(--ink)'
          }}
        >
          ← Back
        </button>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)' }}>
          Thought
        </h1>
      </div>

      {/* Main Single Thought Card View */}
      <article
        style={{
          background: 'var(--paper)',
          borderRadius: '24px',
          border: '1.5px solid var(--line-strong)',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          padding: '24px'
        }}
      >
        <ThoughtCard
          thought={thought}
          onDeleted={handleDeleted}
        />
      </article>

      {/* Author Mini Spotlight Card */}
      {thought.author && (
        <div
          style={{
            marginTop: '24px',
            background: 'var(--paper)',
            padding: '20px 24px',
            borderRadius: '20px',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <Link
            href={`/profile/${thought.author.username}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}
          >
            <img
              src={
                thought.author.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(thought.author.name || 'Author')}`
              }
              alt={thought.author.name}
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--ember)' }}
            />
            <div>
              <strong style={{ display: 'block', fontSize: '0.98rem', color: 'var(--ink)' }}>
                {thought.author.name}
              </strong>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                @{thought.author.username} {authorProfile?.bio ? `· ${authorProfile.bio.slice(0, 50)}…` : ''}
              </span>
            </div>
          </Link>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href={`/messages?user=${thought.author.username}`}
              className="button-outline"
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              💬 Message
            </Link>
            <Link
              href={`/profile/${thought.author.username}`}
              className="button"
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              View Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Inline Comments Section (Open by default on single thought view) */}
      <div style={{ marginTop: '24px' }}>
        <CommentSection thoughtId={thought._id} initiallyOpen={true} />
      </div>
    </div>
  );
}
