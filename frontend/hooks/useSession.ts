'use client';

import { useEffect, useState } from 'react';
import type { AuthSession } from '../types';
import { api, clearStoredSession, readStoredSession, saveStoredSession } from '../lib/api';

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredSession();
    setSession(stored);
    setReady(true);

    // Sync fresh user role & profile from backend
    if (stored?.token) {
      api.me(stored.token)
        .then((res: { user: any }) => {
          if (res?.user) {
            const updated: AuthSession = {
              ...stored,
              user: {
                ...stored.user,
                ...res.user
              }
            };
            setSession(updated);
            saveStoredSession(updated);
          }
        })
        .catch(() => {});
    }

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
