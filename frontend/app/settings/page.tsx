'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, saveStoredSession } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import { fileToCompressedDataUrl } from '@/lib/imageUtils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function SettingsPage() {
  const router = useRouter();
  const { session, ready, setSession, logout } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance'>('profile');
  
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: '',
    website: '',
    location: '',
    isPrivate: false
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ email: '', token: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (!session?.token || deletingAccount) return;
    setDeletingAccount(true);
    try {
      await api.deleteAccount(session.token);
      setShowDeleteModal(false);
      logout();
      router.push('/register');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        username: session.user.username || '',
        bio: session.user.bio || '',
        avatar: session.user.avatar || '',
        website: session.user.website || '',
        location: session.user.location || '',
        isPrivate: Boolean(session.user.isPrivate)
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
        setActiveTab('security');
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
      setProfileMessage('✅ Profile updated successfully!');
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
      setForgotMessage(data.message || 'If an account exists, a reset code was sent.');
    } catch (e) {
      setForgotMessage(e instanceof Error ? e.message : 'Failed to request reset');
    }
  };

  const finishReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordForm.email || !passwordForm.token || !passwordForm.password) {
      setPasswordMessage('Email, reset code, and new password are required');
      return;
    }
    setLoadingReset(true);
    setPasswordMessage('');

    try {
      const sessionData = await api.resetPassword(passwordForm);
      saveStoredSession(sessionData);
      setSession(sessionData);
      setPasswordMessage('✅ Password successfully updated! You are now signed in.');
    } catch (e) {
      setPasswordMessage(e instanceof Error ? e.message : 'Failed to reset password');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="page container" style={{ maxWidth: '650px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          href={`/profile/${session?.user?.username || ''}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.86rem',
            color: 'var(--muted)',
            marginBottom: '10px',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          ← Back to Profile
        </Link>
        <h1 className="display-title" style={{ fontSize: '1.75rem', margin: '0 0 6px 0', color: 'var(--ink)' }}>
          ⚙️ Profile & Account Settings
        </h1>
        <p className="section-copy" style={{ margin: 0, fontSize: '0.90rem' }}>
          Manage your personal profile, security preferences, and appearance.
        </p>
      </div>

      {/* Settings Tab Navigation */}
      <div
        className="feed-sort-tabs"
        style={{ width: '100%', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}
      >
        <button
          type="button"
          className={`feed-sort-tab ${activeTab === 'profile' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('profile')}
          style={{ flex: 1 }}
        >
          👤 Profile
        </button>
        <button
          type="button"
          className={`feed-sort-tab ${activeTab === 'security' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('security')}
          style={{ flex: 1 }}
        >
          🔐 Security
        </button>
        <button
          type="button"
          className={`feed-sort-tab ${activeTab === 'appearance' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('appearance')}
          style={{ flex: 1 }}
        >
          🎨 Appearance
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div>
          {ready && session ? (
            <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Profile Photo Uploader & Live Preview */}
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '20px',
                  borderRadius: '20px',
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <label style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '12px', display: 'block', color: 'var(--ink)' }}>
                  Profile Photo (Avatar)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                  <img
                    src={
                      profile.avatar ||
                      (profile.name
                        ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`
                        : 'https://api.dicebear.com/7.x/initials/svg?seed=User')
                    }
                    alt="Avatar preview"
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2.5px solid var(--ember)',
                      boxShadow: '0 4px 12px rgba(200,109,52,0.18)'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingAvatar(true);
                        try {
                          const dataUrl = await fileToCompressedDataUrl(file, 400, 0.85);
                          setProfile((prev) => ({ ...prev, avatar: dataUrl }));
                        } catch (err) {
                          setProfileMessage(err instanceof Error ? err.message : 'Could not process image');
                        } finally {
                          setUploadingAvatar(false);
                        }
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="button"
                        style={{ fontSize: '0.85rem', padding: '6px 14px', minHeight: 'auto' }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? 'Uploading…' : '📷 Change Photo'}
                      </button>
                      {profile.avatar ? (
                        <button
                          type="button"
                          className="button-ghost"
                          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                          onClick={() => {
                            setProfile((prev) => ({ ...prev, avatar: '' }));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Select JPG or PNG from camera or gallery.
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '24px',
                  borderRadius: '20px',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: 'var(--shadow)'
                }}
              >
                {(['name', 'username', 'bio', 'location', 'website'] as const).map((field) => (
                  <div key={field}>
                    <label
                      htmlFor={field}
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--muted)',
                        marginBottom: '6px'
                      }}
                    >
                      {field}
                    </label>
                    {field === 'bio' ? (
                      <textarea
                        className="textarea"
                        id={field}
                        value={profile[field]}
                        onChange={(e) => setProfile((prev) => ({ ...prev, [field]: e.target.value }))}
                        rows={3}
                        placeholder="Tell the community about yourself…"
                      />
                    ) : (
                      <input
                        className="input"
                        id={field}
                        value={profile[field]}
                        onChange={(e) => setProfile((prev) => ({ ...prev, [field]: e.target.value }))}
                        placeholder={field === 'website' ? 'https://example.com' : field === 'location' ? 'e.g. Kashmir, India' : ''}
                      />
                    )}
                  </div>
                ))}

                {/* Account Privacy Toggle */}
                <div
                  style={{
                    background: 'var(--dark-soft)',
                    padding: '16px 18px',
                    borderRadius: '16px',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    marginTop: '8px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.96rem', color: 'var(--ink)' }}>
                        🔒 Private Account
                      </strong>
                      <span
                        style={{
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: profile.isPrivate ? 'rgba(200, 109, 52, 0.2)' : 'var(--line)',
                          color: profile.isPrivate ? 'var(--ember)' : 'var(--muted)'
                        }}
                      >
                        {profile.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.80rem', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                      When enabled, only people who follow you can view your published thoughts and profile.
                    </span>
                  </div>

                  <label
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '48px',
                      height: '26px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profile.isPrivate}
                      onChange={(e) => setProfile((prev) => ({ ...prev, isPrivate: e.target.checked }))}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: profile.isPrivate ? 'var(--ember)' : 'var(--line-strong)',
                        borderRadius: '24px',
                        transition: '0.2s',
                        display: 'block'
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          height: '20px',
                          width: '20px',
                          left: profile.isPrivate ? '24px' : '3px',
                          bottom: '3px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transition: '0.2s',
                          display: 'block',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    </span>
                  </label>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button className="button" type="submit" disabled={loadingProfile || uploadingAvatar}>
                    {loadingProfile ? 'Saving…' : 'Save Profile Changes'}
                  </button>
                </div>

                {profileMessage ? (
                  <p
                    style={{
                      margin: '6px 0 0 0',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: profileMessage.includes('success') || profileMessage.includes('✅') ? '#16a34a' : 'var(--ember)'
                    }}
                  >
                    {profileMessage}
                  </p>
                ) : null}
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--paper)', borderRadius: '20px', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🔒</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>
                Account Required
              </h3>
              <p className="section-copy" style={{ margin: '0 auto 16px auto', fontSize: '0.90rem' }}>
                Sign in to edit your profile details.
              </p>
              <Link href="/login" className="button">
                Log In
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SECURITY */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Request Reset Box */}
          <div
            style={{
              background: 'var(--paper)',
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>
              Request Password Reset
            </h3>
            <p className="section-copy" style={{ margin: '0 0 16px 0', fontSize: '0.88rem' }}>
              We will generate a secure reset token for your account email.
            </p>
            <form onSubmit={requestReset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                className="input"
                type="email"
                placeholder="Enter your account email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <button className="button" type="submit" style={{ alignSelf: 'flex-start' }}>
                Send Reset Request
              </button>
              {forgotMessage ? (
                <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--ember)' }}>
                  {forgotMessage}
                </p>
              ) : null}
            </form>
          </div>

          {/* Set New Password Box */}
          <div
            style={{
              background: 'var(--paper)',
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--ink)' }}>
              Set New Password
            </h3>
            <p className="section-copy" style={{ margin: '0 0 16px 0', fontSize: '0.88rem' }}>
              Enter your reset token and your new chosen password.
            </p>
            <form onSubmit={finishReset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                className="input"
                type="email"
                placeholder="Email Address"
                value={passwordForm.email}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <input
                className="input"
                type="text"
                placeholder="Reset Token"
                value={passwordForm.token}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, token: e.target.value }))}
              />
              <input
                className="input"
                type="password"
                placeholder="New Secure Password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              <button className="button" type="submit" disabled={loadingReset} style={{ alignSelf: 'flex-start' }}>
                {loadingReset ? 'Updating…' : 'Update Password'}
              </button>
              {passwordMessage ? (
                <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: passwordMessage.includes('success') || passwordMessage.includes('✅') ? '#16a34a' : 'var(--ember)' }}>
                  {passwordMessage}
                </p>
              ) : null}
            </form>
          </div>

          {/* Danger Zone: Delete Account */}
          {session?.user && (
            <div
              style={{
                background: 'var(--paper)',
                padding: '24px',
                borderRadius: '20px',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ef4444' }}>
                  Danger Zone — Delete Account
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                Permanently delete your account, published thoughts, comments, and direct messages. This action is irreversible and cannot be undone.
              </p>
              <button
                type="button"
                className="button-outline"
                onClick={() => setShowDeleteModal(true)}
                disabled={deletingAccount}
                style={{
                  alignSelf: 'flex-start',
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  padding: '8px 18px',
                  marginTop: '4px'
                }}
              >
                {deletingAccount ? 'Deleting…' : '🗑️ Delete My Account'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: APPEARANCE */}
      {activeTab === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: 'var(--paper)',
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: 'var(--ink)', display: 'block' }}>
                Theme & Interface
              </strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '2px', display: 'block' }}>
                Toggle between Warm Editorial Light mode and Sleek Midnight Dark mode.
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div
            style={{
              background: 'var(--paper)',
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: 'var(--ink)', display: 'block' }}>
                📲 Install Web App (PWA)
              </strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '2px', display: 'block' }}>
                Install on your Desktop, Android, or iPhone for fast offline access.
              </span>
            </div>
            <button
              type="button"
              className="button"
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-pwa-install'))}
              style={{ fontSize: '0.86rem', padding: '8px 18px', minHeight: 'auto', whiteSpace: 'nowrap' }}
            >
              Install App 📲
            </button>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account Permanently?"
        message="Are you completely sure? This will permanently delete your account, all your thoughts, comments, likes, messages, and profile data from Share Your Thoughts. This action cannot be recovered."
        confirmText="Yes, Delete My Account"
        cancelText="Cancel"
        type="danger"
        loading={deletingAccount}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
