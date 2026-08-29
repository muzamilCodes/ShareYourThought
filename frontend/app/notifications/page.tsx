'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '@/components/SectionHeading';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const { session, ready } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async (token: string) => {
    try {
      const data = await api.listNotifications(token);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (session?.token) {
      loadNotifications(session.token);
    } else {
      setLoading(false);
    }
  }, [ready, session?.token]);

  const markAllRead = async () => {
    if (!session?.token) return;
    try {
      await api.markAllNotificationsRead(session.token);
      setUnreadCount(0);
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  if (ready && !session) {
    return (
      <div className="page container">
        <section className="auth-hero">
          <div className="mono">Notifications</div>
          <h1 className="display-title display-title-xl">Sign in to view your activity.</h1>
          <p className="section-copy section-copy-lg">
            Stay updated when people like your thoughts, comment on your ideas, or follow your stream.
          </p>
          <div className="button-row" style={{ marginTop: '24px' }}>
            <Link href="/login" className="button">
              Login to ThoughtShare
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page container">
      <section className="explore-hero">
        <div className="mono">Activity Feed</div>
        <h1 className="display-title display-title-xl">Your conversation in motion.</h1>
        <p className="section-copy section-copy-lg">
          Follow-ups, likes, comments, replies, and new followers appear here in real time.
        </p>
        <div className="button-row" style={{ marginTop: '20px' }}>
          <div className="pill">Unread · {unreadCount}</div>
          {unreadCount > 0 ? (
            <button className="button-outline" type="button" onClick={markAllRead}>
              Mark all as read
            </button>
          ) : null}
        </div>
      </section>

      <section className="section">
        <SectionHeading eyebrow="Inbox" title="Recent Notifications" />
        <div className="notification-list">
          {loading ? (
            <p className="empty-state">Loading your activity…</p>
          ) : notifications.map((item) => (
            <article
              key={item._id}
              className="notification-card"
              style={{ opacity: item.read ? 0.75 : 1, borderLeft: !item.read ? '3px solid var(--ember)' : undefined }}
            >
              <div className="card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.actor?.avatar ? (
                    <img
                      className="avatar"
                      src={item.actor.avatar}
                      alt={item.actor.name || 'User'}
                      style={{ width: '32px', height: '32px' }}
                    />
                  ) : null}
                  <div>
                    <div className="notification-title" style={{ fontWeight: 600 }}>{item.title}</div>
                    {item.actor?.username ? (
                      <Link href={`/profile/${item.actor.username}`} className="meta" style={{ textDecoration: 'underline' }}>
                        @{item.actor.username}
                      </Link>
                    ) : (
                      <div className="meta">{item.type}</div>
                    )}
                  </div>
                </div>
                <div className="pill">{item.read ? 'Read' : 'New'}</div>
              </div>
              <p className="card-copy" style={{ marginTop: '12px' }}>{item.body}</p>
              {item.thought ? (
                <div style={{ marginTop: '10px' }}>
                  <Link
                    href={`/thought/${typeof item.thought === 'string' ? item.thought : item.thought._id}`}
                    className="button-ghost"
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    View Thought →
                  </Link>
                </div>
              ) : null}
            </article>
          ))}
          {!loading && !notifications.length ? (
            <p className="empty-state">No notifications yet. When other users interact with you, updates will appear here.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
