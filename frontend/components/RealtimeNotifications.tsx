'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '../hooks/useSession';
import { api } from '../lib/api';
import type { Notification } from '../types';

export function RealtimeNotifications() {
  const { session, ready } = useSession();
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!ready || !session?.token) {
      knownIdsRef.current.clear();
      initialFetchDone.current = false;
      return;
    }

    const checkNotifications = async () => {
      try {
        const data = await api.listNotifications(session.token);
        if (!data || !Array.isArray(data.notifications)) return;

        // Broadcast count update for Navbar & BottomNav
        window.dispatchEvent(
          new CustomEvent('unread-count-updated', { detail: data.unreadCount || 0 })
        );

        if (!initialFetchDone.current) {
          // Initialize known notifications on first load
          data.notifications.forEach((n) => knownIdsRef.current.add(n._id));
          initialFetchDone.current = true;
          return;
        }

        // Check for new notifications
        const freshNotification = data.notifications.find(
          (n) => !knownIdsRef.current.has(n._id) && !n.read
        );

        if (freshNotification) {
          knownIdsRef.current.add(freshNotification._id);
          setActiveToast(freshNotification);

          // Auto-hide toast after 5.5 seconds
          setTimeout(() => {
            setActiveToast((current) => (current?._id === freshNotification._id ? null : current));
          }, 5500);
        }
      } catch {
        // ignore network error
      }
    };

    // Initial check
    checkNotifications();

    // Poll every 5 seconds for fast real-time responsiveness
    const interval = setInterval(checkNotifications, 5000);
    return () => clearInterval(interval);
  }, [ready, session?.token]);

  if (!activeToast) return null;

  const actorName = activeToast.actor?.name || 'Someone';
  const actorAvatar =
    activeToast.actor?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(actorName)}`;

  const iconMap: Record<string, string> = {
    like: '❤️',
    comment: '💬',
    reply: '↩️',
    follow: '👤',
    system: '📢'
  };

  const badgeIcon = iconMap[activeToast.type] || '🔔';

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '380px',
        width: 'calc(100vw - 40px)',
        animation: 'toastSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          padding: '12px 14px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(12px)',
          position: 'relative'
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={actorAvatar}
            alt={actorName}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              background: 'var(--paper)',
              borderRadius: '50%',
              fontSize: '0.85rem',
              lineHeight: 1,
              padding: '2px'
            }}
          >
            {badgeIcon}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: '0.88rem', color: 'var(--ink)', display: 'block', lineHeight: 1.25 }}>
            {activeToast.title}
          </strong>
          {activeToast.body ? (
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--muted)',
                display: 'block',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {activeToast.body}
            </span>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Link
            href={
              activeToast.thought?._id
                ? `/thought/${activeToast.thought._id}`
                : activeToast.type === 'follow' && activeToast.actor?.username
                ? `/profile/${activeToast.actor.username}`
                : '/notifications'
            }
            onClick={() => setActiveToast(null)}
            className="button-ghost"
            style={{ fontSize: '0.76rem', padding: '4px 8px', fontWeight: 700 }}
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => setActiveToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              fontSize: '1rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
