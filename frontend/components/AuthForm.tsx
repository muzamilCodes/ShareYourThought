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
    if (error) setError('');
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
        if (!form.password) {
          throw new Error('Please enter your password');
        }
        session = await api.login({ identifier: identifier.trim(), password: form.password });
      } else {
        if (!form.name.trim()) throw new Error('Full Name is required');
        if (!form.username.trim()) throw new Error('Username is required');
        if (!form.email.trim()) throw new Error('Email address is required');
        if (!form.password || form.password.length < 8) throw new Error('Password must be at least 8 characters');

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
      {error ? (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(200, 109, 52, 0.1)',
            border: '1px solid rgba(200, 109, 52, 0.3)',
            borderRadius: '8px',
            color: '#b34714',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}
        >
          {error}
        </div>
      ) : null}

      {mode === 'register' ? (
        <>
          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input
              className="input"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Mina Hart"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              className="input"
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. minahart"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@domain.com"
              required
            />
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
    </form>
  );
}
