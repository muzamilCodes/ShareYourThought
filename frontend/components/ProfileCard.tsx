'use client';

import Link from 'next/link';
import type { User } from '../types';

interface ProfileCardProps {
  profile: User;
  isFollowing?: boolean;
  isRequested?: boolean;
  onToggleFollow?: () => void;
  isSelf?: boolean;
  activeTab?: 'thoughts' | 'followers' | 'following' | 'saved';
  onTabChange?: (tab: 'thoughts' | 'followers' | 'following' | 'saved') => void;
  thoughtsCount?: number;
  followersCount?: number;
  followingCount?: number;
  savedCount?: number;
}

export function ProfileCard({
  profile,
  isFollowing = false,
  isRequested = false,
  onToggleFollow,
  isSelf = false,
  activeTab = 'thoughts',
  onTabChange,
  thoughtsCount = 0,
  followersCount,
  followingCount,
  savedCount = 0
}: ProfileCardProps) {
  const avatarUrl =
    profile.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'User')}`;

  const followersNum =
    typeof followersCount === 'number'
      ? followersCount
      : typeof profile.followers === 'number'
      ? profile.followers
      : profile.followers?.length || 0;

  const followingNum =
    typeof followingCount === 'number'
      ? followingCount
      : typeof profile.following === 'number'
      ? profile.following
      : profile.following?.length || 0;

  return (
    <div
      className="profile-card"
      style={{
        background: 'var(--paper)',
        borderRadius: '24px',
        border: '1px solid var(--line)',
        padding: '24px',
        boxShadow: 'var(--shadow)'
      }}
    >
      {/* Top Header: Avatar + Name + Edit/Follow Button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src={avatarUrl}
            alt={profile.name}
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2.5px solid var(--ember)',
              boxShadow: '0 4px 14px rgba(200, 109, 52, 0.2)'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                {profile.name}
              </h1>
              {profile.isPrivate ? (
                <span title="Private Account" style={{ fontSize: '0.95rem' }}>🔒</span>
              ) : null}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '2px' }}>
              @{profile.username}
            </div>
          </div>
        </div>

        {isSelf ? (
          <Link
            href="/settings"
            className="button-outline"
            style={{ fontSize: '0.86rem', padding: '6px 16px', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>⚙️</span> Edit Profile & Settings
          </Link>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href={`/messages?user=${profile.username}`}
              className="button-outline"
              style={{ fontSize: '0.86rem', padding: '6px 14px', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>💬</span> Message
            </Link>

            {onToggleFollow ? (
              <button
                type="button"
                onClick={onToggleFollow}
                className={isFollowing || isRequested ? 'button-outline' : 'button'}
                style={{ fontSize: '0.86rem', padding: '6px 18px', minHeight: 'auto' }}
              >
                {isFollowing ? 'Following' : isRequested ? 'Requested 🔒' : profile.isPrivate ? 'Follow 🔒' : 'Follow'}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Bio, Location, Website */}
      {profile.bio ? (
        <p style={{ margin: '16px 0 12px 0', fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.55 }}>
          {profile.bio}
        </p>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '12px 0 18px 0', fontSize: '0.84rem', color: 'var(--muted)' }}>
        {profile.location ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            📍 {profile.location}
          </span>
        ) : null}
        {profile.website ? (
          <a
            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ember)', textDecoration: 'underline' }}
          >
            🔗 {profile.website}
          </a>
        ) : null}
      </div>

      {/* Stat Tabs (Thoughts, Followers, Following, Saved) */}
      <div className="profile-stats" style={{ marginTop: '16px' }}>
        <button
          type="button"
          className={`profile-stat ${activeTab === 'thoughts' ? 'is-active' : ''}`}
          onClick={() => onTabChange?.('thoughts')}
          style={{ cursor: 'pointer', textAlign: 'center', border: 'none' }}
        >
          <strong style={{ fontSize: '1.25rem' }}>{thoughtsCount}</strong>
          <span style={{ fontSize: '0.78rem' }}>Thoughts</span>
        </button>

        <button
          type="button"
          className={`profile-stat ${activeTab === 'followers' ? 'is-active' : ''}`}
          onClick={() => onTabChange?.('followers')}
          style={{ cursor: 'pointer', textAlign: 'center', border: 'none' }}
        >
          <strong style={{ fontSize: '1.25rem' }}>{followersNum}</strong>
          <span style={{ fontSize: '0.78rem' }}>Followers</span>
        </button>

        <button
          type="button"
          className={`profile-stat ${activeTab === 'following' ? 'is-active' : ''}`}
          onClick={() => onTabChange?.('following')}
          style={{ cursor: 'pointer', textAlign: 'center', border: 'none' }}
        >
          <strong style={{ fontSize: '1.25rem' }}>{followingNum}</strong>
          <span style={{ fontSize: '0.78rem' }}>Following</span>
        </button>

        {isSelf ? (
          <button
            type="button"
            className={`profile-stat ${activeTab === 'saved' ? 'is-active' : ''}`}
            onClick={() => onTabChange?.('saved')}
            style={{ cursor: 'pointer', textAlign: 'center', border: 'none' }}
          >
            <strong style={{ fontSize: '1.25rem' }}>{savedCount}</strong>
            <span style={{ fontSize: '0.78rem' }}>Saved</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
