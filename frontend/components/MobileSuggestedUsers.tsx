'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import type { User } from '../types';

export function MobileSuggestedUsers() {
  const { session, ready } = useSession();
  const [users, setUsers] = useState<(User & { isFollowing?: boolean })[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSuggested = async () => {
    try {
      setLoading(true);
      const res = await api.getSuggestedUsers(session?.token);
      if (res.users && res.users.length > 0) {
        setUsers(res.users);
        const map: Record<string, boolean> = {};
        res.users.forEach((u) => {
          const uid = u._id || u.id;
          if (uid) map[uid] = Boolean(u.isFollowing);
        });
        setFollowingMap(map);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchSuggested();
    }
  }, [ready, session?.token]);

  const handleToggleFollow = async (userId: string) => {
    if (!session?.token) {
      window.location.href = '/login';
      return;
    }

    const currentFollowing = Boolean(followingMap[userId]);
    setFollowingMap((prev) => ({ ...prev, [userId]: !currentFollowing }));

    try {
      const res = await api.followUser(userId, session.token);
      setFollowingMap((prev) => ({ ...prev, [userId]: res.following }));
      window.dispatchEvent(new CustomEvent('follow-status-updated', { detail: { userId, following: res.following } }));
    } catch {
      setFollowingMap((prev) => ({ ...prev, [userId]: currentFollowing }));
    }
  };

  if (dismissed || loading) return null;

  // Only show users who are NOT followed yet
  const unfollowedUsers = users.filter((u) => !followingMap[u._id || u.id || '']);
  if (!unfollowedUsers.length) return null;

  return (
    <div
      style={{
        background: 'var(--paper)',
        borderRadius: '20px',
        border: '1px solid var(--line)',
        padding: '16px',
        margin: '16px 0',
        boxShadow: 'var(--shadow)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1.1rem' }}>👥</span>
          <strong style={{ fontSize: '0.90rem', color: 'var(--ink)' }}>Suggested For You</strong>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '2px 6px'
          }}
          title="Dismiss suggestions"
          aria-label="Dismiss suggestions"
        >
          ✕
        </button>
      </div>

      {/* Horizontal Carousel of Unfollowed Creators */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {unfollowedUsers.slice(0, 6).map((user) => {
          const uid = user._id || user.id || '';
          const isFollowing = Boolean(followingMap[uid]);
          const avatar =
            user.avatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`;

          return (
            <div
              key={uid}
              style={{
                flex: '0 0 130px',
                scrollSnapAlign: 'start',
                background: 'var(--dark-soft)',
                borderRadius: '16px',
                border: '1px solid var(--line)',
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '6px'
              }}
            >
              <Link
                href={`/profile/${user.username}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}
              >
                <img
                  src={avatar}
                  alt={user.name}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', marginBottom: '4px' }}
                />
                <strong
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--ink)',
                    maxWidth: '110px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {user.name}
                </strong>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--muted)',
                    maxWidth: '110px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  @{user.username}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => handleToggleFollow(uid)}
                className={isFollowing ? 'button-outline' : 'button'}
                style={{
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  width: '100%',
                  borderRadius: '10px',
                  minHeight: '26px'
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
