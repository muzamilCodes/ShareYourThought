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
  const [currentThought, setCurrentThought] = useState<Thought>(thought);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(thought.likes?.length || 0);
  const [saves, setSaves] = useState(thought.saves?.length || 0);
  const [shares, setShares] = useState(thought.sharesCount || 0);
  const [views, setViews] = useState(thought.viewsCount || 0);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Three-dots menu & Edit mode state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(thought.content);
  const [editCategory, setEditCategory] = useState(thought.category);
  const [editImageUrl, setEditImageUrl] = useState(thought.imageUrl || '');
  const [editHashtags, setEditHashtags] = useState((thought.hashtags || []).join(', '));
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const currentUserId = session?.user?._id || session?.user?.id;
  const isAuthor = Boolean(
    currentUserId &&
      (currentThought.author?._id === currentUserId ||
        currentThought.author?.id === currentUserId ||
        (typeof currentThought.author === 'string' && currentThought.author === currentUserId))
  );

  useEffect(() => {
    setCurrentThought(thought);
    setEditContent(thought.content);
    setEditCategory(thought.category);
    setEditImageUrl(thought.imageUrl || '');
    setEditHashtags((thought.hashtags || []).join(', '));
    setLikes(thought.likes?.length || 0);
    setSaves(thought.saves?.length || 0);
    setShares(thought.sharesCount || 0);
    setViews(thought.viewsCount || 0);

    // Record view quietly
    api.recordView(thought._id)
      .then((res) => {
        if (res?.views) setViews(res.views);
      })
      .catch(() => {});
  }, [thought]);

  useEffect(() => {
    if (!ready || !currentUserId) return;
    const isLiked = (currentThought.likes || []).some((item) => {
      const id = typeof item === 'string' ? item : item?._id || item?.id;
      return id === currentUserId;
    });
    const isSaved = (currentThought.saves || []).some((item) => {
      const id = typeof item === 'string' ? item : item?._id || item?.id;
      return id === currentUserId;
    });
    setLiked(Boolean(isLiked));
    setSaved(Boolean(isSaved));
  }, [ready, currentUserId, currentThought.likes, currentThought.saves]);

  const token = session?.token;

  const handleLike = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    try {
      const next = await api.likeThought(currentThought._id, token);
      setLiked(next.liked);
      setLikes(next.likes);
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    try {
      const next = await api.saveThought(currentThought._id, token);
      setSaved(next.saved);
      setSaves(next.saves);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (token) {
      try {
        const next = await api.shareThought(currentThought._id, token);
        setShares(next.shares);
      } catch {
        // ignore
      }
    }
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/thought/${currentThought._id}` : '';
    if (navigator.share) {
      navigator
        .share({
          title: currentThought.author?.name || 'Thought',
          text: currentThought.content,
          url: shareUrl
        })
        .catch(() => undefined);
    } else if (navigator.clipboard && shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!token || !confirm('Are you sure you want to delete this thought?')) return;
    setDeleting(true);
    try {
      await api.deleteThought(currentThought._id, token);
      onDeleted?.(currentThought._id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not delete thought');
      setDeleting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!editContent.trim()) {
      setEditError('Content cannot be empty');
      return;
    }

    setSavingEdit(true);
    setEditError('');

    try {
      const updated = await api.updateThought(
        currentThought._id,
        {
          content: editContent.trim(),
          category: editCategory.trim(),
          imageUrl: editImageUrl.trim(),
          hashtags: editHashtags
        },
        token
      );
      setCurrentThought(updated.thought);
      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update thought');
    } finally {
      setSavingEdit(false);
    }
  };

  const authorName = currentThought.author?.name || 'Anonymous';
  const authorUsername = currentThought.author?.username || 'user';
  const authorAvatar =
    currentThought.author?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

  return (
    <article className="thought-card" id={`thought-${currentThought._id}`} style={{ position: 'relative' }}>
      <div className="thought-top">
        <div className="brand-lockup">
          <img className="avatar" src={authorAvatar} alt={authorName} />
          <div>
            <Link href={`/profile/${authorUsername}`} className="thought-author">
              {authorName}
            </Link>
            <div className="thought-meta">
              @{authorUsername} · {formatDate(currentThought.createdAt)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <span className="pill">#{currentThought.category}</span>

          {/* Three-dots Menu for Author */}
          {isAuthor ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="button-ghost"
                style={{
                  padding: '4px 8px',
                  fontSize: '1.2rem',
                  lineHeight: '1',
                  borderRadius: '6px'
                }}
                onClick={() => setMenuOpen((prev) => !prev)}
                title="Options"
              >
                ⋮
              </button>

              {menuOpen ? (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '4px',
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      padding: '4px',
                      zIndex: 20,
                      minWidth: '130px'
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '4px',
                        color: 'inherit'
                      }}
                      onClick={() => {
                        setMenuOpen(false);
                        setIsEditing(true);
                      }}
                    >
                      <span>✏️</span> Edit Thought
                    </button>
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '4px',
                        color: '#c86d34'
                      }}
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      <span>🗑️</span> {deleting ? 'Deleting…' : 'Delete Thought'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Inline Edit Form Mode */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} style={{ marginTop: '16px' }}>
          <div className="field">
            <textarea
              className="textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              required
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div className="field">
              <label style={{ fontSize: '0.8rem' }}>Category</label>
              <input
                className="input"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="e.g. Life, Tech"
                required
              />
            </div>
            <div className="field">
              <label style={{ fontSize: '0.8rem' }}>Hashtags</label>
              <input
                className="input"
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="tag1, tag2"
              />
            </div>
          </div>
          <div className="field" style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Attach Image (File or URL)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                className="input"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="Paste URL or choose file →"
                style={{ flex: 1 }}
              />
              <label
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--line-strong)',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                📷 Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const { fileToCompressedDataUrl } = await import('../lib/imageUtils');
                        const dataUrl = await fileToCompressedDataUrl(file);
                        setEditImageUrl(dataUrl);
                      } catch {
                        // ignore
                      }
                    }
                  }}
                />
              </label>
            </div>
            {editImageUrl ? (
              <div style={{ marginTop: '8px', position: 'relative', display: 'inline-block' }}>
                <img
                  src={editImageUrl}
                  alt="Attachment preview"
                  style={{ height: '70px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => setEditImageUrl('')}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            ) : null}
          </div>

          {editError ? <p className="helper" style={{ color: '#c86d34' }}>{editError}</p> : null}

          <div className="form-actions" style={{ marginTop: '14px' }}>
            <button className="button" type="submit" disabled={savingEdit}>
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              className="button-outline"
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(currentThought.content);
                setEditCategory(currentThought.category);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="thought-body">
            {compact && currentThought.content.length > 180
              ? `${currentThought.content.slice(0, 180)}…`
              : currentThought.content}
          </p>

          {currentThought.imageUrl ? (
            <div style={{ marginTop: '14px', borderRadius: '12px', overflow: 'hidden' }}>
              <img className="thought-image" src={currentThought.imageUrl} alt="Thought attachment" loading="lazy" />
            </div>
          ) : null}

          {currentThought.hashtags?.length ? (
            <div className="hashtag-row">
              {currentThought.hashtags.map((tag) => (
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
            <Link className="thought-action" href={`/thought/${currentThought._id}`} title="Comments">
              💬 {currentThought.commentsCount || 0}
            </Link>
            <span className="thought-action view-badge" title="Views">
              👁️ {views}
            </span>
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
        </>
      )}
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
          🔗{' '}
          <a
            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'underline' }}
          >
            {profile.website}
          </a>
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
