'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AuthSession } from '../types';
import { api, saveStoredSession } from '../lib/api';

export function AuthForm({ mode, onSuccess }: { mode: 'login' | 'register'; onSuccess?: (session: AuthSession) => void }) {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', identifier: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      let session: AuthSession;
      if (mode === 'login') {
        const identifier = form.identifier || form.email || form.username;
        if (!identifier.trim()) {
          throw new Error('Please enter your email or username');
        }
        session = await api.login({ identifier: identifier.trim(), password: form.password });
      } else {
        if (!form.name.trim() || !form.username.trim() || !form.email.trim() || !form.password) {
          throw new Error('Please fill in all fields');
        }
        session = await api.register({
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password
        });
      }

      saveStoredSession(session);
      if (onSuccess) {
        onSuccess(session);
      } else {
        window.location.href = '/';
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {mode === 'register' ? (
        <>
          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input className="input" id="name" name="name" value={form.name} onChange={handleChange} placeholder="Mina Hart" required />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input className="input" id="username" name="username" value={form.username} onChange={handleChange} placeholder="minahart" required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="name@domain.com" required />
          </div>
        </>
      ) : (
        <div className="field">
          <label htmlFor="identifier">Email or Username</label>
          <input
            className="input"
            id="identifier"
            name="identifier"
            type="text"
            value={form.identifier}
            onChange={handleChange}
            placeholder="name@domain.com or username"
            required
            autoComplete="username"
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
        <Link className="button-outline" href={mode === 'login' ? '/register' : '/login'}>
          {mode === 'login' ? 'Need an account?' : 'Already have one?'}
        </Link>
      </div>

      {error ? <p className="helper" style={{ color: '#c86d34', fontWeight: 500 }}>{error}</p> : null}
    </form>
  );
}
