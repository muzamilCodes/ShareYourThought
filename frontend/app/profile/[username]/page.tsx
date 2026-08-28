'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProfileCard, ThoughtCard } from '../../../components/ThoughtCard';
import { SectionHeading } from '../../../components/SectionHeading';
import { api } from '../../../lib/api';
import { useSession } from '../../../hooks/useSession';
import type { Thought, User } from '../../../types';

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const { session, ready } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const username = params?.username ? String(params.username).toLowerCase() : '';

  useEffect(() => {
    if (!username || !ready) return;
    setLoading(true);

    api.getProfile(username, session?.token)
      .then((data) => {
        setProfile({ ...data.profile, _id: data.profile.id });
        setThoughts(data.thoughts || []);
        setIsFollowing(Boolean(data.isFollowing));
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username, ready, session?.token]);

  const currentUserId = session?.user?._id || session?.user?.id;
  const isSelf = Boolean(
    profile && currentUserId && (profile._id === currentUserId || profile.id === currentUserId || profile.username === session?.user?.username)
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
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not update follow status');
    }
  };

  const handleThoughtDeleted = (deletedId: string) => {
    setThoughts((current) => current.filter((t) => t._id !== deletedId));
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
            <h1 className="display-title display-title-xl">{profile.name}'s Ideas</h1>
            <p className="section-copy section-copy-lg">
              Explore thoughts, opinions, and discussions published by @{profile.username}.
            </p>
          </section>

          <SectionHeading eyebrow="Published Thoughts" title="All Thoughts by This Author" />
          <div className="profile-thoughts">
            {thoughts.map((thought) => (
              <ThoughtCard key={thought._id} thought={thought} onDeleted={handleThoughtDeleted} />
            ))}
            {!thoughts.length ? (
              <p className="empty-state">This user hasn't published any thoughts yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
