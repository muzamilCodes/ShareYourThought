'use client';

import { AuthForm } from '../../components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="page container">
      <div className="auth-shell">
        <div className="auth-hero">
          <div className="mono">Register</div>
          <h1 className="display-title display-title-xl">Create a place for your ideas.</h1>
          <p className="section-copy section-copy-lg">Set up your profile, start publishing, and follow the people whose thoughts you want to keep reading.</p>
        </div>
        <div className="form-card">
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
