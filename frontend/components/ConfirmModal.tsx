'use client';

import { useEffect } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
  loading = false
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const iconEmoji =
    type === 'danger' ? '🗑️' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';

  const confirmBg =
    type === 'danger'
      ? 'var(--ember)'
      : type === 'success'
      ? '#16a34a'
      : 'var(--ink)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'tsFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--paper)',
          borderRadius: '24px',
          border: '1px solid var(--line)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'tsScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--dark-soft)',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: '16px'
          }}
        >
          {iconEmoji}
        </div>

        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--ink)',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em'
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--muted)',
            lineHeight: 1.5,
            margin: '0 0 24px 0'
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            type="button"
            className="button-outline"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '0.90rem',
              borderRadius: '14px'
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '0.90rem',
              borderRadius: '14px',
              background: confirmBg,
              borderColor: confirmBg
            }}
          >
            {loading ? 'Processing…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
