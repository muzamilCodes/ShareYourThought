'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThoughtCard } from '../../components/ThoughtCard';
import { CreateThought } from '../../components/CreateThought';
import { SectionHeading } from '../../components/SectionHeading';
import { api } from '../../lib/api';
import { useSession } from '../../hooks/useSession';
import type { Category, Thought, User } from '../../types';

export default function MyProfilePage() {
  const { session, ready } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [myThoughts, setMyThoughts] = useState<Thought[]>([]);
  const [savedThoughts, setSavedThoughts] = useState<Thought[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(true);

  const loadUserData = async () => {
    if (!session?.token || !session.user?.username) return;
    setLoading(true);

    try {
      const [profileRes, savedRes, catRes] = await Promise.allSettled([
        api.getProfile(session.user.username, session.token),
        api.savedThoughts(session.token),
        api.listCategories()
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
    loadUserData();
  };

  const handleThoughtDeleted = (deletedId: string) => {
    setMyThoughts((current) => current.filter((t) => t._id !== deletedId));
    setSavedThoughts((current) => current.filter((t) => t._id !== deletedId));
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
              Login to Your Account
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

  const followersCount =
    typeof currentUser?.followers === 'number'
      ? currentUser.followers
      : currentUser?.followers?.length || 0;

  const followingCount =
    typeof currentUser?.following === 'number'
      ? currentUser.following
      : currentUser?.following?.length || 0;

  const savedCount = savedThoughts.length || (typeof currentUser?.savedThoughts === 'number' ? currentUser.savedThoughts : 0);

  return (
    <div className="page container">
      {/* Profile Header Dashboard */}
      <section className="page-frame" style={{ marginBottom: '32px' }}>
        <div className="page-frame-main">
          <div className="mono eyebrow">My Account Dashboard</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '12px' }}>
            <img
              className="avatar-lg"
              src={avatarUrl}
              alt={currentUser?.name || 'Profile'}
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <h1 className="display-title" style={{ fontSize: '2.4rem', margin: 0 }}>
                {currentUser?.name}
              </h1>
              <div className="profile-handle" style={{ fontSize: '1.05rem', color: 'var(--muted)', marginTop: '4px' }}>
                @{currentUser?.username} {currentUser?.email ? `· ${currentUser.email}` : ''}
              </div>
            </div>
          </div>

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

          <div className="profile-stats" style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div className="profile-stat">
              <strong>{myThoughts.length}</strong>
              <span>My Thoughts</span>
            </div>
            <div className="profile-stat">
              <strong>{followersCount}</strong>
              <span>Followers</span>
            </div>
            <div className="profile-stat">
              <strong>{followingCount}</strong>
              <span>Following</span>
            </div>
            <div className="profile-stat">
              <strong>{savedCount}</strong>
              <span>Saved Posts</span>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: '24px' }}>
            <Link href="/settings" className="button-outline">
              ⚙ Edit Profile & Password
            </Link>
            <button
              className="button"
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
            >
              {showCreateForm ? '− Hide Create Box' : '+ Share a Thought'}
            </button>
          </div>
        </div>

        <aside className="page-frame-aside">
          <div className="note-card">
            <div className="mono">Quick Actions</div>
            <p className="note-copy">
              Publish new ideas directly from your profile, review your engagement, and view saved posts.
            </p>
          </div>
          <div className="note-card">
            <div className="mono">Public Profile Link</div>
            <p className="note-copy">
              <Link href={`/profile/${currentUser?.username}`} style={{ textDecoration: 'underline', color: 'var(--ember)' }}>
                View your public profile as others see it →
              </Link>
            </p>
          </div>
        </aside>
      </section>

      {/* Inline Create Thought Box on Profile */}
      {showCreateForm ? (
        <section className="section" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', border: '1px solid var(--line)', marginBottom: '40px' }}>
          <div className="mono eyebrow" style={{ color: 'var(--ember)', marginBottom: '8px' }}>Create New Thought</div>
          <h2 className="display-title" style={{ fontSize: '1.8rem', marginTop: 0 }}>
            Share an idea with the community
          </h2>
          <p className="section-copy" style={{ marginBottom: '20px' }}>
            Write something thoughtful, choose a topic category, and let your perspective travel.
          </p>
          <CreateThought categories={categories} onSuccess={handleThoughtCreated} />
        </section>
      ) : null}

      {/* Tab Navigation: My Thoughts vs Saved Thoughts */}
      <section className="section-dark" style={{ borderRadius: '16px', padding: '32px 24px', marginTop: '24px' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
            <button
              className={`category-pill ${activeTab === 'my' ? 'is-active' : ''}`}
              style={{ fontSize: '0.9rem', padding: '8px 20px', cursor: 'pointer' }}
              onClick={() => setActiveTab('my')}
            >
              My Published Thoughts ({myThoughts.length})
            </button>
            <button
              className={`category-pill ${activeTab === 'saved' ? 'is-active' : ''}`}
              style={{ fontSize: '0.9rem', padding: '8px 20px', cursor: 'pointer' }}
              onClick={() => setActiveTab('saved')}
            >
              Saved & Bookmarked ({savedThoughts.length})
            </button>
          </div>

          {activeTab === 'my' ? (
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
                    style={{ marginTop: '16px' }}
                    onClick={() => setShowCreateForm(true)}
                  >
                    Write Your First Thought
                  </button>
                </div>
              ) : (
                <p className="empty-state">Loading your thoughts…</p>
              )}
            </div>
          ) : (
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
