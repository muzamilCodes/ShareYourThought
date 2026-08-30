'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import { fileToCompressedDataUrl } from '../lib/imageUtils';
import type { Category, Comment } from '../types';

const SUGGESTED_TAGS = ['reflection', 'mindset', 'life', 'technology', 'creativity', 'philosophy', 'growth'];

export function CreateThought({
  categories,
  onSuccess
}: {
  categories: Category[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { session, ready } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    content: '',
    imageUrl: '',
    category: categories[0]?.name || 'Life',
    hashtags: ''
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isStory, setIsStory] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageProcessing, setImageProcessing] = useState(false);

  useEffect(() => {
    if (!isCustomCategory && categories.length && !form.category) {
      setForm((current) => ({ ...current, category: categories[0].name }));
    }
  }, [categories, form.category, isCustomCategory]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    if (status) setStatus('');
  };

  const handleCategorySelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const val = event.target.value;
    if (val === '__custom__') {
      setIsCustomCategory(true);
      setCustomCategory('');
    } else {
      setIsCustomCategory(false);
      setForm({ ...form, category: val });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageProcessing(true);
    setStatus('');
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setImageProcessing(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTag = (tag: string) => {
    const currentTags = form.hashtags
      .split(/[\s,]+/)
      .map((t) => t.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean);

    if (!currentTags.includes(tag.toLowerCase())) {
      const updated = [...currentTags, tag.toLowerCase()].join(', ');
      setForm((prev) => ({ ...prev, hashtags: updated }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;

    if (!session?.token) {
      router.push('/login');
      return;
    }

    if (!form.content.trim()) {
      setStatus('Please write something before publishing.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : form.category.trim();
    if (!finalCategory) {
      setStatus('Please select or type a category.');
      return;
    }

    setLoading(true);
    setStatus('Publishing…');

    try {
      const payload = {
        ...form,
        category: finalCategory,
        isStory
      };
      const res = await api.createThought(payload, session.token);
      setStatus('Published successfully!');
      setForm({ content: '', imageUrl: '', category: categories[0]?.name || 'Life', hashtags: '' });
      setIsCustomCategory(false);
      setCustomCategory('');
      setIsStory(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/thought/${res.thought._id}`);
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Failed to publish thought.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card" style={{ padding: '24px', borderRadius: '20px' }}>
      <form className="form-grid" onSubmit={handleSubmit}>
        {/* Thought Text Input with Character Count */}
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="content" style={{ fontWeight: 700 }}>
              Your Thought
            </label>
            <span
              style={{
                fontSize: '0.78rem',
                color: form.content.length > 550 ? '#c86d34' : 'var(--muted)',
                fontWeight: 600
              }}
            >
              {form.content.length} / 600
            </span>
          </div>
          <textarea
            className="textarea"
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="What's on your mind? Share an insight, reflection, or observation…"
            required
            maxLength={600}
            rows={5}
            style={{ fontSize: '1.02rem', lineHeight: '1.55' }}
          />
        </div>

        {/* Image Attachment Box (Direct Mobile / File Upload + URL Option + Fit Controls) */}
        <div className="field" style={{ background: 'rgba(20, 20, 17, 0.03)', padding: '16px', borderRadius: '16px', border: '1px dashed var(--line-strong)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{ fontWeight: 700, margin: 0, fontSize: '0.92rem' }}>
              🖼️ Attach Photo (Optional)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: imageMode === 'upload' ? 'var(--ink)' : 'transparent',
                  color: imageMode === 'upload' ? '#ffffff' : 'var(--muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  transition: 'all 150ms ease'
                }}
              >
                📷 Upload / Camera
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: imageMode === 'url' ? 'var(--ink)' : 'transparent',
                  color: imageMode === 'url' ? '#ffffff' : 'var(--muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  transition: 'all 150ms ease'
                }}
              >
                🔗 Image URL
              </button>
            </div>
          </div>

          {/* Hidden Native File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {imageMode === 'upload' ? (
            <div>
              {!form.imageUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageProcessing}
                  style={{
                    width: '100%',
                    padding: '20px 16px',
                    borderRadius: '14px',
                    border: '1.5px dashed var(--line-strong)',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: 'var(--ink)',
                    transition: 'all 180ms ease'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>📸</span>
                  <strong style={{ fontSize: '0.95rem' }}>
                    {imageProcessing ? 'Compressing & Fitting Photo…' : 'Tap to Choose Photo from Phone or Laptop'}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    Auto-optimized for crisp quality (Camera, Gallery, JPG, PNG, WEBP)
                  </span>
                </button>
              ) : null}
            </div>
          ) : (
            <div>
              <input
                className="input"
                id="imageUrl"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="Paste direct image URL e.g. https://images.unsplash.com/..."
              />
            </div>
          )}

          {/* Enhanced Live Image Preview with Fit Controls */}
          {form.imageUrl ? (
            <div style={{ marginTop: '12px' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#0a0a0a',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '200px',
                  maxHeight: '380px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
                }}
              >
                <img
                  src={form.imageUrl}
                  alt="Selected attachment preview"
                  style={{
                    width: '100%',
                    maxHeight: '380px',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />

                {/* Top Action Floating Controls */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 2
                  }}
                >
                  {imageMode === 'upload' ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '6px 12px',
                        fontSize: '0.80rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🔄 Change
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      background: 'rgba(239, 68, 68, 0.85)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 12px',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* Bottom Photo Fit Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '8px',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  ✓ Auto-Fitted
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Category Selector */}
        <div className="field">
          <label htmlFor="category" style={{ fontWeight: 700 }}>
            Category
          </label>
          {!isCustomCategory ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="select"
                id="category"
                name="category"
                value={form.category}
                onChange={handleCategorySelectChange}
                style={{ flex: 1 }}
              >
                {categories.map((category) => (
                  <option key={category.slug} value={category.name}>
                    #{category.name}
                  </option>
                ))}
                <option value="__custom__">➕ Write Custom Category…</option>
              </select>
              <button
                type="button"
                className="button-ghost"
                onClick={() => setIsCustomCategory(true)}
                style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                + Custom
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                className="input"
                id="customCategory"
                name="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Type your custom category name…"
                autoFocus
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="button-ghost"
                onClick={() => {
                  setIsCustomCategory(false);
                  setForm({ ...form, category: categories[0]?.name || 'Life' });
                }}
                style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                ← List
              </button>
            </div>
          )}
        </div>

        {/* Hashtags Input & Quick Suggestions */}
        <div className="field">
          <label htmlFor="hashtags" style={{ fontWeight: 700 }}>
            Hashtags (Optional)
          </label>
          <input
            className="input"
            id="hashtags"
            name="hashtags"
            value={form.hashtags}
            onChange={handleChange}
            placeholder="e.g. writing, life, ideas"
          />
          {/* Quick Tag Suggestions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', alignSelf: 'center' }}>Suggestions:</span>
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                style={{
                  fontSize: '0.76rem',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  background: 'rgba(20, 20, 17, 0.04)',
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Story Spark Toggle Option */}
        <div
          style={{
            background: isStory ? 'rgba(200, 109, 52, 0.08)' : 'rgba(20, 20, 17, 0.03)',
            border: isStory ? '1.5px solid var(--ember)' : '1px solid var(--line)',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 180ms ease',
            margin: '4px 0 12px 0'
          }}
          onClick={() => setIsStory(!isStory)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <div>
              <strong style={{ fontSize: '0.90rem', color: 'var(--ink)', display: 'block' }}>
                Share as 24-Hour Story Spark
              </strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                Shows in the top Story ring and automatically disappears after 24 hours.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isStory}
            onChange={(e) => setIsStory(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--ember)', cursor: 'pointer' }}
          />
        </div>

        {/* Submit Actions */}
        <div className="form-actions" style={{ marginTop: '8px' }}>
          <button className="button" type="submit" disabled={loading || imageProcessing} style={{ flex: 1 }}>
            {loading ? 'Publishing Thought…' : '✨ Publish Thought'}
          </button>
          <button
            className="button-outline"
            type="button"
            onClick={() => {
              setForm({ content: '', imageUrl: '', category: categories[0]?.name || 'Life', hashtags: '' });
              setIsCustomCategory(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            Clear
          </button>
        </div>

        {status ? (
          <p className="helper" style={{ color: status.includes('success') ? '#4a7c59' : '#c86d34', fontWeight: 600 }}>
            {status}
          </p>
        ) : null}
      </form>
    </div>
  );
}


function CommentItem({
  thoughtId,
  comment,
  onRefresh,
  level = 0
}: {
  thoughtId: string;
  comment: Comment;
  onRefresh: () => void;
  level?: number;
}) {
  const { session } = useSession();
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.token) {
      window.location.href = '/login';
      return;
    }
    if (!reply.trim()) return;

    setSubmitting(true);
    try {
      await api.createComment(thoughtId, { content: reply.trim(), parentComment: comment._id }, session.token);
      setReply('');
      setReplying(false);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const authorName = comment.author?.name || 'Anonymous';
  const authorUsername = comment.author?.username || 'user';
  const authorAvatar =
    comment.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;

  return (
    <div
      className="comment-card"
      style={{
        marginLeft: level ? Math.min(level * 24, 48) : 0,
        borderLeft: level ? '2px solid var(--line-strong)' : undefined
      }}
    >
      <div className="comment-top">
        <div className="brand-lockup">
          <img className="avatar" src={authorAvatar} alt={authorName} style={{ width: '28px', height: '28px' }} />
          <div>
            <Link href={`/profile/${authorUsername}`} className="comment-author">
              {authorName}
            </Link>
            <div className="comment-meta">@{authorUsername}</div>
          </div>
        </div>
        <span className="pill" style={{ fontSize: '0.72rem' }}>
          {level ? 'Reply' : 'Comment'}
        </span>
      </div>

      <p className="comment-body">{comment.content}</p>

      <div className="form-actions" style={{ marginTop: '8px' }}>
        <button
          className="button-ghost"
          type="button"
          onClick={() => setReplying((value) => !value)}
          style={{ fontSize: '0.8rem', padding: '4px 10px' }}
        >
          {replying ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {replying ? (
        <form className="form-grid" onSubmit={submitReply} style={{ marginTop: '12px' }}>
          <textarea
            className="textarea"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder={`Reply to ${authorName}…`}
            rows={2}
            required
          />
          <div className="form-actions">
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post Reply'}
            </button>
          </div>
        </form>
      ) : null}

      {comment.replies?.length ? (
        <div className="comment-replies" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comment.replies.map((replyComment) => (
            <CommentItem
              key={replyComment._id}
              thoughtId={thoughtId}
              comment={replyComment}
              onRefresh={onRefresh}
              level={level + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommentSection({
  thoughtId,
  initiallyOpen = false
}: {
  thoughtId: string;
  initiallyOpen?: boolean;
}) {
  const { session, ready } = useSession();
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadComments = async () => {
    try {
      const data = await api.getComments(thoughtId);
      setComments(data.comments || []);
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    loadComments();
  }, [thoughtId]);

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;

    if (!session?.token) {
      window.location.href = '/login';
      return;
    }

    if (!text.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      await api.createComment(thoughtId, { content: text.trim() }, session.token);
      setText('');
      await loadComments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="comment-box" id="comments-section" style={{ marginTop: '32px' }}>
      {/* Interactive Toggle Header: Only opens on click */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.4)',
          borderRadius: '12px',
          border: '1px solid var(--line)'
        }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
              Discussion & Comments ({comments.length})
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {isOpen ? 'Click to hide conversation' : 'Click to view & write comments'}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="button-ghost"
          style={{ fontSize: '0.9rem', padding: '6px 12px' }}
        >
          {isOpen ? '▲ Hide' : '▼ Open Comments'}
        </button>
      </div>

      {isOpen ? (
        <div style={{ marginTop: '20px' }}>
          <form className="form-grid" onSubmit={submitComment}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <img
                src={
                  session?.user?.avatar ||
                  (session?.user?.name
                    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.name)}`
                    : 'https://api.dicebear.com/7.x/initials/svg?seed=User')
                }
                alt={session?.user?.name || 'You'}
                className="avatar"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
              />
              <div style={{ flex: 1 }}>
                <textarea
                  className="textarea"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={session ? `Write your comment, ${session.user?.name || ''}…` : 'Sign in to leave a comment…'}
                  rows={3}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
              {session ? (
                <button className="button" type="submit" disabled={submitting}>
                  {submitting ? 'Posting…' : '💬 Post Comment'}
                </button>
              ) : (
                <Link href="/login" className="button">
                  Sign In to Comment
                </Link>
              )}
            </div>
            {error ? <p className="helper" style={{ color: '#c86d34' }}>{error}</p> : null}
          </form>

          <div className="comment-list" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.map((comment) => (
              <CommentItem key={comment._id} thoughtId={thoughtId} comment={comment} onRefresh={loadComments} />
            ))}
            {!comments.length ? (
              <p className="empty-state">No comments yet. Be the first to start the conversation.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
