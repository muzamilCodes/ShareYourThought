'use client';

import { useState } from 'react';
import type { Thought } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  thought: Thought;
  onClose: () => void;
}

export function ShareModal({ isOpen, thought, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shareyourthoughts.com';
  const thoughtUrl = `${origin}/#thought-${thought._id}`;
  const shareText = `"${thought.content.slice(0, 140)}${thought.content.length > 140 ? '…' : ''}" — By ${thought.author?.name || 'Anonymous'} on Share Your Thoughts\n${thoughtUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(thoughtUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Thought by ${thought.author?.name || 'Author'}`,
          text: thought.content,
          url: thoughtUrl
        });
      } catch {
        // ignore
      }
    }
  };

  const shareToWhatsapp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(thoughtUrl)}&text=${encodeURIComponent(thought.content.slice(0, 120))}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--paper)',
          borderRadius: '24px',
          border: '1px solid var(--line)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          padding: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>↗️</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--ink)' }}>Share Thought</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', color: 'var(--muted)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Thought preview quote */}
        <div
          style={{
            padding: '12px 14px',
            background: 'var(--dark-soft)',
            borderRadius: '14px',
            border: '1px solid var(--line)',
            fontSize: '0.86rem',
            color: 'var(--muted)',
            lineHeight: 1.4,
            marginBottom: '16px',
            fontStyle: 'italic'
          }}
        >
          &ldquo;{thought.content.slice(0, 100)}{thought.content.length > 100 ? '…' : ''}&rdquo;
        </div>

        {/* Share Action Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={shareToWhatsapp}
            className="button-ghost"
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.86rem',
              fontWeight: 600
            }}
          >
            <span>💬</span> WhatsApp
          </button>

          <button
            type="button"
            onClick={shareToTwitter}
            className="button-ghost"
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.86rem',
              fontWeight: 600
            }}
          >
            <span>🐦</span> X / Twitter
          </button>

          <button
            type="button"
            onClick={shareToTelegram}
            className="button-ghost"
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.86rem',
              fontWeight: 600
            }}
          >
            <span>✈️</span> Telegram
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="button-ghost"
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.86rem',
                fontWeight: 600
              }}
            >
              <span>📱</span> More Apps
            </button>
          )}
        </div>

        {/* Copy Link Input Bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={thoughtUrl}
            style={{
              flex: 1,
              background: 'var(--dark-soft)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '8px 12px',
              fontSize: '0.80rem',
              color: 'var(--ink)',
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="button"
            style={{
              minHeight: 'auto',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              borderRadius: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
