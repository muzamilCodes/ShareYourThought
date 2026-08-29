'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import type { Thought } from '../types';

export interface AuthorStoryGroup {
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  isSelf?: boolean;
  thoughts: Thought[];
}

interface StoryViewerProps {
  storyGroups: AuthorStoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

function formatRelativeTime(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return 'Recent';
  }
}

export function StoryViewer({ storyGroups, initialGroupIndex, onClose }: StoryViewerProps) {
  const { session } = useSession();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const currentGroup = storyGroups[groupIndex] || storyGroups[0];
  const stories = currentGroup?.thoughts || [];
  const currentStory = stories[storyIndex] || stories[0];

  const DURATION = 5000; // 5 seconds per story
  const INTERVAL = 50; // update progress every 50ms

  // Sync likes for current story
  useEffect(() => {
    if (!currentStory) return;
    setLikesCount(currentStory.likes?.length || 0);
    if (session?.user) {
      const myId = session.user._id || session.user.id;
      const isLiked = (currentStory.likes || []).some((item) => {
        const id = typeof item === 'string' ? item : item?._id || item?.id;
        return id === myId;
      });
      setLiked(Boolean(isLiked));
    }
    // Record view quietly
    if (currentStory._id) {
      api.recordView(currentStory._id).catch(() => {});
    }
  }, [currentStory, session?.user]);

  const handleNext = useCallback(() => {
    setProgress(0);
    if (storyIndex < stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [storyIndex, stories.length, groupIndex, storyGroups.length, onClose]);

  const handlePrev = useCallback(() => {
    setProgress(0);
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((prev) => prev - 1);
      const prevGroup = storyGroups[groupIndex - 1];
      setStoryIndex(Math.max(0, (prevGroup?.thoughts?.length || 1) - 1));
    }
  }, [storyIndex, groupIndex, storyGroups]);

  // Story progress timer
  useEffect(() => {
    if (isPaused || !currentStory) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (INTERVAL / DURATION) * 100;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, currentStory, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scrolling while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleNext, handlePrev, onClose]);

  const handleLike = async () => {
    if (!session?.token) {
      window.location.href = '/login';
      return;
    }
    if (!currentStory?._id) return;

    triggerReaction('❤️');
    try {
      const res = await api.likeThought(currentStory._id, session.token);
      setLiked(res.liked);
      setLikesCount(res.likes);
    } catch {
      // ignore
    }
  };

  const triggerReaction = (emoji: string) => {
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 1200);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) {
      window.location.href = '/login';
      return;
    }
    if (!replyText.trim() || !currentStory?._id) return;

    setSendingReply(true);
    try {
      await api.createComment(currentStory._id, { content: replyText.trim() }, session.token);
      setReplyText('');
      triggerReaction('💬');
    } catch {
      // ignore
    } finally {
      setSendingReply(false);
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="story-modal-backdrop">
      {/* Background Blur Overlay */}
      <div className="story-modal-overlay" onClick={onClose} />

      {/* Main Story Container */}
      <div
        className="story-player-card"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Floating Heart / Reaction Burst */}
        {floatingReaction && (
          <div className="story-reaction-burst">
            <span>{floatingReaction}</span>
          </div>
        )}

        {/* Top Progress Bars (Multi-story segments) */}
        <div className="story-progress-bar-container">
          {stories.map((s, idx) => {
            let widthPercent = 0;
            if (idx < storyIndex) widthPercent = 100;
            else if (idx === storyIndex) widthPercent = progress;
            else widthPercent = 0;

            return (
              <div key={s._id || idx} className="story-progress-track">
                <div
                  className="story-progress-fill"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div className="story-player-header">
          <div className="story-author-lockup">
            <div className="story-avatar-ring is-live">
              <img
                src={currentGroup.authorAvatar}
                alt={currentGroup.authorName}
                className="story-avatar"
              />
            </div>
            <div className="story-author-info">
              <div className="story-author-name">
                <Link
                  href={`/profile/${currentGroup.authorUsername}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 700 }}
                >
                  {currentGroup.authorName}
                </Link>
                <span className="story-time-badge">{formatRelativeTime(currentStory.createdAt)}</span>
              </div>
              <span className="story-category-tag">#{currentStory.category || 'Thought'}</span>
            </div>
          </div>

          <div className="story-header-actions">
            {isPaused && <span className="story-paused-pill">Paused</span>}
            <button
              type="button"
              className="story-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close story (Esc)"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Story Visual Body */}
        <div className="story-body-content">
          {currentStory.imageUrl ? (
            <div className="story-media-wrapper">
              <img
                src={currentStory.imageUrl}
                alt="Story visual"
                className="story-media-image"
              />
              <div className="story-media-overlay" />
            </div>
          ) : (
            <div className="story-gradient-bg" />
          )}

          {/* Text Content Overlay */}
          <div className="story-text-container">
            <blockquote className="story-thought-text">
              "{currentStory.content}"
            </blockquote>

            {currentStory.hashtags?.length ? (
              <div className="story-hashtags-row">
                {currentStory.hashtags.map((tag) => (
                  <span key={tag} className="story-hashtag-pill">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Touch / Click zones for Previous & Next */}
          <div
            className="story-tap-zone story-tap-left"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            title="Previous story"
          />
          <div
            className="story-tap-zone story-tap-right"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            title="Next story"
          />
        </div>

        {/* Story Bottom Action & Reaction Bar */}
        <div className="story-player-footer" onClick={(e) => e.stopPropagation()}>
          {/* Quick Reaction Emojis */}
          <div className="story-quick-emojis">
            {['❤️', '🔥', '👏', '💡', '💯', '✨'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="story-emoji-btn"
                onClick={() => triggerReaction(emoji)}
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Form & Like Button */}
          <div className="story-footer-bottom">
            <form className="story-reply-form" onSubmit={handleSendReply}>
              <input
                type="text"
                className="story-reply-input"
                placeholder={session ? `Reply to @${currentGroup.authorUsername}…` : 'Sign in to reply…'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sendingReply}
              />
              {replyText.trim() ? (
                <button type="submit" className="story-reply-send-btn" disabled={sendingReply}>
                  {sendingReply ? '…' : 'Send'}
                </button>
              ) : null}
            </form>

            <button
              type="button"
              className={`story-like-btn ${liked ? 'is-liked' : ''}`}
              onClick={handleLike}
              title={liked ? 'Unlike' : 'Like'}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{likesCount}</span>
            </button>

            <Link
              href={`/thought/${currentStory._id}`}
              className="story-discussion-btn"
              title="Open full post discussion"
              onClick={onClose}
            >
              💬
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next Navigation Arrows (Desktop) */}
      {groupIndex > 0 || storyIndex > 0 ? (
        <button
          type="button"
          className="story-nav-arrow story-nav-prev"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          title="Previous (Left Arrow)"
        >
          ‹
        </button>
      ) : null}

      {groupIndex < storyGroups.length - 1 || storyIndex < stories.length - 1 ? (
        <button
          type="button"
          className="story-nav-arrow story-nav-next"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          title="Next (Right Arrow)"
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
