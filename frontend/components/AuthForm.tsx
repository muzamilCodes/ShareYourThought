'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { AuthSession } from '../types';
import { api, saveStoredSession } from '../lib/api';

export function AuthForm({
  mode: initialMode = 'register',
  onSuccess
}: {
  mode?: 'login' | 'register' | 'forgot';
  onSuccess?: (session: AuthSession) => void;
}) {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    newPassword: '',
    identifier: ''
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // OTP Verification States
  const [authStep, setAuthStep] = useState<'details' | 'otp'>('details');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [targetEmail, setTargetEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update mode if prop changes
  useEffect(() => {
    setCurrentMode(initialMode);
    setAuthStep('details');
    setError('');
    setSuccessMsg('');
  }, [initialMode]);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authStep, resendTimer]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    if (error) setError('');
  };

  const handleTabSwitch = (newMode: 'register' | 'login' | 'forgot') => {
    setCurrentMode(newMode);
    setAuthStep('details');
    setError('');
    setSuccessMsg('');
    setOtpCode(['', '', '', '', '', '']);
  };

  // Handle individual OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    if (error) setError('');
    const cleanVal = value.replace(/\D/g, ''); // numbers only

    if (!cleanVal) {
      const newOtp = [...otpCode];
      newOtp[index] = '';
      setOtpCode(newOtp);
      return;
    }

    // Handle paste of full 6 digits
    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otpCode];
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtpCode(newOtp);
      const nextIndex = Math.min(pastedDigits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otpCode];
    newOtp[index] = cleanVal.slice(-1);
    setOtpCode(newOtp);

    // Auto advance focus to next box
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key in OTP input
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 1: Submit Form (Send OTP or Direct Password Login)
  const handleInitialSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (currentMode === 'register') {
        if (!form.name.trim()) throw new Error('Full Name is required');
        if (!form.email.trim()) throw new Error('Email address is required');
        if (!form.password || form.password.length < 8) throw new Error('Password must be at least 8 characters');

        const res = await api.sendRegisterOtp({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password
        });

        setTargetEmail(res.email || form.email.trim());
        setSuccessMsg(res.message || `We sent a 6-digit verification code to ${form.email.trim()}`);
        setAuthStep('otp');
        setResendTimer(60);
        setCanResend(false);
        setOtpCode(['', '', '', '', '', '']);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } else if (currentMode === 'login') {
        const identifier = (form.identifier || form.email || form.username).trim();
        if (!identifier) {
          throw new Error('Please enter your email or username');
        }

        if (loginMethod === 'otp') {
          const res = await api.sendLoginOtp({ identifier });
          setTargetEmail(res.email || identifier);
          setSuccessMsg(res.message || `We sent a 6-digit login code to your email`);
          setAuthStep('otp');
          setResendTimer(60);
          setCanResend(false);
          setOtpCode(['', '', '', '', '', '']);
          setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
        } else {
          // Password Login
          if (!form.password) {
            throw new Error('Please enter your password');
          }
          const session = await api.login({ identifier, password: form.password });
          saveStoredSession(session);
          if (onSuccess) onSuccess(session);
          else router.push('/');
        }
      } else if (currentMode === 'forgot') {
        // Forgot Password Mode
        const email = (form.email || form.identifier).trim();
        if (!email) {
          throw new Error('Please enter your email address');
        }

        const res = await api.sendForgotPasswordOtp({ email });
        setTargetEmail(res.email || email);
        setSuccessMsg(res.message || `We sent a password reset code to ${email}`);
        setAuthStep('otp');
        setResendTimer(60);
        setCanResend(false);
        setOtpCode(['', '', '', '', '', '']);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    const fullCode = otpCode.join('').trim();
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let session: AuthSession;

      if (currentMode === 'register') {
        session = await api.verifyRegisterOtp({
          email: targetEmail || form.email.trim(),
          otp: fullCode,
          name: form.name.trim(),
          password: form.password
        });
      } else if (currentMode === 'login') {
        const identifier = (form.identifier || form.email || form.username).trim();
        session = await api.verifyLoginOtp({
          identifier: identifier || targetEmail,
          otp: fullCode
        });
      } else {
        // Forgot Password Reset
        if (!form.newPassword || form.newPassword.length < 8) {
          throw new Error('Please enter a new password (at least 8 characters)');
        }
        session = await api.verifyResetPasswordOtp({
          email: targetEmail || form.email.trim(),
          otp: fullCode,
          newPassword: form.newPassword
        });
      }

      saveStoredSession(session);
      if (onSuccess) {
        onSuccess(session);
      } else {
        router.push('/');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    setError('');
    try {
      if (currentMode === 'register') {
        const res = await api.sendRegisterOtp({
          name: form.name.trim(),
          email: targetEmail || form.email.trim(),
          password: form.password
        });
        setSuccessMsg(res.message || 'New verification code sent successfully!');
      } else if (currentMode === 'login') {
        const identifier = (form.identifier || form.email || form.username).trim();
        const res = await api.sendLoginOtp({ identifier: identifier || targetEmail });
        setSuccessMsg(res.message || 'New login code sent successfully!');
      } else {
        const res = await api.sendForgotPasswordOtp({ email: targetEmail || form.email.trim() });
        setSuccessMsg(res.message || 'New password reset code sent successfully!');
      }
      setResendTimer(60);
      setCanResend(false);
      setOtpCode(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card-wrap">
      {/* Top Tab Switcher */}
      {authStep === 'details' && (
        <div className="auth-tabs-nav">
          <button
            type="button"
            className={`auth-tab-btn ${currentMode === 'register' ? 'is-active' : ''}`}
            onClick={() => handleTabSwitch('register')}
          >
            Register
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${currentMode === 'login' ? 'is-active' : ''}`}
            onClick={() => handleTabSwitch('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${currentMode === 'forgot' ? 'is-active' : ''}`}
            onClick={() => handleTabSwitch('forgot')}
          >
            Forgot Password
          </button>
        </div>
      )}

      {/* Sub-toggle in Login Mode (Password vs OTP) */}
      {currentMode === 'login' && authStep === 'details' && (
        <div
          style={{
            display: 'flex',
            background: 'rgba(200, 109, 52, 0.08)',
            padding: '4px',
            borderRadius: '12px',
            gap: '6px',
            marginBottom: '18px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setLoginMethod('password');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: loginMethod === 'password' ? '#ffffff' : 'transparent',
              color: loginMethod === 'password' ? 'var(--ink)' : 'var(--muted)',
              boxShadow: loginMethod === 'password' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 150ms ease'
            }}
          >
            🔑 Password
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('otp');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: loginMethod === 'otp' ? '#ffffff' : 'transparent',
              color: loginMethod === 'otp' ? 'var(--ember)' : 'var(--muted)',
              boxShadow: loginMethod === 'otp' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 150ms ease'
            }}
          >
            ✨ Instant OTP
          </button>
        </div>
      )}

      {/* Alert Banners */}
      {error ? (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(200, 109, 52, 0.1)',
            border: '1px solid rgba(200, 109, 52, 0.3)',
            borderRadius: '10px',
            color: '#b34714',
            fontSize: '0.88rem',
            lineHeight: '1.4',
            marginBottom: '16px'
          }}
        >
          ⚠️ {error}
        </div>
      ) : null}

      {successMsg && !error ? (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            color: '#15803d',
            fontSize: '0.88rem',
            lineHeight: '1.4',
            marginBottom: '16px'
          }}
        >
          ✓ {successMsg}
        </div>
      ) : null}

      {/* STEP 1: Main Form Inputs */}
      {authStep === 'details' ? (
        <form className="form-grid" onSubmit={handleInitialSubmit}>
          {currentMode === 'register' && (
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
                <label htmlFor="email">Email Address</label>
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

              <div className="field">
                <label htmlFor="password">Password (Min. 8 chars)</label>
                <div className="password-wrapper">
                  <input
                    className="input"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </>
          )}

          {currentMode === 'login' && (
            <>
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

              {loginMethod === 'password' && (
                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="password">Password</label>
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('forgot')}
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--ember)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 600
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="password-wrapper">
                    <input
                      className="input"
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {currentMode === 'forgot' && (
            <div className="field">
              <label htmlFor="email">Registered Email Address</label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@domain.com"
                required
                autoComplete="email"
              />
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>
                We will send a 6-digit OTP to reset your password.
              </p>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '8px' }}>
            <button className="button" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading
                ? 'Please wait…'
                : currentMode === 'register'
                ? 'Send Verification OTP →'
                : currentMode === 'forgot'
                ? 'Send Reset Code →'
                : loginMethod === 'otp'
                ? 'Send Login Code →'
                : 'Sign In'}
            </button>
          </div>
        </form>
      ) : (
        /* STEP 2: OTP Verification Screen */
        <form className="form-grid" onSubmit={handleVerifyOtp}>
          <div
            style={{
              textAlign: 'center',
              padding: '6px 0 10px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '2.2rem' }}>✉️</span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ink)', fontWeight: 800 }}>
              {currentMode === 'forgot'
                ? 'Reset Your Password'
                : currentMode === 'login'
                ? 'Instant OTP Login'
                : 'Verify Email Address'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
              Enter the 6-digit code sent to <strong style={{ color: 'var(--ink)' }}>{targetEmail || form.email}</strong>
            </p>
          </div>

          {/* 6 Digit OTP Boxes */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              margin: '10px 0'
            }}
          >
            {otpCode.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                style={{
                  width: '46px',
                  height: '52px',
                  textAlign: 'center',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  borderRadius: '12px',
                  border: digit ? '2px solid var(--ember)' : '1.5px solid var(--line-strong)',
                  background: '#ffffff',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxShadow: digit ? '0 0 0 3px rgba(200, 109, 52, 0.15)' : 'none',
                  transition: 'all 150ms ease'
                }}
              />
            ))}
          </div>

          {/* If Forgot Password Mode, enter new password */}
          {currentMode === 'forgot' && (
            <div className="field" style={{ marginTop: '8px' }}>
              <label htmlFor="newPassword">New Password (Min. 8 characters)</label>
              <div className="password-wrapper">
                <input
                  className="input"
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new strong password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '10px' }}>
            <button
              className="button"
              type="submit"
              disabled={loading || otpCode.join('').length !== 6}
              style={{ width: '100%' }}
            >
              {loading
                ? 'Verifying…'
                : currentMode === 'forgot'
                ? 'Reset Password & Log In'
                : currentMode === 'register'
                ? 'Verify & Create Account'
                : 'Verify & Sign In'}
            </button>

            {/* Resend and Edit Details Links */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                marginTop: '12px',
                fontSize: '0.84rem'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthStep('details');
                  setError('');
                  setSuccessMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                ← Edit details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: canResend ? 'var(--ember)' : 'var(--muted)',
                  cursor: canResend ? 'pointer' : 'default',
                  fontWeight: 600,
                  padding: 0
                }}
              >
                {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}


