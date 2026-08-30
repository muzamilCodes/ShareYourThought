'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import type { User } from '../types';

export function InstagramRightRail() {
  const { session, ready } = useSession();
  const [suggestedUsers, setSuggestedUsers] = useState<(User & { isFollowing?: boolean })[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    api.getSuggestedUsers(session?.token)
      .then((res) => {
        if (res.users?.length) {
          setSuggestedUsers(res.users);
          const initialFollowState: Record<string, boolean> = {};
          res.users.forEach((u) => {
            const uid = u._id || u.id;
            if (uid) initialFollowState[uid] = Boolean(u.isFollowing);
          });
          setFollowingMap(initialFollowState);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready, session?.token]);

  const handleToggleFollow = async (userId: string) => {
    if (!session?.token) {
      window.location.href = '/login';
      return;
    }

    const currentFollowing = Boolean(followingMap[userId]);
    // Optimistic toggle
    setFollowingMap((prev) => ({ ...prev, [userId]: !currentFollowing }));

    try {
      const res = await api.followUser(userId, session.token);
      setFollowingMap((prev) => ({ ...prev, [userId]: res.following }));
    } catch {
      // Revert on failure
      setFollowingMap((prev) => ({ ...prev, [userId]: currentFollowing }));
    }
  };

  const currentAvatar =
    session?.user?.avatar ||
    (session?.user?.name
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.name)}`
      : 'https://api.dicebear.com/7.x/initials/svg?seed=User');

  const profileHref = session?.user?.username ? `/profile/${session.user.username}` : '/login';

  return (
    <aside className="insta-right-rail desktop-only" aria-label="Instagram Suggested Sidebar">
      {/* 1. Current Logged-in User Card */}
      {ready && session ? (
        <div className="insta-user-switch-row">
          <Link href={profileHref} className="insta-user-avatar-wrap">
            <img src={currentAvatar} alt={session.user.name} className="insta-user-avatar" />
          </Link>
          <div className="insta-user-info">
            <Link href={profileHref} className="insta-username-link">
              {session.user.username}
            </Link>
            <span className="insta-fullname">{session.user.name}</span>
          </div>
          <Link href="/profile" className="insta-switch-btn">
            Switch
          </Link>
        </div>
      ) : ready ? (
        <div className="insta-user-switch-row" style={{ padding: '12px', background: 'var(--paper)', borderRadius: '16px', border: '1px solid var(--line)' }}>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '0.90rem', color: 'var(--ink)' }}>Welcome to ThoughtShare</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Join the community today.</span>
          </div>
          <Link href="/login" className="button" style={{ fontSize: '0.78rem', padding: '5px 12px', minHeight: 'auto' }}>
            Sign In
          </Link>
        </div>
      ) : null}

      {/* 2. Suggested For You Section */}
      <div className="insta-suggested-header">
        <span className="insta-suggested-title">Suggested for you</span>
        <Link href="/explore" className="insta-see-all-link">
          See all
        </Link>
      </div>

      {/* Suggested Users List */}
      <div className="insta-suggested-list">
        {loading ? (
          <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)' }}>
            Finding creators…
          </div>
        ) : suggestedUsers.length ? (
          suggestedUsers.slice(0, 5).map((user) => {
            const uid = user._id || user.id || '';
            const uAvatar =
              user.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.username)}`;
            const isFollowing = Boolean(followingMap[uid]);

            return (
              <div key={uid} className="insta-suggested-item">
                <Link href={`/profile/${user.username}`} className="insta-suggested-avatar-wrap">
                  <img src={uAvatar} alt={user.name} className="insta-suggested-avatar" />
                </Link>
                <div className="insta-suggested-info">
                  <Link href={`/profile/${user.username}`} className="insta-suggested-username">
                    {user.username}
                  </Link>
                  <span className="insta-suggested-subtitle">
                    {user.bio ? (user.bio.length > 28 ? `${user.bio.slice(0, 28)}…` : user.bio) : 'Suggested for you'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleFollow(uid)}
                  className={`insta-follow-btn ${isFollowing ? 'is-following' : ''}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '12px 0', fontSize: '0.80rem', color: 'var(--muted)' }}>
            No new suggestions right now.
          </div>
        )}
      </div>

      {/* 3. Footer Meta & Copyright */}
      <footer className="insta-rail-footer">
        <nav className="insta-footer-links">
          <Link href="/about">About</Link> · 
          <Link href="/explore">Explore</Link> · 
          <Link href="/trending">Trending</Link> · 
          <Link href="/settings">Settings</Link> · 
          <Link href="/help">Help</Link> · 
          <Link href="/privacy">Privacy</Link> · 
          <Link href="/terms">Terms</Link>
        </nav>
        <div className="insta-footer-copy">
          © {new Date().getFullYear()} SHARE YOUR THOUGHTS FROM MUZAMIL
        </div>
      </footer>

      {/* 4. Floating Instagram Messages Pill at Bottom Right */}
      <Link href="/messages" className="insta-floating-messenger" title="Direct Messages">
        <span className="insta-messenger-icon">💬</span>
        <span className="insta-messenger-text">Messages</span>
      </Link>
    </aside>
  );
}
