'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '../../components/SectionHeading';
import { api, readStoredSession } from '../../lib/api';
import type { Notification } from '../../types';

export default function NotificationsPage() {
  const session = readStoredSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!session?.token) return;
    const data = await api.listNotifications(session.token);
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  };

  useEffect(() => {
    loadNotifications().catch(() => undefined);
  }, []);

  const markAllRead = async () => {
    if (!session?.token) return;
    await api.markAllNotificationsRead(session.token);
    await loadNotifications();
  };

  if (!session?.token) {
    return (
      <div className="page container">
        <section className="auth-hero">
          <div className="mono">Notifications</div>
          <h1 className="display-title display-title-xl">Sign in to see your activity.</h1>
          <Link href="/login" className="button">Login</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page container">
      <section className="explore-hero">
        <div className="mono">Notifications</div>
        <h1 className="display-title display-title-xl">Your conversation in motion.</h1>
        <p className="section-copy section-copy-lg">Follow-ups, likes, comments, replies, and follows appear here in chronological order.</p>
        <div className="button-row">
          <div className="pill">Unread · {unreadCount}</div>
          <button className="button-outline" type="button" onClick={markAllRead}>Mark all read</button>
        </div>
      </section>
      <section className="section">
        <SectionHeading eyebrow="Inbox" title="Latest activity." />
        <div className="notification-list">
          {notifications.map((item) => (
            <article key={item._id} className="notification-card">
              <div className="card-top">
                <div>
                  <div className="notification-title">{item.title}</div>
                  <div className="meta">{item.actor?.name ? `From ${item.actor.name}` : item.type}</div>
                </div>
                <div className="pill">{item.read ? 'Read' : 'New'}</div>
              </div>
              <p className="card-copy">{item.body}</p>
            </article>
          ))}
          {!notifications.length ? <p className="empty-state">No notifications yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
