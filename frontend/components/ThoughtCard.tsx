'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import { ConfirmModal } from './ConfirmModal';
import { ShareModal } from './ShareModal';
import { ReportModal } from './ReportModal';
import { playSuccessSound } from '../lib/soundUtils';
import type { Comment, Thought, User } from '../types';

// Global session memory to prevent spamming duplicate views for the same thought
const sessionViewedThoughts = new Set<string>();

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Recent';
  }
}

export function CustomBookmarkIcon({ saved, size = 18 }: { saved: boolean; size?: number }) {
  if (saved) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="var(--ember)"
        stroke="var(--ember)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'inline-block', verticalAlign: 'middle', transition: 'all 150ms ease' }}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', transition: 'all 150ms ease' }}
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
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
  const cardRef = useRef<HTMLElement | null>(null);
  const [currentThought, setCurrentThought] = useState<Thought>(thought);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(thought.likes?.length || 0);
  const [saves, setSaves] = useState(thought.saves?.length || 0);
  const [shares, setShares] = useState(thought.sharesCount || 0);
  const [views, setViews] = useState(thought.viewsCount || 0);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Share Modal & Reaction states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Three-dots menu & Edit mode state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(thought.content);
  const [editCategory, setEditCategory] = useState(thought.category);
  const [editImageUrl, setEditImageUrl] = useState(thought.imageUrl || '');
  const [editHashtags, setEditHashtags] = useState(Array.isArray(thought.hashtags) ? thought.hashtags.join(', ') : (thought.hashtags || ''));
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const currentUserId = session?.user?._id || session?.user?.id;
  const isAuthor = Boolean(
    currentUserId &&
      (currentThought.author?._id === currentUserId ||
        currentThought.author?.id === currentUserId ||
        (typeof currentThought.author === 'string' && currentThought.author === currentUserId))
  );

  const handleSelectReaction = (emoji: string) => {
    setSelectedReaction(emoji);
    setShowReactionPicker(false);
    playSuccessSound();
    if (!liked) {
      handleLike();
    }
  };

  useEffect(() => {
    setCurrentThought(thought);
    setEditContent(thought.content);
    setEditCategory(thought.category);
    setEditImageUrl(thought.imageUrl || '');
    setEditHashtags(Array.isArray(thought.hashtags) ? thought.hashtags.join(', ') : (thought.hashtags || ''));
    setLikes(thought.likes?.length || 0);
    setSaves(thought.saves?.length || 0);
    setShares(thought.sharesCount || 0);
    setViews(thought.viewsCount || 0);
  }, [thought]);

  // Real View / Viewport Impression Tracking (only counts when visible in view area)
  useEffect(() => {
    if (!thought?._id) return;
    const thoughtId = thought._id;

    if (sessionViewedThoughts.has(thoughtId)) return;

    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      if (!sessionViewedThoughts.has(thoughtId)) {
        sessionViewedThoughts.add(thoughtId);
        api.recordView(thoughtId)
          .then((res) => {
            if (typeof res?.views === 'number') setViews(res.views);
          })
          .catch(() => {});
      }
      return;
    }

    let impressionTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          if (!impressionTimer) {
            impressionTimer = setTimeout(() => {
              if (!sessionViewedThoughts.has(thoughtId)) {
                sessionViewedThoughts.add(thoughtId);
                api.recordView(thoughtId)
                  .then((res) => {
                    if (typeof res?.views === 'number') setViews(res.views);
                  })
                  .catch(() => {});
              }
              observer.disconnect();
            }, 600);
          }
        } else {
          if (impressionTimer) {
            clearTimeout(impressionTimer);
            impressionTimer = null;
          }
        }
      },
      {
        threshold: [0.35],
        rootMargin: '0px'
      }
    );

    observer.observe(el);

    return () => {
      if (impressionTimer) clearTimeout(impressionTimer);
      observer.disconnect();
    };
  }, [thought._id]);

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
    const prevLiked = liked;
    const prevLikes = likes;
    // Optimistic instant feedback
    setLiked(!prevLiked);
    setLikes(prevLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1);

    try {
      const next = await api.likeThought(currentThought._id, token);
      setLiked(next.liked);
      setLikes(next.likes);
    } catch {
      // Revert if error occurs
      setLiked(prevLiked);
      setLikes(prevLikes);
    }
  };

  const handleSave = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const prevSaved = saved;
    const prevSaves = saves;
    // Optimistic instant feedback
    setSaved(!prevSaved);
    setSaves(prevSaved ? Math.max(0, prevSaves - 1) : prevSaves + 1);

    try {
      const next = await api.saveThought(currentThought._id, token);
      setSaved(next.saved);
      setSaves(next.saves);
    } catch {
      // Revert if error occurs
      setSaved(prevSaved);
      setSaves(prevSaves);
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    setMenuOpen(false);
    setShowDeleteModal(true);
  };

  const confirmDeleteThought = async () => {
    if (!token) return;
    setDeleting(true);
    try {
      await api.deleteThought(currentThought._id, token);
      setShowDeleteModal(false);
      onDeleted?.(currentThought._id);
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
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

  const [quickComment, setQuickComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(thought.commentsCount || 0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const toggleComments = async () => {
    if (!showComments && !commentsList.length) {
      setLoadingComments(true);
      try {
        const data = await api.getComments(currentThought._id);
        setCommentsList(data.comments || []);
      } catch {
        // ignore
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments((prev) => !prev);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Trigger heart burst
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
      if (!liked) {
        handleLike();
      }
    }
    setLastTap(now);
  };

  const handleQuickCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (!quickComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.createComment(currentThought._id, { content: quickComment.trim() }, token);
      if (res.comment) {
        setCommentsList((prev) => [...prev, res.comment]);
      }
      setCommentsCount((c) => c + 1);
      setQuickComment('');
      setShowComments(true);
    } catch {
      // ignore comment error
    } finally {
      setSubmittingComment(false);
    }
  };

  const authorName = currentThought.author?.name || 'Anonymous';
  const authorUsername = currentThought.author?.username || 'user';
  const authorAvatar =
    currentThought.author?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

  return (
    <article ref={cardRef} className="thought-card instagram-card" id={`thought-${currentThought._id}`} style={{ position: 'relative' }}>
      {/* Instagram Floating Heart Animation */}
      {showHeartBurst && (
        <div className="heart-burst-overlay">
          <span className="heart-burst-icon">❤️</span>
        </div>
      )}

      <div className="thought-top">
        <div className="brand-lockup">
          <div className="insta-avatar-ring">
            <img className="avatar" src={authorAvatar} alt={authorName} />
          </div>
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

          {/* Options Dropdown for Everyone */}
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
                    minWidth: '140px'
                  }}
                >
                  {isAuthor && (
                    <>
                      <button
                        type="button"
                        className="button-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem', padding: '6px 10px' }}
                        onClick={() => {
                          setIsEditing(true);
                          setMenuOpen(false);
                        }}
                      >
                        <span>✏️</span> Edit Thought
                      </button>
                      <button
                        type="button"
                        className="button-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem', padding: '6px 10px', color: '#c86d34' }}
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        <span>🗑️</span> {deleting ? 'Deleting…' : 'Delete Thought'}
                      </button>
                    </>
                  )}

                  {session?.user?.role === 'admin' && (
                    <button
                      type="button"
                      className="button-ghost"
                      style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem', padding: '6px 10px', color: 'var(--ember)' }}
                      onClick={async () => {
                        if (!session?.token) return;
                        try {
                          await api.toggleAdminFeatureThought(currentThought._id, session.token);
                          setMenuOpen(false);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      <span>⭐</span> Feature Thought
                    </button>
                  )}

                  <button
                    type="button"
                    className="button-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem', padding: '6px 10px', color: '#ef4444' }}
                    onClick={() => {
                      setShowReportModal(true);
                      setMenuOpen(false);
                    }}
                  >
                    <span>🚨</span> Report Thought
                  </button>
                </div>
              </>
            ) : null}
          </div>
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
                  background: 'var(--paper)',
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
                  style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => setEditImageUrl('')}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
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
          {/* Main Content with Double-Tap to Like */}
          <div onClick={handleDoubleTap} style={{ cursor: 'pointer', userSelect: 'none' }}>
            {currentThought.imageUrl ? (
              <div className="insta-post-media" style={{ marginBottom: '12px', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                <img className="thought-image" src={currentThought.imageUrl} alt="Thought attachment" loading="lazy" />
              </div>
            ) : null}

            <p className="thought-body" style={{ margin: '8px 0 6px 0', fontSize: '0.96rem', lineHeight: '1.5' }}>
              {compact && currentThought.content.length > 180
                ? `${currentThought.content.slice(0, 180)}…`
                : currentThought.content}
            </p>
          </div>

          {Array.isArray(currentThought.hashtags) && currentThought.hashtags.length ? (
            <div className="hashtag-row" style={{ marginTop: '8px' }}>
              {currentThought.hashtags.map((tag: string) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="hashtag">
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}

          {/* Instagram Action Row with Audio Reader & Reactions */}
          <div className="thought-actions insta-actions-bar" style={{ marginTop: '12px', position: 'relative' }}>
            {/* Quick Emoji Reactions Hover Drawer */}
            {showReactionPicker ? (
              <div
                style={{
                  position: 'absolute',
                  top: '-46px',
                  left: '0',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '30px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 20,
                  animation: 'fadeIn 150ms ease'
                }}
              >
                {['❤️', '🔥', '💡', '👏', '🤯'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectReaction(emoji)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      padding: '2px',
                      transition: 'transform 120ms ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.35)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <button
                  className={`thought-action insta-action-btn ${liked ? 'is-active is-liked' : ''}`}
                  onClick={handleLike}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowReactionPicker((prev) => !prev);
                  }}
                  title={liked ? 'Unlike' : 'Like (Right click for emojis)'}
                >
                  <span className="insta-action-icon">{selectedReaction || (liked ? '❤️' : '🤍')}</span>
                  <span>{likes}</span>
                </button>
              </div>

              <button
                type="button"
                className={`thought-action insta-action-btn ${showComments ? 'is-active' : ''}`}
                onClick={toggleComments}
                title="View & Post Comments"
              >
                <span className="insta-action-icon">💬</span>
                <span>{commentsCount}</span>
              </button>

              <button
                type="button"
                className="thought-action insta-action-btn"
                onClick={() => setIsShareModalOpen(true)}
                title="Share thought"
              >
                <span className="insta-action-icon">↗️</span>
                <span>{shares}</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="thought-action view-badge" title="Views">
                👁️ {views}
              </span>
              <button
                className={`thought-action insta-action-btn ${saved ? 'is-active is-saved' : ''}`}
                onClick={handleSave}
                title={saved ? 'Remove Bookmark' : 'Save Thought'}
                aria-label={saved ? 'Remove Bookmark' : 'Save Thought'}
              >
                <CustomBookmarkIcon saved={saved} size={19} />
              </button>
            </div>
          </div>

          {/* Likes Counter & Inline Comments Toggle */}
          <div style={{ padding: '6px 0 2px 0', fontSize: '0.84rem' }}>
            <strong style={{ color: 'var(--ink)' }}>{likes} {likes === 1 ? 'like' : 'likes'}</strong>
            {commentsCount > 0 ? (
              <div style={{ marginTop: '3px' }}>
                <button
                  type="button"
                  onClick={toggleComments}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: 'var(--muted)',
                    fontSize: '0.80rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {showComments ? 'Hide comments' : `View all ${commentsCount} comments`}
                </button>
              </div>
            ) : null}
          </div>

          {/* Expandable Inline Comments List */}
          {showComments ? (
            <div
              style={{
                marginTop: '10px',
                padding: '12px 14px',
                background: 'var(--dark-soft)',
                borderRadius: '14px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '260px',
                overflowY: 'auto'
              }}
            >
              {loadingComments ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center', padding: '10px 0' }}>
                  Loading comments…
                </div>
              ) : commentsList.length ? (
                commentsList.map((comm) => {
                  const cAuthorName = comm.author?.name || 'User';
                  const cAvatar =
                    comm.author?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cAuthorName)}`;
                  return (
                    <div key={comm._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem' }}>
                      <img
                        src={cAvatar}
                        alt={cAuthorName}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, color: 'var(--ink)', marginRight: '6px' }}>
                          {comm.author?.username ? `@${comm.author.username}` : cAuthorName}
                        </span>
                        <span style={{ color: 'var(--ink)', wordBreak: 'break-word' }}>{comm.content}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center', padding: '6px 0' }}>
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
          ) : null}

          {/* Instagram Quick Comment Input with Current User Avatar */}
          <form className="insta-quick-comment-form" onSubmit={handleQuickCommentSubmit}>
            <img
              src={
                session?.user?.avatar ||
                (session?.user?.name
                  ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.name)}`
                  : 'https://api.dicebear.com/7.x/initials/svg?seed=User')
              }
              alt={session?.user?.name || 'You'}
              className="avatar-sm"
              style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
            <input
              type="text"
              placeholder="Add a comment…"
              value={quickComment}
              onChange={(e) => setQuickComment(e.target.value)}
              className="insta-quick-comment-input"
              aria-label="Add a quick comment"
            />
            {quickComment.trim() ? (
              <button
                type="submit"
                className="insta-quick-comment-btn"
                disabled={submittingComment}
              >
                {submittingComment ? '…' : 'Post'}
              </button>
            ) : null}
          </form>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Thought?"
        message="This thought will be permanently removed from your stream and public feeds."
        confirmText="Delete"
        cancelText="Keep"
        type="danger"
        loading={deleting}
        onConfirm={confirmDeleteThought}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Modern Share Sheet Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        thought={currentThought}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          targetType="thought"
          targetId={currentThought._id}
          token={session?.token}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </article>
  );
}

export { ProfileCard } from './ProfileCard';
