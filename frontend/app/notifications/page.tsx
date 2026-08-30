'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const { session, ready } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [processedRequests, setProcessedRequests] = useState<Record<string, 'accepted' | 'declined'>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'like' | 'comment' | 'follow' | 'message'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async (token: string) => {
    try {
      const [notifData, reqData] = await Promise.allSettled([
        api.listNotifications(token),
        api.getFollowRequests(token)
      ]);
      if (notifData.status === 'fulfilled') {
        setNotifications(notifData.value.notifications || []);
        setUnreadCount(notifData.value.unreadCount || 0);
      }
      if (reqData.status === 'fulfilled') {
        setFollowRequests(reqData.value.requests || []);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    if (!session?.token) return;
    try {
      await api.markNotificationRead(id, session.token);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleDeleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.token) return;
    try {
      await api.deleteNotification(id, session.token);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      // ignore
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

  const handleAcceptRequest = async (requesterId: string) => {
    if (!session?.token) return;
    try {
      await api.acceptFollowRequest(requesterId, session.token);
      setProcessedRequests((prev) => ({ ...prev, [requesterId]: 'accepted' }));
      setFollowRequests((prev) => prev.filter((u) => (u._id || u.id) !== requesterId));
    } catch {
      // ignore
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    if (!session?.token) return;
    try {
      await api.declineFollowRequest(requesterId, session.token);
      setProcessedRequests((prev) => ({ ...prev, [requesterId]: 'declined' }));
      setFollowRequests((prev) => prev.filter((u) => (u._id || u.id) !== requesterId));
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    if (!session?.token) return;
    try {
      await api.markAllNotificationsRead(session.token);
      setUnreadCount(0);
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent('unread-count-updated', { detail: 0 }));
    } catch {
      // ignore
    }
  };

  if (ready && !session) {
    return (
      <div className="page container" style={{ maxWidth: '650px' }}>
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--paper)', borderRadius: '20px', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🔔</span>
          <h1 className="display-title" style={{ fontSize: '1.6rem', marginBottom: '8px', color: 'var(--ink)' }}>
            Sign in to view your activity
          </h1>
          <p className="section-copy" style={{ margin: '0 auto 20px auto', fontSize: '0.92rem', maxWidth: '38ch' }}>
            Stay updated when people like your thoughts, comment on your ideas, or follow your profile.
          </p>
          <Link href="/login" className="button">
            Login to Share Your Thoughts
          </Link>
        </div>
      </div>
    );
  }

  const iconMap: Record<string, string> = {
    like: '❤️',
    comment: '💬',
    reply: '↩️',
    follow: '👤',
    system: '📢'
  };

  const nonMessageNotifications = notifications.filter((n) => (n.type as string) !== 'message');

  const filteredNotifications = activeFilter === 'all'
    ? nonMessageNotifications
    : nonMessageNotifications.filter((n) => {
        if (activeFilter === 'like') return n.type === 'like';
        if (activeFilter === 'comment') return n.type === 'comment' || n.type === 'reply';
        if (activeFilter === 'follow') return n.type === 'follow';
        return true;
      });

  return (
    <div className="page container" style={{ maxWidth: '650px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="display-title" style={{ fontSize: '1.65rem', margin: 0, color: 'var(--ink)' }}>
            🔔 Notifications
          </h1>
          {unreadCount > 0 ? (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              {unreadCount} new
            </span>
          ) : null}
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="button-ghost"
            style={{ fontSize: '0.82rem', padding: '6px 12px', fontWeight: 600, color: 'var(--ember)' }}
          >
            ✓ Mark all as read
          </button>
        ) : null}
      </div>

      {/* Pending Follow Requests Box (For Private Accounts) */}
      {followRequests.length > 0 && (
        <div
          style={{
            background: 'var(--paper)',
            borderRadius: '20px',
            border: '1px solid var(--line)',
            padding: '18px 20px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
              🔒 Follow Requests ({followRequests.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Private Account</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {followRequests.map((reqUser) => {
              const reqId = reqUser._id || reqUser.id;
              const reqAvatar =
                reqUser.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reqUser.name || 'User')}`;
              const isHandled = processedRequests[reqId];

              return (
                <div
                  key={reqId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--line)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={reqAvatar}
                      alt={reqUser.name}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <Link
                        href={`/profile/${reqUser.username}`}
                        style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ink)', textDecoration: 'none' }}
                      >
                        {reqUser.name}
                      </Link>
                      <div style={{ fontSize: '0.80rem', color: 'var(--muted)' }}>@{reqUser.username}</div>
                    </div>
                  </div>

                  {isHandled ? (
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isHandled === 'accepted' ? '#16a34a' : 'var(--muted)' }}>
                      {isHandled === 'accepted' ? '✓ Accepted' : 'Declined'}
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="button"
                        onClick={() => handleAcceptRequest(reqId)}
                        style={{ fontSize: '0.78rem', padding: '6px 14px', minHeight: 'auto', borderRadius: '16px' }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="button-outline"
                        onClick={() => handleDeclineRequest(reqId)}
                        style={{ fontSize: '0.78rem', padding: '6px 12px', minHeight: 'auto', borderRadius: '16px' }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        className="feed-sort-tabs"
        style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}
      >
        <button
          type="button"
          className={`feed-sort-tab ${activeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('all')}
          style={{ flex: 1 }}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          className={`feed-sort-tab ${activeFilter === 'like' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('like')}
          style={{ flex: 1 }}
        >
          ❤️ Likes
        </button>
        <button
          type="button"
          className={`feed-sort-tab ${activeFilter === 'comment' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('comment')}
          style={{ flex: 1 }}
        >
          💬 Comments
        </button>
        <button
          type="button"
          className={`feed-sort-tab ${activeFilter === 'follow' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('follow')}
          style={{ flex: 1 }}
        >
          👤 Follows
        </button>
      </div>

      {/* Notifications Stream */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p className="empty-state">Loading your activity…</p>
        </div>
      ) : filteredNotifications.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map((item) => {
            const actorName = item.actor?.name || 'Someone';
            const actorAvatar =
              item.actor?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(actorName)}`;
            const targetUrl = item.thought?._id
              ? `/thought/${item.thought._id}`
              : item.actor?.username
              ? `/profile/${item.actor.username}`
              : '#';

            return (
              <div
                key={item._id}
                className="note-card"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 18px',
                  borderRadius: '18px',
                  background: item.read ? 'var(--paper)' : 'var(--paper)',
                  border: item.read ? '1px solid var(--line)' : '1.5px solid var(--ember)',
                  boxShadow: item.read ? 'none' : '0 4px 16px rgba(200, 109, 52, 0.10)',
                  transition: 'transform 140ms ease'
                }}
              >
                {/* Actor Avatar with Action Icon Badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Link href={item.actor?.username ? `/profile/${item.actor.username}` : '#'}>
                    <img
                      src={actorAvatar}
                      alt={actorName}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </Link>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-3px',
                      right: '-3px',
                      background: 'var(--paper)',
                      borderRadius: '50%',
                      fontSize: '0.85rem',
                      lineHeight: 1,
                      padding: '2px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {iconMap[item.type] || '🔔'}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>
                      <Link
                        href={item.actor?.username ? `/profile/${item.actor.username}` : '#'}
                        style={{ fontWeight: 800, textDecoration: 'none', color: 'var(--ink)' }}
                      >
                        {actorName}
                      </Link>{' '}
                      <span style={{ color: 'var(--muted)' }}>
                        {item.type === 'like' && 'liked your thought'}
                        {item.type === 'comment' && 'commented on your thought'}
                        {item.type === 'reply' && 'replied to your comment'}
                        {item.type === 'follow' && 'started following you'}
                        {item.type === 'system' && item.title}
                      </span>
                    </div>

                    {!item.read ? (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--ember)',
                          flexShrink: 0
                        }}
                      />
                    ) : null}
                  </div>

                  {item.body ? (
                    <p
                      style={{
                        margin: '6px 0 0 0',
                        fontSize: '0.86rem',
                        color: 'var(--muted)',
                        background: 'var(--dark-soft)',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        lineHeight: 1.4
                      }}
                    >
                      "{item.body}"
                    </p>
                  ) : null}

                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    {targetUrl !== '#' ? (
                      <Link
                        href={targetUrl}
                        onClick={() => handleMarkOneRead(item._id)}
                        className="button-ghost"
                        style={{
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                          fontWeight: 700,
                          color: 'var(--ember)',
                          background: 'rgba(200, 109, 52, 0.08)',
                          borderRadius: '8px'
                        }}
                      >
                        {item.type === 'follow' ? 'View Profile →' : item.type === 'message' ? 'Open Chat →' : 'View Thought →'}
                      </Link>
                    ) : null}

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {!item.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkOneRead(item._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '0.74rem',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteOne(item._id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '0.82rem',
                          color: '#ef4444',
                          cursor: 'pointer',
                          opacity: 0.75
                        }}
                        title="Delete notification"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '54px 16px',
            background: 'var(--paper)',
            borderRadius: '20px',
            border: '1px solid var(--line)'
          }}
        >
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>✨</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>
            All caught up!
          </h3>
          <p className="section-copy" style={{ margin: '0 auto', fontSize: '0.90rem', maxWidth: '38ch' }}>
            No new activity in this view right now. Share thoughts and engage with authors to get the conversation moving.
          </p>
        </div>
      )}
    </div>
  );
}
