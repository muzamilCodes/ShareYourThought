'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../hooks/useSession';

export default function ProfileRedirectPage() {
  const { session, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (session?.user?.username) {
      router.replace(`/profile/${session.user.username}`);
    } else {
      router.replace('/login');
    }
  }, [ready, session, router]);

  return (
    <div className="page container">
      <section className="auth-hero">
        <div className="mono">Profile</div>
        <h1 className="display-title display-title-xl">Redirecting to your profile…</h1>
      </section>
    </div>
  );
}
