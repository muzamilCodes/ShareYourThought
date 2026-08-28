'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { useSession } from '../hooks/useSession';
import type { Category, Comment } from '../types';

export function CreateThought({
  categories,
  onSuccess
}: {
  categories: Category[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { session, ready } = useSession();
  const [form, setForm] = useState({
    content: '',
    imageUrl: '',
    category: categories[0]?.slug || 'life',
    hashtags: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categories.length && !categories.some((category) => category.slug === form.category)) {
      setForm((current) => ({ ...current, category: categories[0].slug }));
    }
  }, [categories, form.category]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
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

    setLoading(true);
    setStatus('Publishing…');

    try {
      const res = await api.createThought(form, session.token);
      setStatus('Published successfully!');
      setForm({ content: '', imageUrl: '', category: categories[0]?.slug || 'life', hashtags: '' });
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
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="content">Thought Text</label>
        <textarea
          className="textarea"
          id="content"
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="Share a reflection, idea, perspective, or observation…"
          required
          rows={4}
        />
      </div>

      <div className="field">
        <label htmlFor="imageUrl">Image URL (Optional)</label>
        <input
          className="input"
          id="imageUrl"
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="https://images.unsplash.com/..."
        />
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select className="select" id="category" name="category" value={form.category} onChange={handleChange}>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="hashtags">Hashtags (comma or space separated)</label>
        <input
          className="input"
          id="hashtags"
          name="hashtags"
          value={form.hashtags}
          onChange={handleChange}
          placeholder="technology, writing, perspective"
        />
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Publishing…' : 'Publish Thought'}
        </button>
        <button
          className="button-outline"
          type="button"
          onClick={() => setForm({ content: '', imageUrl: '', category: categories[0]?.slug || 'life', hashtags: '' })}
        >
          Clear
        </button>
      </div>

      {status ? (
        <p className="helper" style={{ color: status.includes('success') ? '#4a7c59' : '#c86d34' }}>
          {status}
        </p>
      ) : null}
    </form>
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

  const currentUserId = session?.user?._id || session?.user?.id;
  const isAuthor = Boolean(
    currentUserId &&
      (comment.author?._id === currentUserId ||
        comment.author?.id === currentUserId ||
        (typeof comment.author === 'string' && comment.author === currentUserId))
  );

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
    <div className="comment-card" style={{ marginLeft: level ? Math.min(level * 24, 48) : 0, borderLeft: level ? '2px solid var(--line-strong)' : undefined }}>
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
        <span className="pill" style={{ fontSize: '0.72rem' }}>{level ? 'Reply' : 'Comment'}</span>
      </div>

      <p className="comment-body">{comment.content}</p>

      <div className="form-actions" style={{ marginTop: '8px' }}>
        <button className="button-ghost" type="button" onClick={() => setReplying((value) => !value)} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
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

export function CommentSection({ thoughtId }: { thoughtId: string }) {
  const { session, ready } = useSession();
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
    <section className="comment-box">
      <div className="section-heading">
        <div className="mono eyebrow">Conversation</div>
        <h2 className="display-title" style={{ fontSize: '2rem' }}>
          Comments & Responses
        </h2>
      </div>

      <form className="form-grid" onSubmit={submitComment}>
        <textarea
          className="textarea"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={session ? 'Add a thoughtful comment to the conversation…' : 'Sign in to leave a comment…'}
          rows={3}
          required
        />
        <div className="form-actions">
          {session ? (
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post Comment'}
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
    </section>
  );
}
