'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThoughtCard } from '../../components/ThoughtCard';
import { CreateThought } from '../../components/CreateThought';
import { SectionHeading } from '../../components/SectionHeading';
import { api, saveStoredSession } from '../../lib/api';
import { useSession } from '../../hooks/useSession';
import type { Category, Thought, User } from '../../types';

export default function MyProfilePage() {
  const { session, ready } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [myThoughts, setMyThoughts] = useState<Thought[]>([]);
  const [savedThoughts, setSavedThoughts] = useState<Thought[]>([]);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'thoughts' | 'followers' | 'following' | 'saved'>('thoughts');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false); // Closed by default
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarInput, setAvatarInput] = useState('');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const loadUserData = async () => {
    if (!session?.token || !session.user?.username) return;
    setLoading(true);

    try {
      const [profileRes, savedRes, catRes, followersRes, followingRes] = await Promise.allSettled([
        api.getProfile(session.user.username, session.token),
        api.savedThoughts(session.token),
        api.listCategories(),
        api.getFollowers(session.user.username),
        api.getFollowing(session.user.username)
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile({ ...profileRes.value.profile, _id: profileRes.value.profile.id });
        setMyThoughts(profileRes.value.thoughts || []);
      }
      if (savedRes.status === 'fulfilled') {
        setSavedThoughts(savedRes.value.thoughts || []);
      }
      if (catRes.status === 'fulfilled' && catRes.value.categories?.length) {
        setCategories(catRes.value.categories);
      }
      if (followersRes.status === 'fulfilled') {
        setFollowersList(followersRes.value.followers || []);
      }
      if (followingRes.status === 'fulfilled') {
        setFollowingList(followingRes.value.following || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (session?.token) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [ready, session?.token]);

  const handleThoughtCreated = () => {
    setShowCreateForm(false);
    loadUserData();
  };

  const handleThoughtDeleted = (deletedId: string) => {
    setMyThoughts((current) => current.filter((t) => t._id !== deletedId));
    setSavedThoughts((current) => current.filter((t) => t._id !== deletedId));
  };

  const handleSaveAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token || !avatarInput.trim()) return;
    setUpdatingAvatar(true);
    try {
      const updated = await api.updateMe({ avatar: avatarInput.trim() }, session.token);
      setProfile(updated.user);
      if (session) {
        saveStoredSession({ ...session, user: updated.user });
      }
      setEditingAvatar(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update avatar');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  if (ready && !session) {
    return (
      <div className="page container">
        <section className="auth-hero">
          <div className="mono">My Profile</div>
          <h1 className="display-title display-title-xl">Sign in to view your profile dashboard.</h1>
          <p className="section-copy section-copy-lg">
            Create thoughts, view your published posts, see bookmarks, and manage your account details.
          </p>
          <div className="button-row" style={{ marginTop: '24px' }}>
            <Link href="/login" className="button">
              <span>👤</span> Login to Your Account
            </Link>
            <Link href="/register" className="button-outline">
              Create an Account
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const currentUser = profile || session?.user;
  const avatarUrl =
    currentUser?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'User')}`;

  const followersCount = followersList.length || (typeof currentUser?.followers === 'number' ? currentUser.followers : currentUser?.followers?.length || 0);
  const followingCount = followingList.length || (typeof currentUser?.following === 'number' ? currentUser.following : currentUser?.following?.length || 0);
  const savedCount = savedThoughts.length || (typeof currentUser?.savedThoughts === 'number' ? currentUser.savedThoughts : 0);

  return (
    <div className="page container">
      {/* Profile Header Dashboard */}
      <section className="page-frame" style={{ marginBottom: '32px' }}>
        <div className="page-frame-main">
          <div className="mono eyebrow">My Account Dashboard</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '12px' }}>
            <div style={{ position: 'relative' }}>
              <img
                className="avatar-lg"
                src={avatarUrl}
                alt={currentUser?.name || 'Profile'}
                style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(200, 109, 52, 0.3)' }}
              />
              <button
                type="button"
                className="button-ghost"
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  background: 'var(--paper)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  padding: 0,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--line)'
                }}
                onClick={() => {
                  setAvatarInput(currentUser?.avatar || '');
                  setEditingAvatar((prev) => !prev);
                }}
                title="Change Avatar"
              >
                📷
              </button>
            </div>

            <div>
              <h1 className="display-title" style={{ fontSize: '2.4rem', margin: 0 }}>
                {currentUser?.name}
              </h1>
              <div className="profile-handle" style={{ fontSize: '1.05rem', color: 'var(--muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>👤 @{currentUser?.username}</span>
                {currentUser?.email ? <span>· ✉️ {currentUser.email}</span> : null}
              </div>
            </div>
          </div>

          {/* Quick Avatar URL Editor */}
          {editingAvatar ? (
            <form onSubmit={handleSaveAvatar} style={{ marginTop: '16px', display: 'flex', gap: '8px', maxWidth: '480px' }}>
              <input
                className="input"
                value={avatarInput}
                onChange={(e) => setAvatarInput(e.target.value)}
                placeholder="Paste new image/avatar URL (https://...)"
                required
                style={{ flex: 1 }}
              />
              <button className="button" type="submit" disabled={updatingAvatar}>
                {updatingAvatar ? 'Saving…' : 'Save'}
              </button>
              <button className="button-outline" type="button" onClick={() => setEditingAvatar(false)}>
                Cancel
              </button>
            </form>
          ) : null}

          <p className="section-copy section-copy-lg" style={{ marginTop: '16px' }}>
            {currentUser?.bio || 'Thinking in public. Welcome to my personal thought stream.'}
          </p>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '12px', fontSize: '0.9rem', color: 'var(--muted)' }}>
            {currentUser?.location ? <span>📍 {currentUser.location}</span> : null}
            {currentUser?.website ? (
              <span>
                🔗{' '}
                <a
                  href={currentUser.website.startsWith('http') ? currentUser.website : `https://${currentUser.website}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  {currentUser.website}
                </a>
              </span>
            ) : null}
          </div>

          {/* Clickable Profile Stats (Clicking opens respective tab) */}
          <div className="profile-stats" style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div
              className={`profile-stat ${activeTab === 'thoughts' ? 'is-active' : ''}`}
              style={{ cursor: 'pointer', border: activeTab === 'thoughts' ? '2px solid var(--ember)' : undefined }}
              onClick={() => setActiveTab('thoughts')}
            >
              <strong>{myThoughts.length}</strong>
              <span>✍️ Thoughts</span>
            </div>
            <div
              className={`profile-stat ${activeTab === 'followers' ? 'is-active' : ''}`}
              style={{ cursor: 'pointer', border: activeTab === 'followers' ? '2px solid var(--ember)' : undefined }}
              onClick={() => setActiveTab('followers')}
            >
              <strong>{followersCount}</strong>
              <span>👥 Followers</span>
            </div>
            <div
              className={`profile-stat ${activeTab === 'following' ? 'is-active' : ''}`}
              style={{ cursor: 'pointer', border: activeTab === 'following' ? '2px solid var(--ember)' : undefined }}
              onClick={() => setActiveTab('following')}
            >
              <strong>{followingCount}</strong>
              <span>✨ Following</span>
            </div>
            <div
              className={`profile-stat ${activeTab === 'saved' ? 'is-active' : ''}`}
              style={{ cursor: 'pointer', border: activeTab === 'saved' ? '2px solid var(--ember)' : undefined }}
              onClick={() => setActiveTab('saved')}
            >
              <strong>{savedCount}</strong>
              <span>🔖 Saved</span>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: '24px' }}>
            <button
              className="button"
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>✍️</span>
              <span>{showCreateForm ? '▲ Hide Thought Creator' : '+ Share a Thought'}</span>
            </button>
            <Link href="/settings" className="button-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>⚙️</span>
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        <aside className="page-frame-aside">
          <div className="note-card">
            <div className="mono">🔗 Public Profile</div>
            <p className="note-copy">
              <Link href={`/profile/${currentUser?.username}`} style={{ textDecoration: 'underline', color: 'var(--ember)' }}>
                View your public profile as others see it ({currentUser?.username}) →
              </Link>
            </p>
          </div>
          <div className="note-card">
            <div className="mono">💡 Tip</div>
            <p className="note-copy">
              Click on <strong>Followers</strong> or <strong>Following</strong> stats above to see who is connected with you.
            </p>
          </div>
        </aside>
      </section>

      {/* Inline Create Thought Box on Profile (CLOSED by default, opens only on click) */}
      {showCreateForm ? (
        <section
          className="section"
          style={{
            padding: '28px',
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            marginBottom: '40px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>✍️</span>
              <div className="mono eyebrow" style={{ color: 'var(--ember)', margin: 0 }}>Create New Thought</div>
            </div>
            <button
              type="button"
              className="button-ghost"
              onClick={() => setShowCreateForm(false)}
              style={{ fontSize: '0.85rem' }}
            >
              ✕ Close
            </button>
          </div>
          <h2 className="display-title" style={{ fontSize: '1.8rem', marginTop: '6px', marginBottom: '8px' }}>
            Share an idea with the community
          </h2>
          <p className="section-copy" style={{ marginBottom: '20px' }}>
            Write something thoughtful, choose or type any category, and publish.
          </p>
          <CreateThought categories={categories} onSuccess={handleThoughtCreated} />
        </section>
      ) : null}

      {/* Tab Navigation: Thoughts | Followers | Following | Saved */}
      <section className="section-dark" style={{ borderRadius: '16px', padding: '32px 24px', marginTop: '24px' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', flexWrap: 'wrap' }}>
            <button
              className={`category-pill ${activeTab === 'thoughts' ? 'is-active' : ''}`}
              style={{ fontSize: '0.9rem', padding: '8px 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setActiveTab('thoughts')}
            >
              <span>✍️</span>
              <span>My Thoughts ({myThoughts.length})</span>
            </button>
            <button
              className={`category-pill ${activeTab === 'followers' ? 'is-active' : ''}`}
              style={{ fontSize: '0.9rem', padding: '8px 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setActiveTab('followers')}
            >
              <span>👥</span>
              <span>Followers ({followersCount})</span>
            </button>
            <button
              className={`category-pill ${activeTab === 'following' ? 'is-active' : ''}`}
              style={{ fontSize: '0.9rem', padding: '8px 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setActiveTab('following')}
            >
              <span>✨</span>
              <span>Following ({followingCount})</span>
            </button>
            <button
              className={`category-pill ${activeTab === 'saved' ? 'is-active' : ''}`}
              style={{ fontSize: '0.9rem', padding: '8px 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setActiveTab('saved')}
            >
              <span>🔖</span>
              <span>Saved ({savedThoughts.length})</span>
            </button>
          </div>

          {/* TAB 1: THOUGHTS */}
          {activeTab === 'thoughts' && (
            <div>
              <SectionHeading eyebrow="My Posts" title="Thoughts You Have Shared" />
              {myThoughts.length ? (
                <div className="thought-grid">
                  {myThoughts.map((thought) => (
                    <ThoughtCard key={thought._id} thought={thought} onDeleted={handleThoughtDeleted} />
                  ))}
                </div>
              ) : !loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p className="empty-state">You haven't published any thoughts yet.</p>
                  <button
                    className="button"
                    style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setShowCreateForm(true)}
                  >
                    <span>✍️</span>
                    <span>Write Your First Thought</span>
                  </button>
                </div>
              ) : (
                <p className="empty-state">Loading your thoughts…</p>
              )}
            </div>
          )}

          {/* TAB 2: FOLLOWERS LIST */}
          {activeTab === 'followers' && (
            <div>
              <SectionHeading eyebrow="Community" title="People Following You" />
              {followersList.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {followersList.map((follower) => {
                    const fAvatar =
                      follower.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(follower.name || 'User')}`;
                    return (
                      <div
                        key={follower._id || follower.username}
                        className="note-card"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={fAvatar}
                            alt={follower.name}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <Link href={`/profile/${follower.username}`} style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
                              {follower.name}
                            </Link>
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>@{follower.username}</div>
                          </div>
                        </div>
                        <Link href={`/profile/${follower.username}`} className="button-ghost" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                          View →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : !loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p className="empty-state">No one is following you yet.</p>
                  <p className="section-copy">Share interesting thoughts to grow your audience!</p>
                </div>
              ) : (
                <p className="empty-state">Loading followers…</p>
              )}
            </div>
          )}

          {/* TAB 3: FOLLOWING LIST */}
          {activeTab === 'following' && (
            <div>
              <SectionHeading eyebrow="Community" title="People You Follow" />
              {followingList.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {followingList.map((followed) => {
                    const fAvatar =
                      followed.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(followed.name || 'User')}`;
                    return (
                      <div
                        key={followed._id || followed.username}
                        className="note-card"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={fAvatar}
                            alt={followed.name}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <Link href={`/profile/${followed.username}`} style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
                              {followed.name}
                            </Link>
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>@{followed.username}</div>
                          </div>
                        </div>
                        <Link href={`/profile/${followed.username}`} className="button-ghost" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                          View →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : !loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p className="empty-state">You aren't following anyone yet.</p>
                  <div style={{ marginTop: '16px' }}>
                    <Link href="/explore" className="button-outline">
                      Explore Users & Thoughts
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="empty-state">Loading following list…</p>
              )}
            </div>
          )}

          {/* TAB 4: SAVED POSTS */}
          {activeTab === 'saved' && (
            <div>
              <SectionHeading eyebrow="Bookmarks" title="Thoughts You Have Saved" />
              {savedThoughts.length ? (
                <div className="thought-grid">
                  {savedThoughts.map((thought) => (
                    <ThoughtCard key={thought._id} thought={thought} onDeleted={handleThoughtDeleted} />
                  ))}
                </div>
              ) : !loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p className="empty-state">You haven't saved any thoughts yet.</p>
                  <p className="section-copy">Click the bookmark icon ▣ on any thought card to save it for later.</p>
                  <div style={{ marginTop: '16px' }}>
                    <Link href="/explore" className="button-outline">
                      Explore Thoughts to Save
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="empty-state">Loading saved thoughts…</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
