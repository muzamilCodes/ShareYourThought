'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import type { Thought } from '../types';

export function DailyThoughtSpotlight() {
  const [thought, setThought] = useState<Thought | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDailyThought()
      .then((res) => {
        if (res?.thought) setThought(res.thought);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !thought) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(200, 109, 52, 0.12) 0%, rgba(245, 158, 11, 0.08) 50%, rgba(16, 185, 129, 0.06) 100%)',
        border: '1px solid rgba(200, 109, 52, 0.25)',
        borderRadius: '16px',
        padding: '16px 20px',
        margin: '0 0 20px 0',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1rem' }}>🌅</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ember)' }}>
            Thought of the Day
          </span>
        </div>
        <span style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 600 }}>
          #{thought.category || 'Inspiration'}
        </span>
      </div>

      <Link
        href={`/thought/${thought._id}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <blockquote
          style={{
            margin: '0 0 10px 0',
            fontSize: '1rem',
            fontWeight: 700,
            lineHeight: 1.4,
            color: 'var(--ink)',
            fontStyle: 'italic'
          }}
        >
          "{thought.content.length > 180 ? `${thought.content.substring(0, 177)}...` : thought.content}"
        </blockquote>
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
        <Link
          href={`/profile/${thought.author?.username}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--ink)', fontWeight: 700 }}
        >
          <img
            src={thought.author?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${thought.author?.username}`}
            alt={thought.author?.name}
            style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <span>{thought.author?.name}</span>
        </Link>

        <div style={{ display: 'flex', gap: '10px', color: 'var(--muted)', fontWeight: 600 }}>
          <span>❤️ {thought.likes?.length || 0}</span>
          <span>💬 {thought.commentsCount || 0}</span>
        </div>
      </div>
    </div>
  );
}
