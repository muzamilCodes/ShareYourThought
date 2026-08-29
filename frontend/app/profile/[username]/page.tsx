'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProfileCard, ThoughtCard } from '@/components/ThoughtCard';
import { SectionHeading } from '@/components/SectionHeading';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import type { Thought, User } from '@/types';

export default function ProfilePage() {
  const params = useParams();
  const rawUsername = params?.username;
  const username = Array.isArray(rawUsername)
    ? rawUsername[0]
    : rawUsername
      ? String(rawUsername).toLowerCase()
      : '';

  const { session, ready } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [savedThoughts, setSavedThoughts] = useState<Thought[]>([]);
  const [activeTab, setActiveTab] = useState<'thoughts' | 'followers' | 'following' | 'saved'>('thoughts');
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!username) return;
    setLoading(true);

    try {
      const [profileRes, followersRes, followingRes, savedRes] = await Promise.allSettled([
        api.getProfile(username, session?.token),
        api.getFollowers(username),
        api.getFollowing(username),
        session?.token ? api.savedThoughts(session.token) : Promise.reject()
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.profile) {
        setProfile({ ...profileRes.value.profile, _id: profileRes.value.profile._id || profileRes.value.profile.id });
        setThoughts(profileRes.value.thoughts || []);
        setIsFollowing(Boolean(profileRes.value.isFollowing));
      } else {
        setProfile(null);
      }

      if (followersRes.status === 'fulfilled') {
        setFollowersList(followersRes.value?.followers || []);
      }
      if (followingRes.status === 'fulfilled') {
        setFollowingList(followingRes.value?.following || []);
      }
      if (savedRes.status === 'fulfilled') {
        setSavedThoughts(savedRes.value?.thoughts || []);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !username) return;
    loadProfile();
  }, [username, ready, session?.token]);

  const currentUserId = session?.user?._id || session?.user?.id;
  const isSelf = Boolean(
    profile &&
    currentUserId &&
    (profile._id === currentUserId || profile.id === currentUserId || profile.username === session?.user?.username)
  );

  const toggleFollow = async () => {
    if (!session?.token) {
      window.location.href = '/login';
      return;
    }
    if (!profile?._id && !profile?.id) return;

    const targetId = profile._id || profile.id;
    try {
      const next = await api.followUser(targetId!, session.token);
      setIsFollowing(next.following);
      setProfile((current) => (current ? { ...current, followers: next.followers } : null));
      const res = await api.getFollowers(username);
      setFollowersList(res.followers || []);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not update follow status');
    }
  };

  const handleThoughtDeleted = (deletedId: string) => {
    setThoughts((current) => current.filter((t) => t._id !== deletedId));
    setSavedThoughts((current) => current.filter((t) => t._id !== deletedId));
  };

  if (loading) {
    return (
      <div className="page container">
        <section className="auth-hero">
          <div className="mono">Profile</div>
          <h1 className="display-title display-title-xl">Loading profile…</h1>
        </section>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page container">
        <section className="auth-hero">
          <div className="mono">404</div>
          <h1 className="display-title display-title-xl">Profile not found.</h1>
          <p className="section-copy section-copy-lg">The user @{username} does not exist or has been removed.</p>
        </section>
      </div>
    );
  }

  const followersCount = followersList.length || (typeof profile.followers === 'number' ? profile.followers : profile.followers?.length || 0);
  const followingCount = followingList.length || (typeof profile.following === 'number' ? profile.following : profile.following?.length || 0);
  const savedCount = savedThoughts.length || (typeof profile.savedThoughts === 'number' ? profile.savedThoughts : 0);

  return (
    <div className="page container">
      <section className="profile-grid">
        <ProfileCard
          profile={profile}
          isFollowing={isFollowing}
          onToggleFollow={toggleFollow}
          isSelf={isSelf}
        />
        <div className="profile-summary">
          <section className="profile-hero">
            <div className="mono">Thought Stream</div>
            <h1 className="display-title display-title-xl">{profile.name}'s Profile</h1>
            <p className="section-copy section-copy-lg">
              {profile.bio || `Explore thoughts, opinions, and discussions published by @${profile.username}.`}
            </p>
          </section>

          {/* Interactive Navigation Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              className={`category-pill ${activeTab === 'thoughts' ? 'is-active' : ''}`}
              style={{ fontSize: '0.9rem', padding: '8px 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setActiveTab('thoughts')}
            >
              <span>✍️</span>
              <span>Thoughts ({thoughts.length})</span>
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
            {isSelf && (
              <button
                className={`category-pill ${activeTab === 'saved' ? 'is-active' : ''}`}
                style={{ fontSize: '0.9rem', padding: '8px 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setActiveTab('saved')}
              >
                <span>🔖</span>
                <span>Saved ({savedCount})</span>
              </button>
            )}
          </div>

          {/* Tab 1: Thoughts */}
          {activeTab === 'thoughts' && (
            <div className="profile-thoughts">
              <SectionHeading eyebrow="Published Thoughts" title="All Thoughts by This Author" />
              {thoughts.map((thought) => (
                <ThoughtCard key={thought._id} thought={thought} onDeleted={handleThoughtDeleted} />
              ))}
              {!thoughts.length ? (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <p className="empty-state">This user hasn't published any thoughts yet.</p>
                  {isSelf && (
                    <div style={{ marginTop: '14px' }}>
                      <Link href="/create" className="button">
                        ✍️ Share Your First Thought
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Tab 2: Followers */}
          {activeTab === 'followers' && (
            <div>
              <SectionHeading eyebrow="Community" title={`People Following @${profile.username}`} />
              {followersList.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {followersList.map((follower) => {
                    const fAvatar =
                      follower.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(follower.name || 'User')}`;
                    return (
                      <div
                        key={follower._id || follower.username}
                        className="note-card"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={fAvatar}
                            alt={follower.name}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <Link href={`/profile/${follower.username}`} style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
                              {follower.name}
                            </Link>
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>@{follower.username}</div>
                          </div>
                        </div>
                        <Link href={`/profile/${follower.username}`} className="button-ghost" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                          View →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="empty-state">No followers yet.</p>
              )}

            </div>
          )}

          {/* Tab 3: Following */}
          {activeTab === 'following' && (
            <div>
              <SectionHeading eyebrow="Community" title={`People @${profile.username} Follows`} />
              {followingList.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {followingList.map((followed) => {
                    const fAvatar =
                      followed.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(followed.name || 'User')}`;
                    return (
                      <div
                        key={followed._id || followed.username}
                        className="note-card"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={fAvatar}
                            alt={followed.name}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <Link href={`/profile/${followed.username}`} style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}>
                              {followed.name}
                            </Link>
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>@{followed.username}</div>
                          </div>
                        </div>
                        <Link href={`/profile/${followed.username}`} className="button-ghost" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                          View →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="empty-state">Not following anyone yet.</p>
              )}
            </div>
          )}

          {/* Tab 4: Saved (Bookmarks) */}
          {activeTab === 'saved' && isSelf && (
            <div>
              <SectionHeading eyebrow="Bookmarks" title="Thoughts You Saved" />
              {savedThoughts.length ? (
                <div className="profile-thoughts">
                  {savedThoughts.map((thought) => (
                    <ThoughtCard key={thought._id} thought={thought} onDeleted={handleThoughtDeleted} />
                  ))}
                </div>
              ) : (
                <p className="empty-state">No saved thoughts yet.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

