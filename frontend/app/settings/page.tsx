'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '@/components/SectionHeading';
import { api, saveStoredSession } from '@/lib/api';
import { useSession } from '@/hooks/useSession';

export default function SettingsPage() {
  const { session, ready, setSession } = useSession();
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: '',
    website: '',
    location: ''
  });
  const [passwordForm, setPasswordForm] = useState({ email: '', token: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        username: session.user.username || '',
        bio: session.user.bio || '',
        avatar: session.user.avatar || '',
        website: session.user.website || '',
        location: session.user.location || ''
      });
      setForgotEmail(session.user.email || '');
    }
  }, [session]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const resetToken = params.get('reset') || '';
      const email = params.get('email') || '';
      if (resetToken || email) {
        setPasswordForm((current) => ({
          ...current,
          token: resetToken || current.token,
          email: email || current.email
        }));
      }
    }
  }, []);

  const updateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.token) return;
    setLoadingProfile(true);
    setProfileMessage('');

    try {
      const data = await api.updateMe(profile, session.token);
      const nextSession = { ...session, user: data.user };
      saveStoredSession(nextSession);
      setSession(nextSession);
      setProfileMessage('Profile updated successfully!');
    } catch (e) {
      setProfileMessage(e instanceof Error ? e.message : 'Could not update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotMessage('Sending request…');

    try {
      const data = await api.forgotPassword({ email: forgotEmail.trim() });
      if (data.previewResetUrl) {
        setForgotMessage(`Reset link generated: ${data.previewResetUrl}`);
      } else {
        setForgotMessage(data.message || 'If an account exists, a reset link was sent.');
      }
    } catch (e) {
      setForgotMessage(e instanceof Error ? e.message : 'Failed to request reset');
    }
  };

  const finishReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordForm.email || !passwordForm.token || !passwordForm.password) {
      setPasswordMessage('Email, token, and new password are required');
      return;
    }
    setLoadingReset(true);
    setPasswordMessage('');

    try {
      const sessionData = await api.resetPassword(passwordForm);
      saveStoredSession(sessionData);
      setSession(sessionData);
      setPasswordMessage('Password successfully updated! You are now signed in.');
    } catch (e) {
      setPasswordMessage(e instanceof Error ? e.message : 'Failed to reset password');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="page container">
      <section className="page-frame">
        <div className="page-frame-main">
          <div className="mono eyebrow">Settings & Account</div>
          <h1 className="display-title display-title-xl">Manage your profile & security.</h1>
          <p className="section-copy section-copy-lg">
            Update your public profile, customize your bio, and manage your password.
          </p>

          {ready && session ? (
            <>
              <SectionHeading eyebrow="Profile" title="Edit your public profile." />
              <form className="form-grid" onSubmit={updateProfile}>
                {(['name', 'username', 'bio', 'avatar', 'website', 'location'] as const).map((field) => (
                  <div className="field" key={field}>
                    <label htmlFor={field} style={{ textTransform: 'capitalize' }}>
                      {field}
                    </label>
                    {field === 'bio' ? (
                      <textarea
                        className="textarea"
                        id={field}
                        name={field}
                        value={profile[field]}
                        onChange={(event) =>
                          setProfile((current) => ({ ...current, [field]: event.target.value }))
                        }
                        rows={3}
                      />
                    ) : (
                      <input
                        className="input"
                        id={field}
                        name={field}
                        value={profile[field]}
                        onChange={(event) =>
                          setProfile((current) => ({ ...current, [field]: event.target.value }))
                        }
                      />
                    )}
                  </div>
                ))}
                <div className="form-actions">
                  <button className="button" type="submit" disabled={loadingProfile}>
                    {loadingProfile ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
                {profileMessage ? (
                  <p
                    className="helper"
                    style={{ color: profileMessage.includes('success') ? '#4a7c59' : '#c86d34' }}
                  >
                    {profileMessage}
                  </p>
                ) : null}
              </form>
            </>
          ) : ready ? (
            <div className="note-card" style={{ marginBottom: '32px' }}>
              <div className="mono">Account Required</div>
              <p className="note-copy">
                Sign in to edit your profile information. <Link href="/login" style={{ textDecoration: 'underline' }}>Click here to login</Link>.
              </p>
            </div>
          ) : null}

          <SectionHeading eyebrow="Security" title="Request password reset." />
          <form className="form-grid" onSubmit={requestReset}>
            <div className="field">
              <label htmlFor="reset-email">Your Account Email</label>
              <input
                className="input"
                id="reset-email"
                type="email"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                placeholder="name@domain.com"
                required
              />
            </div>
            <div className="form-actions">
              <button className="button-outline" type="submit">
                Send Reset Link
              </button>
            </div>
            {forgotMessage ? <p className="helper" style={{ wordBreak: 'break-all' }}>{forgotMessage}</p> : null}
          </form>

          <SectionHeading eyebrow="Reset" title="Complete password reset." />
          <form className="form-grid" onSubmit={finishReset}>
            <div className="field">
              <label htmlFor="complete-email">Account Email</label>
              <input
                className="input"
                id="complete-email"
                type="email"
                value={passwordForm.email}
                onChange={(event) => setPasswordForm({ ...passwordForm, email: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="reset-token">Reset Token</label>
              <input
                className="input"
                id="reset-token"
                value={passwordForm.token}
                onChange={(event) => setPasswordForm({ ...passwordForm, token: event.target.value })}
                placeholder="Paste the reset token here"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="new-password">New Password</label>
              <input
                className="input"
                id="new-password"
                type="password"
                value={passwordForm.password}
                onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="form-actions">
              <button className="button-dark" type="submit" disabled={loadingReset}>
                {loadingReset ? 'Updating…' : 'Reset Password'}
              </button>
            </div>
            {passwordMessage ? (
              <p
                className="helper"
                style={{ color: passwordMessage.includes('successfully') ? '#4a7c59' : '#c86d34' }}
              >
                {passwordMessage}
              </p>
            ) : null}
          </form>
        </div>

        <aside className="page-frame-aside">
          <div className="note-card">
            <div className="mono">Account Security</div>
            <p className="note-copy">
              Your password is encrypted with bcrypt before being stored. Tokens expire after 30 minutes.
            </p>
          </div>
          <div className="note-card">
            <div className="mono">Profile Sync</div>
            <p className="note-copy">
              Changes to your name, avatar, or bio appear across all your thoughts and comments.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
