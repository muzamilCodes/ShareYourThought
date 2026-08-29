'use client';

import { useEffect, useState } from 'react';
import type { AuthSession } from '../types';
import { clearStoredSession, readStoredSession } from '../lib/api';

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readStoredSession());
    setReady(true);

    const handleExpired = () => {
      setSession(null);
    };

    window.addEventListener('auth-session-expired', handleExpired);
    window.addEventListener('storage', handleExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleExpired);
      window.removeEventListener('storage', handleExpired);
    };
  }, []);

  const logout = () => {
    clearStoredSession();
    setSession(null);
  };

  return { session, setSession, ready, logout };
}
