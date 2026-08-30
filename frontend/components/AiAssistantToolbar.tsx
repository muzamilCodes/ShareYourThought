'use client';

import { useState } from 'react';
import { api } from '../lib/api';

type AiAssistantToolbarProps = {
  text: string;
  token?: string;
  onApplyResult: (result: string, mode: 'replace' | 'hashtags') => void;
};

export function AiAssistantToolbar({ text, token, onApplyResult }: AiAssistantToolbarProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: 'improve' | 'hashtags' | 'shorten' | 'expand' | 'emotional' | 'translate') => {
    if (!token) {
      setError('Please log in to use the AI Thought Assistant.');
      return;
    }
    setError(null);
    setLoadingAction(action);

    try {
      const res = await api.assistWithAi({ mode: action, text }, token);
      if (res?.result) {
        if (action === 'hashtags') {
          onApplyResult(res.result, 'hashtags');
        } else {
          onApplyResult(res.result, 'replace');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'AI assistant temporarily unavailable');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(200, 109, 52, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
        border: '1px solid rgba(200, 109, 52, 0.25)',
        borderRadius: '12px',
        padding: '12px 14px',
        margin: '12px 0 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--ember)' }}>
          <span>✨</span>
          <span>AI Thought Assistant</span>
        </div>
        {loadingAction && (
          <span style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 600 }}>
            Generating with AI...
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <button
          type="button"
          onClick={() => handleAction('improve')}
          disabled={Boolean(loadingAction)}
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
        >
          {loadingAction === 'improve' ? '⏳ Improving...' : '✨ Improve Writing'}
        </button>

        <button
          type="button"
          onClick={() => handleAction('hashtags')}
          disabled={Boolean(loadingAction)}
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
        >
          {loadingAction === 'hashtags' ? '⏳ Finding tags...' : '🏷️ Suggest Hashtags'}
        </button>

        <button
          type="button"
          onClick={() => handleAction('shorten')}
          disabled={Boolean(loadingAction)}
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
        >
          {loadingAction === 'shorten' ? '⏳ Shortening...' : '✂️ Make Shorter'}
        </button>

        <button
          type="button"
          onClick={() => handleAction('expand')}
          disabled={Boolean(loadingAction)}
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
        >
          {loadingAction === 'expand' ? '⏳ Expanding...' : '📖 Expand Thought'}
        </button>

        <button
          type="button"
          onClick={() => handleAction('emotional')}
          disabled={Boolean(loadingAction)}
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
        >
          {loadingAction === 'emotional' ? '⏳ Enriching...' : '💖 Make Emotional'}
        </button>

        <button
          type="button"
          onClick={() => handleAction('translate')}
          disabled={Boolean(loadingAction)}
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 120ms ease'
          }}
        >
          {loadingAction === 'translate' ? '⏳ Translating...' : '🌐 Translate'}
        </button>
      </div>

      {error && (
        <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
}
