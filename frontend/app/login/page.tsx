'use client';

import { AuthForm } from '../../components/AuthForm';

export default function LoginPage() {
  return (
    <div className="page container">
      <div className="auth-shell">
        <div className="auth-hero">
          <div className="mono">Login</div>
          <h1 className="display-title display-title-xl">Enter the conversation again.</h1>
          <p className="section-copy section-copy-lg">Sign in to like, comment, follow, save, and publish thoughts. The interface stays editorial and quiet while the data stays real.</p>
        </div>
        <div className="form-card">
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  );
}
