'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { session, ready } = useSession();

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
      <section className="auth-hero" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="mono">Profile</div>
        <h1 className="display-title display-title-xl">Opening your profile…</h1>
        <p className="section-copy section-copy-lg">Taking you to your thought stream.</p>
      </section>
    </div>
  );
}

