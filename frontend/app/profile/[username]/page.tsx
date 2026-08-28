'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProfileCard, ThoughtCard } from '../../../components/ThoughtCard';
import { SectionHeading } from '../../../components/SectionHeading';
import { api, readStoredSession } from '../../../lib/api';
import type { Thought, User } from '../../../types';

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const session = readStoredSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!params?.username) return;
    api.getProfile(params.username, session?.token).then((data) => {
      setProfile({ ...data.profile, _id: data.profile.id });
      setThoughts(data.thoughts);
      setIsFollowing(data.isFollowing);
    }).catch(() => undefined);
  }, [params?.username]);

  const toggleFollow = async () => {
    if (!session?.token || !profile?._id) return window.location.href = '/login';
    const next = await api.followUser(profile._id, session.token);
    setIsFollowing(next.following);
    if (typeof profile.followers === 'number') {
      setProfile({ ...profile, followers: next.followers });
    }
  };

  if (!profile) {
    return (
      <div className="page container">
        <section className="auth-hero">
          <div className="mono">Profile</div>
          <h1 className="display-title display-title-xl">Loading profile…</h1>
        </section>
      </div>
    );
  }

  return (
    <div className="page container">
      <section className="profile-grid">
        <ProfileCard profile={profile} isFollowing={isFollowing} onToggleFollow={toggleFollow} />
        <div className="profile-summary">
          <section className="profile-hero">
            <div className="mono">Thought stream</div>
            <h1 className="display-title display-title-xl">{profile.name}'s thoughts.</h1>
            <p className="section-copy section-copy-lg">A full profile page with follow/unfollow, profile details, and all of the user’s published thoughts.</p>
          </section>
          <SectionHeading eyebrow="Published thoughts" title="Everything this user has shared." />
          <div className="profile-thoughts">
            {thoughts.map((thought) => <ThoughtCard key={thought._id} thought={thought} compact />)}
          </div>
        </div>
      </section>
    </div>
  );
}
