'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import { playSuccessSound } from '../lib/soundUtils';

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

const GRADIENTS = [
  { id: 'ember', name: 'Sunset Ember', bg: 'linear-gradient(135deg, #c86d34 0%, #ea580c 45%, #b43403 100%)' },
  { id: 'twilight', name: 'Twilight', bg: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)' },
  { id: 'ocean', name: 'Ocean Wave', bg: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 60%, #1e1b4b 100%)' },
  { id: 'emerald', name: 'Emerald Forest', bg: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #064e3b 100%)' },
  { id: 'midnight', name: 'Velvet Dark', bg: 'linear-gradient(135deg, #18181b 0%, #27272a 60%, #09090b 100%)' }
];

export function StoryCreatorModal({ isOpen, onClose, onStoryCreated }: StoryCreatorModalProps) {
  const { session } = useSession();
  const [content, setContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [category, setCategory] = useState('Life');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !session?.token) return;

    setLoading(true);
    setError('');

    try {
      await api.createThought(
        {
          content: content.trim(),
          category: category || 'Story',
          hashtags: `Story, ${category.replace(/\s+/g, '')}`
        },
        session.token
      );
      playSuccessSound();
      setContent('');
      onStoryCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const userAvatar =
    session?.user?.avatar ||
    (session?.user?.name
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.name)}`
      : 'https://api.dicebear.com/7.x/initials/svg?seed=User');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 200ms ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--paper)',
          borderRadius: '24px',
          border: '1px solid var(--line)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--line)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>✨</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>Create Story Spark</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Live Story Preview Card */}
        <div style={{ padding: '16px 20px' }}>
          <div
            style={{
              height: '240px',
              borderRadius: '18px',
              background: selectedGradient.bg,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Author Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={userAvatar}
                alt={session?.user?.name || 'You'}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #ffffff', objectFit: 'cover' }}
              />
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.84rem', display: 'block' }}>
                  {session?.user?.name || 'You'}
                </span>
                <span style={{ fontSize: '0.70rem', opacity: 0.85 }}>Your Story · Just now</span>
              </div>
            </div>

            {/* Live Text Preview */}
            <div style={{ textAlign: 'center', padding: '0 10px' }}>
              <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.4, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {content.trim() || "What's on your mind? Type below…"}
              </p>
            </div>

            {/* Bottom Tag */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
                #{category}
              </span>
            </div>
          </div>

          {/* Gradient Color Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
            {GRADIENTS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGradient(g)}
                title={g.name}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: g.bg,
                  border: selectedGradient.id === g.id ? '2.5px solid var(--ink)' : '2px solid transparent',
                  cursor: 'pointer',
                  transform: selectedGradient.id === g.id ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 150ms ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 20px 20px 20px' }}>
          <div className="field" style={{ marginBottom: '12px' }}>
            <textarea
              className="textarea"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share a thought spark, quote, or reflection…"
              maxLength={280}
              required
              autoFocus
              style={{ fontSize: '0.90rem', resize: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px' }}>
              <span>Category: #{category}</span>
              <span>{content.length}/280</span>
            </div>
          </div>

          {error ? <p className="helper" style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</p> : null}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="button-outline"
              onClick={onClose}
              style={{ flex: 1, minHeight: '40px', fontSize: '0.86rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button"
              disabled={loading || !content.trim()}
              style={{ flex: 2, minHeight: '40px', fontSize: '0.86rem', fontWeight: 700 }}
            >
              {loading ? 'Publishing…' : 'Share to Story 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
