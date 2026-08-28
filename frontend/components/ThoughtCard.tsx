'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import type { Thought, User } from '../types';

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Recent';
  }
}

export function ThoughtCard({
  thought,
  compact = false,
  onDeleted
}: {
  thought: Thought;
  compact?: boolean;
  onDeleted?: (id: string) => void;
}) {
  const { session, ready } = useSession();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(thought.likes?.length || 0);
  const [saves, setSaves] = useState(thought.saves?.length || 0);
  const [shares, setShares] = useState(thought.sharesCount || 0);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentUserId = session?.user?._id || session?.user?.id;
  const isAuthor = Boolean(
    currentUserId &&
      (thought.author?._id === currentUserId ||
        thought.author?.id === currentUserId ||
        (typeof thought.author === 'string' && thought.author === currentUserId))
  );

  useEffect(() => {
    if (!ready || !currentUserId) return;
    const isLiked = (thought.likes || []).some((item) => {
      const id = typeof item === 'string' ? item : item?._id || item?.id;
      return id === currentUserId;
    });
    const isSaved = (thought.saves || []).some((item) => {
      const id = typeof item === 'string' ? item : item?._id || item?.id;
      return id === currentUserId;
    });
    setLiked(Boolean(isLiked));
    setSaved(Boolean(isSaved));
  }, [ready, currentUserId, thought.likes, thought.saves]);

  const token = session?.token;

  const handleLike = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    try {
      const next = await api.likeThought(thought._id, token);
      setLiked(next.liked);
      setLikes(next.likes);
    } catch {
      // ignore error
    }
  };

  const handleSave = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    try {
      const next = await api.saveThought(thought._id, token);
      setSaved(next.saved);
      setSaves(next.saves);
    } catch {
      // ignore error
    }
  };

  const handleShare = async () => {
    if (token) {
      try {
        const next = await api.shareThought(thought._id, token);
        setShares(next.shares);
      } catch {
        // ignore
      }
    }
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/thought/${thought._id}` : '';
    if (navigator.share) {
      navigator.share({ title: thought.author?.name || 'Thought', text: thought.content, url: shareUrl }).catch(() => undefined);
    } else if (navigator.clipboard && shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDelete = async () => {
    if (!token || !confirm('Are you sure you want to delete this thought?')) return;
    setDeleting(true);
    try {
      await api.deleteThought(thought._id, token);
      onDeleted?.(thought._id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not delete thought');
      setDeleting(false);
    }
  };

  const authorName = thought.author?.name || 'Anonymous';
  const authorUsername = thought.author?.username || 'user';
  const authorAvatar =
    thought.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

  return (
    <article className="thought-card" id={`thought-${thought._id}`}>
      <div className="thought-top">
        <div className="brand-lockup">
          <img className="avatar" src={authorAvatar} alt={authorName} />
          <div>
            <Link href={`/profile/${authorUsername}`} className="thought-author">
              {authorName}
            </Link>
            <div className="thought-meta">
              @{authorUsername} · {formatDate(thought.createdAt)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pill">{thought.category}</span>
          {isAuthor ? (
            <button
              className="button-ghost"
              style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#c86d34' }}
              onClick={handleDelete}
              disabled={deleting}
              title="Delete thought"
            >
              {deleting ? '…' : '✕'}
            </button>
          ) : null}
        </div>
      </div>

      <p className="thought-body">{compact && thought.content.length > 180 ? `${thought.content.slice(0, 180)}…` : thought.content}</p>

      {thought.imageUrl ? (
        <div style={{ marginTop: '14px', borderRadius: '12px', overflow: 'hidden' }}>
          <img className="thought-image" src={thought.imageUrl} alt="Thought attachment" loading="lazy" />
        </div>
      ) : null}

      {thought.hashtags?.length ? (
        <div className="hashtag-row">
          {thought.hashtags.map((tag) => (
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="hashtag">
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="thought-actions">
        <button
          className={`thought-action ${liked ? 'is-active' : ''}`}
          onClick={handleLike}
          title={liked ? 'Unlike' : 'Like'}
        >
          {liked ? '♥' : '♡'} {likes}
        </button>
        <Link className="thought-action" href={`/thought/${thought._id}`} title="Comments">
          💬 {thought.commentsCount || 0}
        </Link>
        <button className="thought-action" onClick={handleShare} title="Share thought">
          {copied ? '✓ Copied' : `↗ ${shares}`}
        </button>
        <button
          className={`thought-action ${saved ? 'is-active' : ''}`}
          onClick={handleSave}
          title={saved ? 'Unsave' : 'Save'}
        >
          {saved ? '▣' : '▢'} {saves}
        </button>
      </div>
    </article>
  );
}

export function ProfileCard({
  profile,
  isFollowing,
  onToggleFollow,
  isSelf
}: {
  profile: User;
  isFollowing: boolean;
  onToggleFollow: () => void;
  isSelf?: boolean;
}) {
  const avatarUrl =
    profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`;

  return (
    <aside className="profile-card">
      <div className="profile-top">
        <div className="brand-lockup">
          <img className="avatar-lg" src={avatarUrl} alt={profile.name} />
          <div>
            <h2 className="profile-name">{profile.name}</h2>
            <div className="profile-handle">@{profile.username}</div>
          </div>
        </div>
        {!isSelf ? (
          <button className={`button ${isFollowing ? 'button-outline' : ''}`} onClick={onToggleFollow}>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        ) : (
          <Link href="/settings" className="button-outline">
            Edit
          </Link>
        )}
      </div>
      <p className="profile-bio">{profile.bio || 'Thinking in public.'}</p>
      {profile.location ? <p className="meta" style={{ marginTop: '-8px' }}>📍 {profile.location}</p> : null}
      {profile.website ? (
        <p className="meta" style={{ marginTop: '-4px' }}>
          🔗 <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{profile.website}</a>
        </p>
      ) : null}
      <div className="profile-stats">
        <div className="profile-stat">
          <strong>{typeof profile.followers === 'number' ? profile.followers : profile.followers?.length || 0}</strong>
          <span>Followers</span>
        </div>
        <div className="profile-stat">
          <strong>{typeof profile.following === 'number' ? profile.following : profile.following?.length || 0}</strong>
          <span>Following</span>
        </div>
        <div className="profile-stat">
          <strong>{typeof profile.savedThoughts === 'number' ? profile.savedThoughts : profile.savedThoughts?.length || 0}</strong>
          <span>Saved</span>
        </div>
      </div>
    </aside>
  );
}
