'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import type { User } from '../types';

type FollowersModalProps = {
  type: 'followers' | 'following';
  username: string;
  token?: string;
  onClose: () => void;
};

export function FollowersModal({ type, username, token, onClose }: FollowersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchList = type === 'followers' ? api.getFollowers : api.getFollowing;
    fetchList(username, token)
      .then((res: any) => {
        const list = type === 'followers' ? res.followers : res.following;
        setUsers(list || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load list');
        setLoading(false);
      });
  }, [type, username, token]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          padding: '20px',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
            {type === 'followers' ? '👥 Followers' : '✨ Following'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              color: 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', padding: '20px 0' }}>
              Loading {type}...
            </p>
          ) : error ? (
            <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.88rem', padding: '20px 0' }}>
              {error}
            </p>
          ) : users.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', padding: '20px 0' }}>
              No {type} found.
            </p>
          ) : (
            users.map((u) => (
              <div
                key={u._id || u.username}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'var(--dark-soft)'
                }}
              >
                <Link
                  href={`/profile/${u.username}`}
                  onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
                >
                  <img
                    src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                    alt={u.name}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>@{u.username}</div>
                  </div>
                </Link>

                <Link
                  href={`/profile/${u.username}`}
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                >
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
