'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProfileCard } from '@/components/ProfileCard';
import { ThoughtCard } from '@/components/ThoughtCard';
import { useSession } from '@/hooks/useSession';
import { api } from '@/lib/api';
import type { Thought, User } from '@/types';

export default function UserProfilePage() {
  const params = useParams();
  const rawUsername = params?.username as string | undefined;
  const username = rawUsername ? decodeURIComponent(rawUsername).toLowerCase() : '';

  const { session, ready } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [savedThoughts, setSavedThoughts] = useState<Thought[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [isPrivateLocked, setIsPrivateLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'thoughts' | 'followers' | 'following' | 'saved'>('thoughts');

  const loadProfile = async () => {
    if (!username) return;
    setLoading(true);

    try {
      const [profileRes, followersRes, followingRes, savedRes] = await Promise.allSettled([
        api.getProfile(username, session?.token),
        api.getFollowers(username, session?.token),
        api.getFollowing(username, session?.token),
        session?.token ? api.savedThoughts(session.token) : Promise.reject()
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.profile) {
        setProfile({ ...profileRes.value.profile, _id: profileRes.value.profile._id || profileRes.value.profile.id });
        setThoughts(profileRes.value.thoughts || []);
        setIsFollowing(Boolean(profileRes.value.isFollowing));
        setIsRequested(Boolean(profileRes.value.isRequested));
        setIsPrivateLocked(Boolean(profileRes.value.isPrivateLocked));
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
      setIsFollowing(Boolean(next.following));
      setIsRequested(Boolean(next.requested));
      setProfile((current) => (current ? { ...current, followers: next.followers } : null));
      const res = await api.getFollowers(username);
      setFollowersList(res.followers || []);
      // If was locked and now following, refresh full profile
      if (isPrivateLocked && next.following) {
        loadProfile();
      }
    } catch {
      // silently handle follow toggle
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
  const totalSavedCount = savedThoughts.length || (typeof profile.savedThoughts === 'number' ? profile.savedThoughts : 0);

  return (
    <div className="page container" style={{ maxWidth: '650px' }}>
      <section className="profile-grid">
        <ProfileCard
          profile={profile}
          isFollowing={isFollowing}
          isRequested={isRequested}
          onToggleFollow={toggleFollow}
          isSelf={isSelf}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          thoughtsCount={isPrivateLocked ? 0 : thoughts.length}
          followersCount={isPrivateLocked ? 0 : followersCount}
          followingCount={isPrivateLocked ? 0 : followingCount}
          savedCount={isSelf ? totalSavedCount : 0}
        />
        <div className="profile-summary">
          {/* Private Account Locked Notice */}
          {isPrivateLocked ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                background: 'var(--paper)',
                borderRadius: '20px',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(200, 109, 52, 0.15), rgba(20, 20, 17, 0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  border: '1px solid var(--line)'
                }}
              >
                🔒
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                {isRequested ? 'Follow Request Pending' : 'This Account is Private'}
              </h2>
              <p className="section-copy" style={{ maxWidth: '42ch', margin: 0, fontSize: '0.94rem' }}>
                {isRequested
                  ? `Your request to follow @${profile.username} has been sent. You will see their published thoughts and activity once they accept.`
                  : `Follow @${profile.username} to request access to their published thoughts, photos, and followers.`}
              </p>
              <button
                className={isRequested ? 'button-outline' : 'button'}
                onClick={toggleFollow}
                style={{ marginTop: '8px', padding: '10px 24px' }}
              >
                {isRequested ? 'Cancel Follow Request' : 'Request to Follow 🔒'}
              </button>
            </div>
          ) : (
            <>
              {/* Tab 1: Thoughts */}
              {activeTab === 'thoughts' && (
                <div className="profile-thoughts">
                  {thoughts.map((thought) => (
                    <ThoughtCard key={thought._id} thought={thought} onDeleted={handleThoughtDeleted} />
                  ))}
                  {!thoughts.length ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px', background: 'var(--paper)', borderRadius: '16px', border: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '8px' }}>✍️</span>
                      <p className="empty-state" style={{ margin: 0 }}>This author hasn't published any thoughts yet.</p>
                      {isSelf && (
                        <div style={{ marginTop: '16px' }}>
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
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                      Followers ({followersCount})
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>People following @{profile.username}</span>
                  </div>
                  {followersList.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                      {followersList.map((follower) => {
                        const fAvatar =
                          follower.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(follower.name || 'User')}`;
                        return (
                          <div
                            key={follower._id || follower.username}
                            className="note-card"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={fAvatar}
                                alt={follower.name}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <Link href={`/profile/${follower.username}`} style={{ fontWeight: 700, textDecoration: 'none', color: 'var(--ink)', fontSize: '0.90rem' }}>
                                  {follower.name}
                                </Link>
                                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>@{follower.username}</div>
                              </div>
                            </div>
                            <Link href={`/profile/${follower.username}`} className="button-ghost" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                              View →
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '36px 16px', background: 'var(--paper)', borderRadius: '16px', border: '1px solid var(--line)' }}>
                      <p className="empty-state" style={{ margin: 0 }}>No followers yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Following */}
              {activeTab === 'following' && (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                      Following ({followingCount})
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>People @{profile.username} follows</span>
                  </div>
                  {followingList.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                      {followingList.map((followed) => {
                        const fAvatar =
                          followed.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(followed.name || 'User')}`;
                        return (
                          <div
                            key={followed._id || followed.username}
                            className="note-card"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={fAvatar}
                                alt={followed.name}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <Link href={`/profile/${followed.username}`} style={{ fontWeight: 700, textDecoration: 'none', color: 'var(--ink)', fontSize: '0.90rem' }}>
                                  {followed.name}
                                </Link>
                                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>@{followed.username}</div>
                              </div>
                            </div>
                            <Link href={`/profile/${followed.username}`} className="button-ghost" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                              View →
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '36px 16px', background: 'var(--paper)', borderRadius: '16px', border: '1px solid var(--line)' }}>
                      <p className="empty-state" style={{ margin: 0 }}>Not following anyone yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Saved (Bookmarks) */}
              {activeTab === 'saved' && (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                      Saved Bookmarks ({totalSavedCount})
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Only visible to you</span>
                  </div>
                  {savedThoughts.length ? (
                    <div className="profile-thoughts">
                      {savedThoughts.map((thought) => (
                        <ThoughtCard key={thought._id} thought={thought} onDeleted={handleThoughtDeleted} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '36px 16px', background: 'var(--paper)', borderRadius: '16px', border: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '8px' }}>🔖</span>
                      <p className="empty-state" style={{ margin: 0 }}>No saved thoughts yet.</p>
                      <span style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                        Tap the 🏷️ bookmark icon on any thought to save it here.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
