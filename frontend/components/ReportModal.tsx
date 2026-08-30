'use client';

import { useState } from 'react';
import { api } from '../lib/api';

type ReportModalProps = {
  targetType: 'thought' | 'comment' | 'user';
  targetId: string;
  token?: string;
  onClose: () => void;
};

const REPORT_REASONS = [
  { value: 'spam', label: '🛑 Spam / Unsolicited Promotion' },
  { value: 'harassment', label: '😡 Harassment or Bullying' },
  { value: 'hate_speech', label: '🚫 Hate Speech or Discrimination' },
  { value: 'violence', label: '⚠️ Violence or Dangerous Content' },
  { value: 'sexual_content', label: '🔞 Nudity or Inappropriate Content' },
  { value: 'misinformation', label: '❌ False Information / Scams' },
  { value: 'copyright', label: '©️ Intellectual Property Violation' },
  { value: 'other', label: '❓ Other Policy Violation' }
];

export function ReportModal({ targetType, targetId, token, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Please log in to submit a report.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.report({ targetType, targetId, reason, details }, token);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            color: 'var(--muted)',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✅</div>
            <h3 style={{ margin: '0 0 6px 0' }}>Report Submitted</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
              Thank you for keeping our community safe. Our moderation team will review this promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '1.4rem' }}>🚨</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Report {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
              </h3>
            </div>

            <p style={{ color: 'var(--muted)', fontSize: '0.84rem', margin: '0 0 16px 0' }}>
              Select a reason why this content violates our community guidelines.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: reason === r.value ? 'rgba(200, 109, 52, 0.12)' : 'var(--dark-soft)',
                    border: reason === r.value ? '1px solid var(--ember)' : '1px solid var(--line)',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: 'var(--ink)'
                  }}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <textarea
                placeholder="Additional details or context (optional)..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: 'var(--dark-soft)',
                  color: 'var(--ink)',
                  fontSize: '0.84rem',
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ fontSize: '0.85rem', background: '#ef4444', borderColor: '#ef4444' }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
